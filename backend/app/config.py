from pathlib import Path
from typing import Self

from pydantic import model_validator
from pydantic_settings import BaseSettings

DEV_ADMIN_TOKEN = "dev-admin"


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://young:preview@localhost:5432/axiforge"
    secret_key: str = "change-me-in-production"
    environment: str = "development"
    port: int = 8000
    upload_dir: str = str(Path(__file__).parent.parent / "uploads" / "characters")
    admin_token: str = ""
    cors_origins: list[str] = [
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5274",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5274",
    ]
    # LLM（ADR-020）
    llm_provider: str = "auto"  # auto | xinference | ollama | rules
    xinference_base_url: str = "http://127.0.0.1:9997/v1"
    xinference_model: str = "Qwen2.5-7B-Instruct"
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "qwen2.5:7b"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    deepseek_model: str = "deepseek-chat"
    llm_daily_limit_per_creator: int = 30

    class Config:
        env_file = ".env"

    @model_validator(mode="after")
    def _dev_admin_token_default(self) -> Self:
        if self.environment == "development" and not self.admin_token:
            self.admin_token = DEV_ADMIN_TOKEN
        return self


settings = Settings()
