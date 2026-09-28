"""测试库必须与开发库分开（ADR-028 D28）。

这条隔离不是洁癖：审核台账里的行带着 `raw`（缩放前分布），而
`calibrate.py --from-answers` 正是按 `raw` 取样本。测试一旦写进 dev 库，
"模型的判断力"与"pytest 刚跑过一遍"这两种读数就落在同一张表里——
2026-09-28 清库当天实测：跑一遍套件写回 34 条案件。
所以这里守的是**那条链的输入端**，不是某个接口的返回值。
"""

from __future__ import annotations

from sqlalchemy import text

from app.config import settings


def test_the_suite_is_not_pointed_at_the_dev_database():
    """engine 指的必须是独立的测试库。

    判据只看库名后缀，不看主机与账号：CI 与本机都可以换宿主，
    但"跑测试会动到 dev 台账"这一件事必须不可能发生。
    """
    url = settings.database_url
    assert url, "settings 里没配 database_url"
    name = url.split("/")[-1].split("?")[0]
    assert name.endswith("_test"), f"测试跑到了非测试库上：{url}"


def test_url_derivation_is_idempotent_and_keeps_the_credentials():
    """`<库名>` → `<库名>_test`，重复应用不长出 `_test_test`，凭据原样保留。

    只改库名是刻意的：一次改动只该有一处语义变化，改两处就有半套配置的风险。
    """
    from tests.conftest import test_database_url

    base = "postgresql+asyncpg://young:preview@localhost:5432/axiforge"
    once = test_database_url(base)
    assert once == "postgresql+asyncpg://young:preview@localhost:5432/axiforge_test"
    assert test_database_url(once) == once
    assert "young:preview@localhost:5432" in once


async def test_the_server_itself_says_which_database_it_is_on(db_session):
    """让 Postgres 自己回答"我在哪个库"，而不是只看连接串。

    上面两条读的是配置，配置能被任何一环绕过（显式 env、代码默认值、另一个 session 工厂）。
    这条读的是**服务端事实**：它红了就是真的写进了别的库。
    不断言案件数为 0——那要依赖用例执行顺序，是一条测不出东西的断言。
    """
    name = (await db_session.execute(text("select current_database()"))).scalar_one()
    assert str(name).endswith("_test"), f"服务端告诉我们它在 {name} 上"
    # 表确实在（DROP/CREATE + create_all 这条链跑通了）
    assert (await db_session.execute(text("select count(*) from moderation_cases"))).scalar_one() >= 0
