"""Axiforge API — unified application entry."""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.core.body_limit import BodySizeLimitMiddleware
from app.core.rate_limit import RateLimitMiddleware
from app.core.security import SecurityHeadersMiddleware
from app.database import init_db
from app.domains.assets.router import routers as assets_routers
from app.domains.character.router import routers as character_routers
from app.domains.narrative.router import routers as narrative_routers
from app.domains.llm.router import router as llm_router
from app.domains.moderation.router import moderation_router
from app.domains.platform.admin_router import admin_router
from app.domains.platform.router import routers as platform_routers
from app.domains.platform.search_router import router as search_router
from app.domains.ginkgo.router import ginkgo_router
from app.domains.nexus.router import nexus_router
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

    origins = settings.cors_origins if settings.cors_origins else ["*"]
    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_middleware(BodySizeLimitMiddleware)
    application.add_middleware(SecurityHeadersMiddleware)
    application.add_middleware(RateLimitMiddleware)

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
    application.include_router(admin_router)
    application.include_router(llm_router)
    application.include_router(moderation_router)
    application.include_router(ginkgo_router)
    application.include_router(nexus_router)

    @application.get("/")
    async def root():
        return {"name": "Axiforge API", "version": "2.0.0", "status": "running"}

    @application.get("/health")
    async def health():
        return {"status": "healthy", "version": "2.0.0"}

    return application


app = create_app()
