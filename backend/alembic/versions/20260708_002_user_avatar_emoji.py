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


def upgrade() -> None:
    op.add_column(
        "user_accounts",
        sa.Column("avatar_emoji", sa.String(length=16), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("user_accounts", "avatar_emoji")
