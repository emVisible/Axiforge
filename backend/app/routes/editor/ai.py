from fastapi import APIRouter

from app.schemas.ai import (
    CharacterSuggestRequest,
    CharacterSuggestResponse,
    ProseToScriptRequest,
    ProseToScriptResponse,
)
from app.services.ai_draft import prose_to_script, suggest_character_layers

router = APIRouter(prefix="/api/v1/editor/ai", tags=["editor-ai"])


@router.post("/prose-to-script", response_model=ProseToScriptResponse)
async def ai_prose_to_script(body: ProseToScriptRequest):
    script = prose_to_script(body.prose, body.role_names)
    return ProseToScriptResponse(script=script)


@router.post("/suggest-character", response_model=CharacterSuggestResponse)
async def ai_suggest_character(body: CharacterSuggestRequest):
    layers = suggest_character_layers(body.name, body.essence, body.tags)
    return CharacterSuggestResponse(layers=layers)
