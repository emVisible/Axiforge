"""add moderation_cases.human_clauses (ADR-028 · 逐轴真值)

Revision ID: 20260928_004
Revises: 20260927_003
Create Date: 2026-09-28

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "20260928_004"
down_revision: Union[str, Sequence[str], None] = "20260927_003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns() -> set:
    insp = sa.inspect(op.get_bind())
    if "moderation_cases" not in insp.get_table_names():
        return set()
    return {c["name"] for c in insp.get_columns("moderation_cases")}


def upgrade() -> None:
    # 000_initial_schema 以 create_all() 为基线：新库里模型已带这一列，须幂等跳过。
    cols = _columns()
    if cols and "human_clauses" not in cols:
        op.add_column(
            "moderation_cases",
            sa.Column("human_clauses", JSONB(), nullable=True),
        )


def downgrade() -> None:
    if "human_clauses" in _columns():
        op.drop_column("moderation_cases", "human_clauses")
