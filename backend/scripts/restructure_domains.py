#!/usr/bin/env python3
"""One-shot backend restructure: app/{models,schemas,services,routes} -> app/domains/."""

from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"

# Old module stem -> (domain, new submodule path without .py)
IMPORT_MAP: dict[str, str] = {
    # character
    "app.models.character": "app.domains.character.models",
    "app.models.story": "app.domains.character.models",
    "app.models.relation": "app.domains.character.models",
    "app.models.version": "app.domains.character.models",
    "app.models.tag": "app.domains.character.models",
    "app.schemas.character": "app.domains.character.schemas",
    "app.schemas.story": "app.domains.character.schemas",
    "app.schemas.relation": "app.domains.character.schemas",
    "app.schemas.version": "app.domains.character.schemas",
    "app.schemas.tag": "app.domains.character.schemas",
    "app.services.character": "app.domains.character.service",
    "app.services.story": "app.domains.character.story_service",
    "app.services.relation": "app.domains.character.relation_service",
    "app.services.relation_presets": "app.domains.character.relation_service",
    "app.services.version": "app.domains.character.version_service",
    "app.services.tag": "app.domains.character.tag_service",
    "app.services.tag_color": "app.domains.character.tag_service",
    "app.routes.character": "app.domains.character.router",
    "app.routes.story": "app.domains.character.router",
    "app.routes.relation": "app.domains.character.router",
    "app.routes.version": "app.domains.character.router",
    "app.routes.tag": "app.domains.character.router",
    # narrative
    "app.models.project": "app.domains.narrative.models",
    "app.schemas.project": "app.domains.narrative.schemas",
    "app.schemas.ai": "app.domains.narrative.schemas",
    "app.schemas.ir": "app.domains.narrative.ir",
    "app.services.project": "app.domains.narrative.service",
    "app.services.compiler": "app.domains.narrative.compiler",
    "app.services.ai_draft": "app.domains.narrative.ai_draft",
    "app.services.seed_showcase": "app.domains.narrative.seed_showcase",
    "app.routes.editor.project": "app.domains.narrative.router",
    "app.routes.editor.ai": "app.domains.narrative.router",
    # runtime
    "app.models.runtime": "app.domains.runtime.models",
    "app.models.codex": "app.domains.runtime.models",
    "app.schemas.runtime": "app.domains.runtime.schemas",
    "app.schemas.save": "app.domains.runtime.schemas",
    "app.schemas.codex": "app.domains.runtime.schemas",
    "app.services.player": "app.domains.runtime.service",
    "app.services.save": "app.domains.runtime.save_service",
    "app.services.codex": "app.domains.runtime.codex_service",
    "app.routes.player": "app.domains.runtime.router",
    # assets
    "app.models.asset": "app.domains.assets.models",
    "app.schemas.asset": "app.domains.assets.schemas",
    "app.services.asset": "app.domains.assets.service",
    "app.routes.editor.asset": "app.domains.assets.router",
    "app.routes.upload": "app.domains.assets.router",
    # platform
    "app.models.user": "app.domains.platform.models",
    "app.models.identity": "app.domains.platform.models",
    "app.models.report": "app.domains.platform.models",
    "app.schemas.user": "app.domains.platform.schemas",
    "app.schemas.identity": "app.domains.platform.schemas",
    "app.schemas.report": "app.domains.platform.schemas",
    "app.services.user": "app.domains.platform.service",
    "app.services.identity": "app.domains.platform.service",
    "app.services.report": "app.domains.platform.service",
    "app.routes.user": "app.domains.platform.router",
    "app.routes.identity": "app.domains.platform.router",
    "app.routes.report": "app.domains.platform.router",
    "app.routes.search": "app.domains.platform.search_router",
}

