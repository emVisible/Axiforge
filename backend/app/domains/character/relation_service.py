# --- from services/relation.py ---
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import selectinload

from app.domains.character.models import CharacterRelation
from app.domains.character.models import Character
from app.domains.character.schemas import RelationCreate, RelationUpdate


class RelationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_relation(
        self, source_id: UUID, data: RelationCreate
    ) -> Optional[dict]:
        """创建关系，返回包含 target_name 的 dict"""
        # 验证目标角色存在
        target = await self.db.get(Character, data.target_id)
        if not target:
            return None

        relation = CharacterRelation(
            source_id=source_id,
            target_id=data.target_id,
            relation_type=data.relation_type,
            relation_name=data.relation_name,
            description=data.description,
            is_mutual=data.is_mutual,
        )
        self.db.add(relation)

        if data.is_mutual:
            reverse = CharacterRelation(
                source_id=data.target_id,
                target_id=source_id,
                relation_type=data.relation_type,
                relation_name=data.relation_name,
                description=data.description,
                is_mutual=True,
            )
            self.db.add(reverse)

        await self.db.commit()
        await self.db.refresh(relation)

        # 返回 dict（包含 target_name）
        tcd = target.character_data or {}
        return {
            "id": str(relation.id),
            "source_id": str(relation.source_id),
            "target_id": str(relation.target_id),
            "target_name": target.name,
            "target_essence": tcd.get("anchor", {}).get("essence"),
            "relation_name": relation.relation_name,
            "relation_type": relation.relation_type,
            "description": relation.description,
            "is_mutual": relation.is_mutual,
            "created_at": relation.created_at,
        }

    async def get_relations_for_character(self, character_id: UUID) -> List[dict]:
        result = await self.db.execute(
            select(CharacterRelation)
            .where(
                or_(
                    CharacterRelation.source_id == character_id,
                    CharacterRelation.target_id == character_id,
                )
            )
            .order_by(CharacterRelation.created_at.desc())
        )
        relations = result.scalars().all()

        output = []
        for r in relations:
            if r.source_id == character_id:
                other_id = r.target_id
                direction = "out"  # 我指向对方
            else:
                other_id = r.source_id
                direction = "in"  # 对方指向我

            target = await self.db.get(Character, other_id)
            if target:
                cd = target.character_data or {}
                output.append(
                    {
                        "id": str(r.id),
                        "source_id": str(r.source_id),
                        "target_id": str(r.target_id),
                        "target_name": target.name,
                        "target_essence": cd.get("anchor", {}).get("essence"),
                        "relation_name": r.relation_name,
                        "relation_type": r.relation_type,
                        "description": r.description,
                        "is_mutual": r.is_mutual,
                        "direction": direction,
                        "created_at": r.created_at,
                    }
                )
        return output

    async def get_relation_graph(self, character_id: UUID, depth: int = 1) -> dict:
        """获取以某角色为中心的图谱数据"""
        result = await self.db.execute(
            select(CharacterRelation).where(
                or_(
                    CharacterRelation.source_id == character_id,
                    CharacterRelation.target_id == character_id,
                )
            )
        )
        relations = result.scalars().all()

        center = await self.db.get(Character, character_id)
        if not center:
            return {"nodes": [], "links": []}

        cd = center.character_data or {}
        nodes = [
            {
                "id": str(center.id),
                "name": center.name,
                "essence": cd.get("anchor", {}).get("essence"),
                "is_center": True,
            }
        ]
        node_ids = {str(center.id)}
        links = []

        for r in relations:
            other_id = (
                str(r.target_id)
                if str(r.source_id) == str(character_id)
                else str(r.source_id)
            )

            # 添加节点
            if other_id not in node_ids:
                other = await self.db.get(Character, UUID(other_id))
                if other:
                    ocd = other.character_data or {}
                    nodes.append(
                        {
                            "id": other_id,
                            "name": other.name,
                            "essence": ocd.get("anchor", {}).get("essence"),
                            "is_center": False,
                        }
                    )
                    node_ids.add(other_id)

            # 添加连线
            links.append(
                {
                    "source": str(r.source_id),
                    "target": str(r.target_id),
                    "relation_name": r.relation_name,
                    "is_mutual": r.is_mutual,
                }
            )

        return {"nodes": nodes, "links": links}

    async def update_relation(
        self, relation_id: UUID, data: RelationUpdate
    ) -> Optional[CharacterRelation]:
        relation = await self.db.get(CharacterRelation, relation_id)
        if not relation:
            return None

        if data.relation_name is not None:
            relation.relation_name = data.relation_name
        if data.description is not None:
            relation.description = data.description
        if data.is_mutual is not None:
            relation.is_mutual = data.is_mutual

        await self.db.commit()
        await self.db.refresh(relation)
        return relation

    async def delete_relation(self, relation_id: UUID) -> bool:
        relation = await self.db.get(CharacterRelation, relation_id)
        if not relation:
            return False

        # 如果双向，同时删除反向关系
        if relation.is_mutual:
            reverse_result = await self.db.execute(
                select(CharacterRelation).where(
                    and_(
                        CharacterRelation.source_id == relation.target_id,
                        CharacterRelation.target_id == relation.source_id,
                        CharacterRelation.relation_name == relation.relation_name,
                    )
                )
            )
            reverse = reverse_result.scalar_one_or_none()
            if reverse:
                await self.db.delete(reverse)

        await self.db.delete(relation)
        await self.db.commit()
        return True

# --- from services/relation_presets.py ---
PRESET_RELATIONS = [
    # 亲属
    {"name": "父子", "category": "亲属", "mutual": False},
    {"name": "母子", "category": "亲属", "mutual": False},
    {"name": "兄妹", "category": "亲属", "mutual": True},
    {"name": "姐弟", "category": "亲属", "mutual": True},
    # 情感
    {"name": "恋人", "category": "情感", "mutual": True},
    {"name": "暗恋", "category": "情感", "mutual": False},
    {"name": "挚友", "category": "情感", "mutual": True},
    {"name": "宿敌", "category": "情感", "mutual": True},
    # 社会
    {"name": "师徒", "category": "社会", "mutual": False},
    {"name": "上下级", "category": "社会", "mutual": False},
    {"name": "盟友", "category": "社会", "mutual": True},
    {"name": "竞争对手", "category": "社会", "mutual": True},
    # 创作
    {"name": "Fork自", "category": "创作", "mutual": False},
    {"name": "同一世界观", "category": "创作", "mutual": True},
    {"name": "同一作者", "category": "创作", "mutual": True},
]

CATEGORIES = ["亲属", "情感", "社会", "创作"]


def get_presets_by_category() -> dict:
    """按分类返回预设关系"""
    result = {}
    for cat in CATEGORIES:
        result[cat] = [r for r in PRESET_RELATIONS if r["category"] == cat]
    return result
