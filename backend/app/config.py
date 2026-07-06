from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://young:preview@localhost:5432/axiforge"
    secret_key: str = "change-me-in-production"
    environment: str = "development"
    port: int = 8000
    upload_dir: str = str(Path(__file__).parent.parent / "uploads" / "characters")

    class Config:
        env_file = ".env"


settings = Settings()
