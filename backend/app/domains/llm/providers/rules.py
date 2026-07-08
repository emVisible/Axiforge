"""Rules-based AI provider (always available)."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.domains.narrative.ai_draft import prose_to_axs, suggest_character_layers


class RulesProvider:
    name = "rules"

    async def health_check(self) -> bool:
        return True

    async def suggest_character_layers(
        self,
        *,
        name: str,
        essence: str,
        tags: Optional[List[str]],
    ) -> Dict[str, Any]:
        return suggest_character_layers(name, essence, tags)

    async def prose_to_axs(
        self,
        *,
        prose: str,
        title: str,
        role_names: Optional[List[str]],
        default_speaker: str,
    ) -> str:
        return prose_to_axs(
            prose,
            title=title,
            role_names=role_names,
            default_speaker=default_speaker,
        )
