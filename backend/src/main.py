"""Axiforge API — unified application entry."""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.routes.character import router as character_router
from app.routes.editor.ai import router as editor_ai_router
from app.routes.editor.asset import router as editor_asset_router
from app.routes.editor.project import router as editor_project_router
from app.routes.identity import router as identity_router
from app.routes.player import router as player_router
from app.routes.relation import router as relation_router
from app.routes.report import router as report_router
from app.routes.user import router as user_router
from app.routes.search import router as search_router
from app.routes.story import router as story_router
from app.routes.tag import router as tag_router
from app.routes.upload import router as upload_router
from app.routes.version import router as version_router


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
        version="1.0.0",
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

    application.include_router(character_router)
    application.include_router(version_router)
    application.include_router(story_router)
    application.include_router(tag_router)
    application.include_router(relation_router)
    application.include_router(upload_router)
    application.include_router(editor_project_router)
    application.include_router(editor_asset_router)
    application.include_router(editor_ai_router)
    application.include_router(player_router)
    application.include_router(search_router)
    application.include_router(identity_router)
    application.include_router(report_router)
    application.include_router(user_router)

    @application.get("/")
    async def root():
        return {"name": "Axiforge API", "version": "1.0.0", "status": "running"}

    @application.get("/health")
    async def health():
        return {"status": "healthy", "version": "1.0.0"}

    return application


app = create_app()
