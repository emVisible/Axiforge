"""OpenAI-compatible chat provider (Xinference / OpenAI / DeepSeek)."""

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


class OpenAICompatibleProvider:
    def __init__(
        self,
        *,
        name: str,
        base_url: str,
        model: str,
        api_key: str = "",
    ):
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.api_key = api_key

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def _chat(self, messages: List[Dict[str, str]]) -> str:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self._headers(),
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{self.base_url.rsplit('/v1', 1)[0]}/v1/models",
                    headers=self._headers(),
                )
                return response.status_code < 500
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
