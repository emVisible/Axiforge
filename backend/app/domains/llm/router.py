"""LLM health and status endpoints."""

from fastapi import APIRouter

from app.domains.llm import service as llm_service

router = APIRouter(prefix="/api/v1/llm", tags=["llm"])


@router.get("/health")
async def llm_health():
    return await llm_service.health_status()
