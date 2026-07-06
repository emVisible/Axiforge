"""drop legacy asset tables

Revision ID: 20260706_001
Revises:
Create Date: 2026-07-06

"""

from typing import Sequence, Union

from alembic import op

revision: str = "20260706_001"
down_revision: Union[str, Sequence[str], None] = "20260706_000"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS asset_characters CASCADE")
    op.execute("DROP TABLE IF EXISTS asset_plugins CASCADE")


def downgrade() -> None:
    pass
