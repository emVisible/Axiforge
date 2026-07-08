"""LLM provider registry and fallback chain."""

from __future__ import annotations

from typing import List

from app.config import settings
from app.domains.llm.providers.ollama import OllamaProvider
from app.domains.llm.providers.openai_compat import OpenAICompatibleProvider
from app.domains.llm.providers.rules import RulesProvider


def build_provider_chain() -> List[object]:
    mode = settings.llm_provider.lower()
    rules = RulesProvider()
    chain: List[object] = []

    if mode in ("auto", "xinference"):
        chain.append(
            OpenAICompatibleProvider(
                name="xinference",
                base_url=settings.xinference_base_url,
                model=settings.xinference_model,
            )
        )
    if mode in ("auto", "ollama"):
        chain.append(
            OllamaProvider(
                base_url=settings.ollama_base_url,
                model=settings.ollama_model,
            )
        )
    if mode == "openai" and settings.openai_api_key:
        chain.append(
            OpenAICompatibleProvider(
                name="openai",
                base_url="https://api.openai.com/v1",
                model=settings.openai_model,
                api_key=settings.openai_api_key,
            )
        )
    if mode == "deepseek" and settings.deepseek_api_key:
        chain.append(
            OpenAICompatibleProvider(
                name="deepseek",
                base_url=settings.deepseek_base_url,
                model=settings.deepseek_model,
                api_key=settings.deepseek_api_key,
            )
        )
    if mode == "rules":
        return [rules]

    chain.append(rules)
    return chain
