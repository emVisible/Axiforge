"""LLM service unit tests."""

from unittest.mock import AsyncMock, patch

import pytest

from app.domains.llm.registry import build_provider_chain
from app.domains.llm.service import suggest_character


@pytest.mark.asyncio
async def test_suggest_character_falls_back_to_rules():
    with patch("app.domains.llm.service.build_provider_chain") as mock_chain:
        failing = AsyncMock()
        failing.name = "xinference"
        failing.suggest_character_layers = AsyncMock(side_effect=RuntimeError("down"))
        rules = AsyncMock()
        rules.name = "rules"
        rules.suggest_character_layers = AsyncMock(
            return_value={"anchor": {"name": "Test"}}
        )
        mock_chain.return_value = [failing, rules]

        result = await suggest_character(name="Test", essence="hero")
        assert result["source"] == "rules"
        assert result["layers"]["anchor"]["name"] == "Test"


def test_build_provider_chain_auto_includes_rules():
    chain = build_provider_chain()
    names = [p.name for p in chain]
    assert "rules" in names
    assert names[-1] == "rules"
