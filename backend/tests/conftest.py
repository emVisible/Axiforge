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


@pytest.fixture(autouse=True)
async def settle_moderation_tasks():
    """判断层现在是后台派发的。用例结束前把它派出去的活儿等完。

    不等会发生的事：上一条用例的判定在下一条用例跑到一半时落库——
    表现为偶发的"案件数不对"，以及整轮套件突然多等几十秒（连接池被两条
    会话抢）。这不是测试取巧：`drain_pending` 就是这条链对外承诺的收敛点。
    """
    from app.domains.moderation.background import drain_pending

    yield
    await drain_pending()


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
