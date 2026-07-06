"""initial schema baseline

Revision ID: 20260706_000
Revises:
Create Date: 2026-07-06

Creates all v1.0 tables from SQLAlchemy metadata (19 tables).
Idempotent via create_all(checkfirst=True) for dev DBs already initialized.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "20260706_000"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from app.database import Base, register_models

    register_models()
    bind = op.get_bind()
    Base.metadata.create_all(bind)


def downgrade() -> None:
    from app.database import Base, register_models

    register_models()
    bind = op.get_bind()
    Base.metadata.drop_all(bind)