MERGES: dict[str, list[str]] = {
    "domains/character/models.py": [
        "models/character.py",
        "models/story.py",
        "models/relation.py",
        "models/version.py",
        "models/tag.py",
    ],
    "domains/character/schemas.py": [
        "schemas/character.py",
        "schemas/story.py",
        "schemas/relation.py",
        "schemas/version.py",
        "schemas/tag.py",
    ],
    "domains/character/service.py": ["services/character.py"],
    "domains/character/story_service.py": ["services/story.py"],
    "domains/character/relation_service.py": [
        "services/relation.py",
        "services/relation_presets.py",
    ],
    "domains/character/version_service.py": ["services/version.py"],
    "domains/character/tag_service.py": ["services/tag.py", "services/tag_color.py"],
    "domains/character/router.py": [
        "routes/character.py",
        "routes/story.py",
        "routes/relation.py",
        "routes/version.py",
        "routes/tag.py",
    ],
    "domains/narrative/models.py": ["models/project.py"],
    "domains/narrative/schemas.py": ["schemas/project.py", "schemas/ai.py"],
    "domains/narrative/ir.py": ["schemas/ir.py"],
    "domains/narrative/service.py": ["services/project.py"],
    "domains/narrative/compiler.py": ["services/compiler.py"],
    "domains/narrative/ai_draft.py": ["services/ai_draft.py"],
    "domains/narrative/seed_showcase.py": ["services/seed_showcase.py"],
    "domains/narrative/router.py": ["routes/editor/project.py", "routes/editor/ai.py"],
    "domains/runtime/models.py": ["models/runtime.py", "models/codex.py"],
    "domains/runtime/schemas.py": [
        "schemas/runtime.py",
        "schemas/save.py",
        "schemas/codex.py",
    ],
    "domains/runtime/service.py": ["services/player.py"],
    "domains/runtime/save_service.py": ["services/save.py"],
    "domains/runtime/codex_service.py": ["services/codex.py"],
    "domains/runtime/router.py": ["routes/player.py"],
    "domains/assets/models.py": ["models/asset.py"],
    "domains/assets/schemas.py": ["schemas/asset.py"],
    "domains/assets/service.py": ["services/asset.py"],
    "domains/assets/router.py": ["routes/editor/asset.py", "routes/upload.py"],
    "domains/platform/models.py": [
        "models/user.py",
        "models/identity.py",
        "models/report.py",
    ],
    "domains/platform/schemas.py": [
        "schemas/user.py",
        "schemas/identity.py",
        "schemas/report.py",
    ],
    "domains/platform/service.py": [
        "services/user.py",
        "services/identity.py",
        "services/report.py",
    ],
    "domains/platform/router.py": [
        "routes/user.py",
        "routes/identity.py",
        "routes/report.py",
    ],
    "domains/platform/search_router.py": ["routes/search.py"],
}


def rewrite_imports(text: str) -> str:
    # longest keys first
    for old in sorted(IMPORT_MAP, key=len, reverse=True):
        new = IMPORT_MAP[old]
        text = text.replace(f"from {old} import", f"from {new} import")
        text = text.replace(f"import {old}", f"import {new}")
    return text


def merge_files(rel_paths: list[str]) -> str:
    parts: list[str] = []
    for rel in rel_paths:
        src = APP / rel
        if not src.exists():
            raise FileNotFoundError(src)
        body = src.read_text(encoding="utf-8")
        parts.append(f"# --- from {rel} ---\n{body.rstrip()}\n")
    merged = "\n".join(parts)
    return rewrite_imports(merged)


