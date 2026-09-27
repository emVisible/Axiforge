import os
import sys
from pathlib import Path

os.environ.setdefault("TESTING", "1")

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import async_session, init_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
async def prepare_database():
    await init_db()


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def db_session():
    """直连测试库的会话：给需要断言"真的落库了"的用例用，不走 HTTP。"""
    async with async_session() as session:
        yield session
