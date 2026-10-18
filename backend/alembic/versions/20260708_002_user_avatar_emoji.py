"""add avatar_emoji to user_accounts

Revision ID: 20260708_002
Revises: 20260706_001
Create Date: 2026-07-08

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260708_002"
down_revision: Union[str, Sequence[str], None] = "20260706_001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_avatar_emoji(conn: sa.engine.Connection) -> bool:
    columns = sa.inspect(conn).get_columns("user_accounts")
    return any(c["name"] == "avatar_emoji" for c in columns)


def upgrade() -> None:
    # 000_initial_schema 以 Base.metadata.create_all() 为基线，会按当前模型
    # 建出全部列；全新库上本列已存在，须幂等跳过（修复全新安装报错）。
    conn = op.get_bind()
    if _has_avatar_emoji(conn):
        return
    op.add_column(
        "user_accounts",
        sa.Column("avatar_emoji", sa.String(length=16), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("user_accounts", "avatar_emoji")
