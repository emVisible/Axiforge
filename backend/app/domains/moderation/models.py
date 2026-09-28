"""审核案件与决策留痕（ADR-028）。

三处刻意的设计，都对应参照实现里已被实测证实的问题：

1. **`confidence` 有 DB CHECK 约束**。Clearance 把 `fraud=9.0` 原样算成
   `review.reject conf=9.00` 并落库——应用层的裁剪会被下一个引擎绕过，
   所以这一条在存储层再钉一次：越界的数字**存不进去**，而不是存进去再被读出来。
2. **`(subject_type, subject_id, fingerprint)` 唯一**。Clearance 在 REGISTRY 里声明
   `"idempotency": "required"` 却每次发新 UUID，重复提交被静默重判。这里让幂等
   成为数据库约束，不依赖调用方自觉。
3. **终态可回退**。Clearance 的 approved/rejected 是单向的（`store.py:134-135`），
   误判的自动驳回没有任何申诉路径。这里 `resolved/dismissed` 可以被 `reopened`
   回到 pending，并保留 `resolution_note` 作为处置理由。
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

#: 与 ContentReport 的口径保持一致（pending → resolved | dismissed），
#: 中台队列里两类对象的状态词不该是两套。
STATE_PENDING = "pending"
STATE_AUTO_CLOSED = "auto_closed"      # 引擎建议且过门，未被人工推翻即结案
STATE_RESOLVED = "resolved"            # 人工处置完成
STATE_DISMISSED = "dismissed"          # 人工判定为误报
STATE_REOPENED = "reopened"            # 终态回退：误判必须有一条回去的路


class ModerationCase(Base):
    """一个被审对象在当前内容指纹下的案件。同一对象改动内容会产生新案件。"""

    __tablename__ = "moderation_cases"
    __table_args__ = (
        UniqueConstraint(
            "subject_type", "subject_id", "fingerprint", name="uq_moderation_subject_fp"
        ),
        CheckConstraint(
            "confidence IS NULL OR (confidence >= 0 AND confidence <= 1)",
            name="ck_moderation_confidence_range",
        ),
        Index("ix_moderation_state_created", "state", "created_at"),
        Index("ix_moderation_author", "author_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    subject_type: Mapped[str] = mapped_column(String(32), nullable=False)
    subject_id: Mapped[str] = mapped_column(String(128), nullable=False)
    author_id: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    fingerprint: Mapped[str] = mapped_column(String(64), nullable=False)

    state: Mapped[str] = mapped_column(String(24), nullable=False, default=STATE_PENDING)
    suggested_action: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    final_action: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    via: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    confidence: Mapped[Optional[float]] = mapped_column(nullable=True)

    engine: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    authoritative: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    calibrated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    clause_ids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    answers: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    reasons: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    policy_version: Mapped[str] = mapped_column(String(48), nullable=False, default="")
    questions_version: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    lexicon_version: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=-1)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    resolved_by: Mapped[Optional[str]] = mapped_column(String(128))
    resolution_note: Mapped[Optional[str]] = mapped_column(Text)
    #: 人逐轴确认过的条款真值。`NULL` 与 `[]` 是两件事：
    #: NULL = 没勾过，导出时回落到"确认处置即认可机器标的条款"；
    #: `[]` = 人明确说"这些轴一个都不成立"（那正是漏报的反面，也是标定缺的那类负样本）。
    #: 没有这一列，正样本永远只覆盖"机器自己想到的轴"，拟出的温度偏乐观。
    human_clauses: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)


class ModerationDecisionLog(Base):
    """每次引擎裁决都留一行，包括被去重命中的那次。

    为什么单独一张表：`ModerationCase` 只保存当前结论，而"这条内容被三个引擎各判过几次、
    当时线画在哪"是复盘与调阈值唯一的依据。参照实现的 audit_logs 只记了
    action/confidence/engine（`store.py:118`），既不含答案也不含阈值，误判无法重建。
    """

    __tablename__ = "moderation_decision_logs"
    __table_args__ = (
        Index("ix_moderation_log_case", "case_id", "created_at"),
        CheckConstraint(
            "confidence IS NULL OR (confidence >= 0 AND confidence <= 1)",
            name="ck_moderation_log_confidence_range",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    dedupe_hit: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    action: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    via: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    confidence: Mapped[Optional[float]] = mapped_column(nullable=True)
    engine: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    engines_tried: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    policy_version: Mapped[str] = mapped_column(String(48), nullable=False, default="")
    questions_version: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
