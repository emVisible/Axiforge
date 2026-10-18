import os
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

os.environ.setdefault("TESTING", "1")

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# ---------------------------------------------------------------------------
# 测试库与开发库分开。
#
# 为什么必须做：`settings.database_url` 过去不看 TESTING，所以这 30 个测试文件一直在往
# **dev 台账**里写。审核那套尤其贵——测试造的 `moderation_cases` 是带 `raw`（缩放前分布）的，
# 而 `calibrate.py --from-answers` 正是按 `raw` 取样本，于是"模型的判断力"与
# "pytest 刚跑过一遍"这两种读数落在同一张表里，分不出来。2026-09-28 清库当天实测：
# 跑一遍套件写回 34 条案件。
#
# 顺序是有要求的：`app.config` 在第一次导入时就把 `Settings()` 读成模块级单例，
# 而 `app.database` 在建 engine 时才读它。所以先取原始 URL 推出测试库地址，
# 再改 env、重建 settings，然后才允许导入 app.database / app.main。
# ---------------------------------------------------------------------------
from app.config import Settings as _Settings  # noqa: E402
from app.config import settings as _boot_settings  # noqa: E402


def test_database_url(base: str) -> str:
    """把 URL 里的库名换成 `<库名>_test`，其余（账号/口令/宿主）原样保留。

    保留凭据是刻意的：CI 与本机都只该改一件事（库名），改两件事就有半套配置的风险。
    """
    parts = urlsplit(base)
    name = parts.path.lstrip("/")
    if not name:
        raise RuntimeError(f"database_url 里没解析出库名：{base}")
    if not name.endswith("_test"):
        name = f"{name}_test"
    return urlunsplit((parts.scheme, parts.netloc, f"/{name}", parts.query, parts.fragment))


TEST_DATABASE_URL = test_database_url(_boot_settings.database_url)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

import app.config as _app_config  # noqa: E402

_app_config.settings = _Settings()   # 重新读一遍 env，拿到指向测试库的那份
assert _app_config.settings.database_url == TEST_DATABASE_URL, \
    "测试库没生效：dev 台账会被测试写脏"

from app.database import async_session, init_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
async def prepare_database():
    """一个会话一套**空表**：库不存在就建，存在就把数据清光（表结构保留）。

    为什么不 DROP DATABASE：CI 的 API job 已经用 `axiforge_test` 跑过 `alembic upgrade head`
    （实测见 `.github/workflows/ci.yml` 的 Setup API and database 一步），整库重建会把那次迁移
    连同 `alembic_version` 一起抹掉——于是"迁移能跑通"这个证据从 CI 里静默消失，
    而套件仍然是绿的。留表清数据既能保住迁移证据，又让测试跑在**迁移出来的 schema** 上。

    为什么用 `TRUNCATE ... CASCADE` 而不是逐表 DELETE：外键有十来个 NO ACTION 的子表，
    删除顺序要人维护，而顺序写错的表现不是报错而是**留下孤儿行**——
    上一轮清 dev 库时就真量到 102 条案件已不存在的决策日志。
    `alembic_version` 特意不清：它是 schema 的身份，不是数据。
    """
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import create_async_engine

    admin = urlsplit(TEST_DATABASE_URL)
    name = admin.path.lstrip("/")
    if not name.endswith("_test"):
        raise RuntimeError(f"拒绝在非测试库里清表（目标库是 {name}）：检查 DATABASE_URL")
    maint = urlunsplit((admin.scheme, admin.netloc, "/postgres", "", ""))
    eng = create_async_engine(maint, isolation_level="AUTOCOMMIT")
    async with eng.connect() as conn:
        exists = (await conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :n"), {"n": name})).scalar()
        if not exists:
            await conn.execute(text(f'CREATE DATABASE "{name}"'))
    await eng.dispose()
    await init_db()

    async with async_session() as session:
        # 护栏读服务端事实，不读我们自己的字符串推导
        where = (await session.execute(text("select current_database()"))).scalar_one()
        if not str(where).endswith("_test"):
            raise RuntimeError(f"连接落在非测试库上：{where}")
        tables = (await session.execute(text(
            "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'alembic_version'"
        ))).scalars().all()
        if tables:
            joined = ", ".join(f'"{t}"' for t in tables)
            await session.execute(text(f"TRUNCATE TABLE {joined} RESTART IDENTITY CASCADE"))
        await session.commit()


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