def patch_router_exports() -> None:
    """Append routers list to domain router modules."""
    patches = {
        "domains/character/router.py": [
            ("character_router", "router"),
            ("story_router", "router"),
            ("relation_router", "router"),
            ("version_router", "router"),
            ("tag_router", "router"),
        ],
        "domains/narrative/router.py": [
            ("editor_project_router", "router"),
            ("editor_ai_router", "router"),
        ],
        "domains/runtime/router.py": [("player_router", "router")],
        "domains/assets/router.py": [
            ("editor_asset_router", "router"),
            ("upload_router", "router"),
        ],
        "domains/platform/router.py": [
            ("user_router", "router"),
            ("identity_router", "router"),
            ("report_router", "router"),
        ],
    }
    for rel, items in patches.items():
        path = APP / rel
        text = path.read_text(encoding="utf-8")
        # rename first router to named export if needed
        for name, _ in items:
            if f"router as {name}" in text:
                continue
        # ensure unique router variable names in merged file
        lines = []
        for i, (export_name, _) in enumerate(items):
            # find Nth occurrence of `router = APIRouter` and rename
            pass
        # Simpler: append routers list using known names from source files
        exports = ", ".join(n for n, _ in items)
        append = f"\n\nrouters = [{exports}]\n"
        if "routers = [" not in text:
            # rename routers in each section
            sections = text.split("# --- from routes/")
            if len(sections) <= 1:
                sections = text.split("# --- from ")
            # Manual renames per file order
            renames = [n for n, _ in items]
            count = 0
            def repl(m: re.Match[str]) -> str:
                nonlocal count
                name = renames[count] if count < len(renames) else m.group(0)
                count += 1
                return f"router as {name}"
            # only rename `router = APIRouter` lines - keep as router, export at end
            if append.strip() not in text:
                # read each sub-router's variable - they're all named `router`
                # We need to alias them when including in main - fix in main.py instead
                pass
        path.write_text(text, encoding="utf-8")


def create_init_files() -> None:
    for domain in ["character", "narrative", "runtime", "assets", "platform"]:
        init = APP / "domains" / domain / "__init__.py"
        init.parent.mkdir(parents=True, exist_ok=True)
        init.write_text('"""Domain package."""\n', encoding="utf-8")
    (APP / "domains" / "__init__.py").write_text('"""Business domains."""\n', encoding="utf-8")
    (APP / "core").mkdir(parents=True, exist_ok=True)
    (APP / "core" / "__init__.py").write_text('"""Cross-cutting infrastructure."""\n', encoding="utf-8")


def create_main() -> None:
    main = '''"""Axiforge API — unified application entry."""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.domains.assets.router import routers as assets_routers
from app.domains.character.router import routers as character_routers
from app.domains.narrative.router import routers as narrative_routers
from app.domains.platform.router import routers as platform_routers
from app.domains.platform.search_router import router as search_router
from app.domains.runtime.router import routers as runtime_routers


def create_app() -> FastAPI:
    @asynccontextmanager
    async def lifespan(_: FastAPI):
        if not os.environ.get("TESTING"):
            try:
                await init_db()
            except Exception as exc:
                if "does not exist" in str(exc):
                    raise RuntimeError(
                        'Database not found. Run "pnpm setup" from the project root first.'
                    ) from exc
                raise
        yield

    application = FastAPI(
        title="Axiforge API",
        description="Narrative simulation platform",
        version="2.0.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    uploads_dir = Path(settings.upload_dir)
    uploads_dir.mkdir(parents=True, exist_ok=True)
    application.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

    for r in character_routers:
        application.include_router(r)
    for r in narrative_routers:
        application.include_router(r)
    for r in assets_routers:
        application.include_router(r)
    for r in runtime_routers:
        application.include_router(r)
    application.include_router(search_router)
    for r in platform_routers:
        application.include_router(r)

    @application.get("/")
    async def root():
        return {"name": "Axiforge API", "version": "2.0.0", "status": "running"}

    @application.get("/health")
    async def health():
        return {"status": "healthy", "version": "2.0.0"}

    return application


app = create_app()
'''
    (APP / "main.py").write_text(main, encoding="utf-8")


