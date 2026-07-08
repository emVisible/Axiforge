"""LLM provider protocol."""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Protocol


class AiProvider(Protocol):
    name: str

    async def health_check(self) -> bool:
        ...

    async def suggest_character_layers(
        self,
        *,
        name: str,
        essence: str,
        tags: Optional[List[str]],
    ) -> Dict[str, Any]:
        ...

    async def prose_to_axs(
        self,
        *,
        prose: str,
        title: str,
        role_names: Optional[List[str]],
        default_speaker: str,
    ) -> str:
        ...
