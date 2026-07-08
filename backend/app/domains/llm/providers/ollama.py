"""Ollama chat provider."""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

import httpx

from app.domains.llm.prompts import (
    prose_to_axs_system,
    prose_to_axs_user,
    suggest_character_system,
    suggest_character_user,
)


def _extract_json(text: str) -> Dict[str, Any]:
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    return json.loads(text)


class OllamaProvider:
    def __init__(self, *, base_url: str, model: str):
        self.name = "ollama"
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def _chat(self, messages: List[Dict[str, str]]) -> str:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={"model": self.model, "messages": messages, "stream": False},
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False

    async def suggest_character_layers(
        self,
        *,
        name: str,
        essence: str,
        tags: Optional[List[str]],
    ) -> Dict[str, Any]:
        content = await self._chat(
            [
                {"role": "system", "content": suggest_character_system()},
                {
                    "role": "user",
                    "content": suggest_character_user(name, essence, tags),
                },
            ]
        )
        return _extract_json(content)

    async def prose_to_axs(
        self,
        *,
        prose: str,
        title: str,
        role_names: Optional[List[str]],
        default_speaker: str,
    ) -> str:
        content = await self._chat(
            [
                {"role": "system", "content": prose_to_axs_system()},
                {
                    "role": "user",
                    "content": prose_to_axs_user(
                        prose,
                        title=title,
                        role_names=role_names,
                        default_speaker=default_speaker,
                    ),
                },
            ]
        )
        return content.strip() + "\n"