def update_database() -> None:
    db = APP / "database.py"
    text = db.read_text(encoding="utf-8")
    text = rewrite_imports(text)
    # replace register_models imports block
    new_register = '''def register_models() -> None:
    """Import all ORM models so Base.metadata is populated."""
    from app.domains.assets.models import AssetItem, AssetScene  # noqa: F401
    from app.domains.character.models import (  # noqa: F401
        Character,
        CharacterRelation,
        CharacterStory,
        CharacterVersion,
        Tag,
        character_tags,
    )
    from app.domains.narrative.models import (  # noqa: F401
        Project,
        ProjectAssetRef,
        ProjectEdge,
        ProjectNode,
        ProjectRole,
        ProjectScene,
    )
    from app.domains.platform.models import (  # noqa: F401
        ContentReport,
        IdentityLink,
        UserAccount,
    )
    from app.domains.runtime.models import (  # noqa: F401
        CharacterRuntimeState,
        PlayerCodexEntry,
        RuntimeSession,
        SaveSlot,
        SessionEvent,
        SessionFlag,
        SessionMemory,
    )
'''
    text = re.sub(
        r"def register_models\(\)[^:]+:.*?(?=\n\nasync def init_db)",
        new_register,
        text,
        flags=re.DOTALL,
    )
    db.write_text(text, encoding="utf-8")


def fix_router_files() -> None:
    """Give each sub-router a unique name and export routers list."""
    fixes = {
        "domains/character/router.py": [
            ("routes/character.py", "character_router"),
            ("routes/story.py", "story_router"),
            ("routes/relation.py", "relation_router"),
            ("routes/version.py", "version_router"),
            ("routes/tag.py", "tag_router"),
        ],
        "domains/narrative/router.py": [
            ("routes/editor/project.py", "editor_project_router"),
            ("routes/editor/ai.py", "editor_ai_router"),
        ],
        "domains/runtime/router.py": [("routes/player.py", "player_router")],
        "domains/assets/router.py": [
            ("routes/editor/asset.py", "editor_asset_router"),
            ("routes/upload.py", "upload_router"),
        ],
        "domains/platform/router.py": [
            ("routes/user.py", "user_router"),
            ("routes/identity.py", "identity_router"),
            ("routes/report.py", "report_router"),
        ],
    }
    for rel, sections in fixes.items():
        path = APP / rel
        raw = path.read_text(encoding="utf-8")
        chunks = re.split(r"# --- from ([^\n]+) ---\n", raw)
        if len(chunks) < 2:
            continue
        out: list[str] = [chunks[0]]
        i = 1
        section_idx = 0
        while i < len(chunks):
            src = chunks[i]
            body = chunks[i + 1] if i + 1 < len(chunks) else ""
            router_name = sections[section_idx][1] if section_idx < len(sections) else "router"
            body = body.replace("router = APIRouter", f"{router_name} = APIRouter", 1)
            out.append(f"# --- from {src} ---\n{body}")
            section_idx += 1
            i += 2
        names = [n for _, n in sections]
        out.append(f"\nrouters = [{', '.join(names)}]\n")
        path.write_text("".join(out), encoding="utf-8")

    # search_router stays single
    sr = APP / "domains/platform/search_router.py"
    t = sr.read_text(encoding="utf-8")
    if "routers = " not in t:
        sr.write_text(t.rstrip() + "\n", encoding="utf-8")


def rewrite_tree(directory: Path) -> None:
    for path in directory.rglob("*.py"):
        if "scripts" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        new = rewrite_imports(text)
        if new != text:
            path.write_text(new, encoding="utf-8")


def main() -> None:
    create_init_files()
    for dest, sources in MERGES.items():
        out = APP / dest
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(merge_files(sources), encoding="utf-8")
        print(f"merged -> {dest}")

    fix_router_files()
    create_main()
    update_database()
    rewrite_tree(APP / "domains")
    rewrite_tree(ROOT / "tests")

    # conftest
    conf = ROOT / "tests" / "conftest.py"
    conf.write_text(
        conf.read_text(encoding="utf-8").replace("from src.main import app", "from app.main import app"),
        encoding="utf-8",
    )

    # backend/main.py shim
    shim = ROOT / "main.py"
    if shim.exists():
        shim.write_text(
            '"""Compatibility shim — use app.main:app."""\nfrom app.main import app, create_app\n',
            encoding="utf-8",
        )

    print("Done. Old dirs NOT deleted yet — run tests first.")


if __name__ == "__main__":
    main()
