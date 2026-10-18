# --- from services/character.py ---
import copy
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.content_validate import validate_publish_text
from app.domains.moderation.background import schedule_review
from app.core.strike_policy import publish_block_reasons
from app.domains.character.models import Character
from app.domains.character.models import Tag
from app.domains.character.schemas import CharacterCreate, CharacterUpdate
from app.domains.character.schemas import RelationCreate

from app.domains.character.relation_service import RelationService
from app.domains.character.version_service import VersionService
from app.domains.character.tag_service import TagService


class CharacterService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.tag_service = TagService(db)

    async def create_character(self, character: CharacterCreate) -> Character:
        cd = character.character_data
        name = cd.anchor.name or "未命名"
        tag_names = cd.anchor.tags if hasattr(cd.anchor, "tags") else []

        tags = await self.tag_service.get_or_create_tags(tag_names)

        db_character = Character(
            name=name,
            author_id=character.author_id,
            character_data=cd.model_dump(),
            is_public=character.is_public,
            image_path=character.image_path,
            tags=tags,
        )
        self.db.add(db_character)
        await self.db.commit()

        result = await self.db.execute(
            select(Character)
            .where(Character.id == db_character.id)
            .options(selectinload(Character.tags))
        )
        db_character = result.scalar_one()

        await self.tag_service.update_tag_counts([t.id for t in tags])
        await self.db.commit()
        return db_character

    async def get_characters_batch(self, ids: list[UUID]) -> list[Character]:
        """按 id 集合批量获取（工程目录装载用，消除 N+1）。缺失 id 静默跳过。"""
        if not ids:
            return []
        result = await self.db.execute(
            select(Character)
            .where(Character.id.in_(ids))
            .options(selectinload(Character.tags))
        )
        return list(result.scalars().all())

    async def get_character(
        self,
        character_id: UUID,
        *,
        bump_view: bool = False,
        viewer_token: str | None = None,
    ) -> Optional[Character]:
        result = await self.db.execute(
            select(Character)
            .where(Character.id == character_id)
            .options(selectinload(Character.tags))
        )
        character = result.scalar_one_or_none()
        if character and bump_view:
            from app.core.view_dedup import should_count_content_view

            if await should_count_content_view(
                self.db,
                subject_type="character",
                subject_id=str(character_id),
                viewer_token=viewer_token,
            ):
                character.view_count = (character.view_count or 0) + 1
                await self.db.commit()
        return character

    async def get_public_characters(
        self, skip: int = 0, limit: int = 20
    ) -> List[Character]:
        result = await self.db.execute(
            select(Character)
            .where(Character.is_public == True)
            .order_by(Character.created_at.desc())
            .offset(skip)
            .limit(limit)
            .options(selectinload(Character.tags))
        )
        return result.scalars().unique().all()

    async def search_public_characters(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        tag_names: Optional[List[str]] = None,
        sort_by: str = "recent",
    ) -> Tuple[List[Character], int]:
        base = select(Character).where(Character.is_public == True)

        if tag_names:
            cleaned = [n.lower().strip() for n in tag_names if n.strip()]
            if cleaned:
                base = base.join(Character.tags).where(Tag.name.in_(cleaned))

        if search:
            term = f"%{search}%"
            base = base.where(
                or_(
                    Character.name.ilike(term),
                    Character.character_data["anchor"]["essence"].astext.ilike(term),
                    Character.character_data["contour"]["name"].astext.ilike(term),
                )
            )

        count_stmt = select(func.count()).select_from(base.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar() or 0

        # 排序
        if sort_by == "popular":
            base = base.order_by(Character.view_count.desc())
        else:
            base = base.order_by(Character.created_at.desc())

        base = base.offset(skip).limit(limit).options(selectinload(Character.tags))

        result = await self.db.execute(base)
        characters = result.scalars().unique().all()

        return characters, total

    async def get_user_characters(self, author_id: str) -> List[Character]:
        result = await self.db.execute(
            select(Character)
            .where(Character.author_id == author_id)
            .order_by(Character.updated_at.desc())
            .options(selectinload(Character.tags))
        )
        return result.scalars().unique().all()

    async def delete_character(self, character_id: UUID) -> bool:
        from app.domains.character.version_service import VersionService

        character = await self.get_character(character_id)
        if not character:
            return False
        tag_ids = [t.id for t in character.tags]

        version_service = VersionService(self.db)
        await version_service.delete_versions(character_id)

        await self.db.delete(character)
        await self.db.commit()
        if tag_ids:
            await self.tag_service.update_tag_counts(tag_ids)
            await self.db.commit()
        return True

    async def fork_character(
        self,
        character_id: UUID,
        new_name: Optional[str] = None,
        new_author_id: str = "anonymous",
    ) -> Optional[Tuple[Character, Character]]:
        original = await self.get_character(character_id)
        if not original:
            return None

        forked_data = copy.deepcopy(original.character_data)

        if new_name:
            final_name = new_name
        else:
            base_name = original.name.replace(" (Fork)", "")
            result = await self.db.execute(
                select(Character)
                .where(Character.fork_from == character_id)
                .where(Character.author_id == new_author_id)
            )
            existing = result.scalars().all()
            final_name = (
                f"{base_name} (Fork {len(existing) + 1})"
                if existing
                else f"{base_name} (Fork)"
            )

        if "contour" in forked_data:
            forked_data["contour"]["name"] = final_name

        forked = Character(
            name=final_name,
            author_id=new_author_id,
            character_data=forked_data,
            is_public=False,
            tags=original.tags,
            image_path=original.image_path,
            fork_from=character_id,
        )
        self.db.add(forked)
        await self.db.commit()
        await self.db.refresh(forked, ["tags"])
        relation_service = RelationService(self.db)
        await relation_service.create_relation(
            source_id=forked.id,
            data=RelationCreate(
                target_id=original.id,
                relation_name="Fork",
                relation_type="preset",
                is_mutual=False,
            ),
        )

        return (original, forked)

    async def get_fork_chain(self, character_id: UUID) -> Optional[dict]:
        character = await self.get_character(character_id)
        if not character:
            return None

        original_id = character.fork_from or character.id
        original = await self.get_character(original_id)

        # 如果原始角色被删了，把当前角色当作 original
        if not original:
            original = character
            original_id = character.id

        result = await self.db.execute(
            select(Character)
            .where((Character.fork_from == original_id) | (Character.id == original_id))
            .order_by(Character.created_at)
            .options(selectinload(Character.tags))
        )
        chain = result.scalars().unique().all()

        return {
            "original": original,
            "chain": chain,
            "total_forks": len([c for c in chain if c.id != original_id]),
        }

    async def update_character(
        self, character_id: UUID, update: CharacterUpdate
    ) -> Optional[Character]:
        from app.domains.character.version_service import VersionService

        character = await self.get_character(character_id)
        if not character:
            return None

        version_service = VersionService(self.db)
        await version_service.create_version(character)
        if update.image_path is not None:
            character.image_path = update.image_path

        if update.character_data is not None:
            cd = update.character_data
            character.character_data = cd.model_dump()
            character.name = cd.anchor.name or character.name

            # tags 从 anchor.tags 取
            tag_names = cd.anchor.tags if cd.anchor.tags else []
            tags = await self.tag_service.get_or_create_tags(tag_names)
            character.tags = tags
            await self.db.flush()
            await self.tag_service.update_tag_counts([t.id for t in tags])

        if update.is_public is not None:
            if update.is_public:
                summary = ""
                if update.character_data is not None:
                    summary = update.character_data.anchor.essence or ""
                elif character.character_data:
                    summary = (character.character_data.get("anchor") or {}).get(
                        "essence", ""
                    )
                errors = validate_publish_text(character.name, summary)
                errors.extend(await publish_block_reasons(self.db, character.author_id))
                if errors:
                    raise ValueError("; ".join(errors))
            character.is_public = update.is_public
            needs_review = True

        await self.db.commit()
        await self.db.refresh(character, ["tags"])
        # 公开瞬间留一次痕，派到后台（ADR-028 的"发布只跑规则校验"不变：
        # 判断层既不阻塞发布，也不参与这里的放行判定）。
        if needs_review:
            schedule_review("character", character.id)
        return character
