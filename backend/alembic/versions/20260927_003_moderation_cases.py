"""add moderation_cases and moderation_decision_logs (ADR-028)

Revision ID: 20260927_003
Revises: 20260708_002
Create Date: 2026-09-27

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "20260927_003"
down_revision: Union[str, Sequence[str], None] = "20260708_002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has(table: str) -> bool:
    return table in sa.inspect(op.get_bind()).get_table_names()


def upgrade() -> None:
    # 000_initial_schema 以 create_all() 为基线：新库上模型已建出这两张表，须幂等跳过。
    if not _has("moderation_cases"):
        op.create_table(
            "moderation_cases",
            sa.Column("id", UUID(as_uuid=True), primary_key=True),
            sa.Column("subject_type", sa.String(32), nullable=False),
            sa.Column("subject_id", sa.String(128), nullable=False),
            sa.Column("author_id", sa.String(128), nullable=False, server_default=""),
            sa.Column("fingerprint", sa.String(64), nullable=False),
            sa.Column("state", sa.String(24), nullable=False, server_default="pending"),
            sa.Column("suggested_action", sa.String(32), nullable=False, server_default=""),
            sa.Column("final_action", sa.String(32), nullable=False, server_default=""),
            sa.Column("via", sa.String(64), nullable=False, server_default=""),
            sa.Column("confidence", sa.Float(), nullable=True),
            sa.Column("engine", sa.String(32), nullable=False, server_default=""),
            sa.Column("authoritative", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("calibrated", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("clause_ids", JSONB(), nullable=False),
            sa.Column("answers", JSONB(), nullable=False),
            sa.Column("reasons", JSONB(), nullable=False),
            sa.Column("policy_version", sa.String(48), nullable=False, server_default=""),
            sa.Column("questions_version", sa.String(32), nullable=False, server_default=""),
            sa.Column("lexicon_version", sa.String(32), nullable=False, server_default=""),
            sa.Column("latency_ms", sa.Integer(), nullable=False, server_default="-1"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("resolved_by", sa.String(128), nullable=True),
            sa.Column("resolution_note", sa.Text(), nullable=True),
            sa.UniqueConstraint("subject_type", "subject_id", "fingerprint",
                                name="uq_moderation_subject_fp"),
            # 参照实现把 conf=9.00 原样落库；应用层裁剪会被下一个引擎绕过，故在存储层再钉一次
            sa.CheckConstraint("confidence IS NULL OR (confidence >= 0 AND confidence <= 1)",
                               name="ck_moderation_confidence_range"),
        )
        op.create_index("ix_moderation_state_created", "moderation_cases", ["state", "created_at"])
        op.create_index("ix_moderation_author", "moderation_cases", ["author_id"])

    if not _has("moderation_decision_logs"):
        op.create_table(
            "moderation_decision_logs",
            sa.Column("id", UUID(as_uuid=True), primary_key=True),
            sa.Column("case_id", UUID(as_uuid=True), nullable=False),
            sa.Column("dedupe_hit", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("action", sa.String(32), nullable=False, server_default=""),
            sa.Column("via", sa.String(64), nullable=False, server_default=""),
            sa.Column("confidence", sa.Float(), nullable=True),
            sa.Column("engine", sa.String(32), nullable=False, server_default=""),
            sa.Column("engines_tried", JSONB(), nullable=False),
            sa.Column("policy_version", sa.String(48), nullable=False, server_default=""),
            sa.Column("questions_version", sa.String(32), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.CheckConstraint("confidence IS NULL OR (confidence >= 0 AND confidence <= 1)",
                               name="ck_moderation_log_confidence_range"),
        )
        op.create_index("ix_moderation_log_case", "moderation_decision_logs", ["case_id", "created_at"])


def downgrade() -> None:
    op.drop_table("moderation_decision_logs")
    op.drop_index("ix_moderation_author", table_name="moderation_cases")
    op.drop_index("ix_moderation_state_created", table_name="moderation_cases")
    op.drop_table("moderation_cases")
