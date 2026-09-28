"""审核队列 API（ADR-028）。挂在既有 admin 鉴权之下：`/api/v1/admin/moderation/*`。"""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.admin_auth import require_admin
from app.database import get_db
from app.domains.moderation.content import load_subject_content
from app.domains.moderation.questions import QUESTIONS_VERSION
from app.domains.moderation.registry import build_policy
from app.domains.moderation.schemas import (
    CaseResponse,
    QueuePage,
    ResolveRequest,
    WhatIfResponse,
    WhatIfRowResponse,
    StatsResponse,
    VocabularyResponse,
)
from app.domains.moderation.service import ModerationService
from app.domains.moderation.vocabulary import vocabulary

moderation_router = APIRouter(
    prefix="/api/v1/admin/moderation",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)


#: 处置主体标签。ADMIN_TOKEN 是共享令牌、不是身份，所以这里不能记"谁"，
#: 只能记"以管理员角色"——把它写成 token 会把密钥复制进每一行案件。
ADMIN_PRINCIPAL = "admin-role"


def _svc(db: AsyncSession) -> ModerationService:
    return ModerationService(db)


@moderation_router.get("/queue", response_model=QueuePage)
async def moderation_queue(
    state: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    order: str = Query(default="risk", pattern="^(risk|new)$"),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    return await _svc(db).queue(state=state, limit=limit, order=order, offset=offset)


@moderation_router.get("/stats", response_model=StatsResponse)
async def moderation_stats(db: AsyncSession = Depends(get_db)):
    return await _svc(db).stats()


@moderation_router.get("/vocabulary", response_model=VocabularyResponse)
async def moderation_vocabulary():
    """判断层词汇表：条款/规则/结论的中文短名，由定义它们的那三个模块投影出来。

    不带版本键的话前端只能"启动时取一次"，而条款集是会长的——
    新加一条轴时，缓存到死的词表会把内部 id 直接印到运营眼前。
    """
    return VocabularyResponse(
        **vocabulary(),
        policy_version=build_policy().version,
        questions_version=QUESTIONS_VERSION,
    )


@moderation_router.get("/what-if", response_model=WhatIfResponse)
async def moderation_what_if(
    approve: float = Query(default=0.75, ge=0.0, le=1.0),
    reject: float = Query(default=0.95, ge=0.0, le=1.0),
    #: 窗口默认覆盖全库（实测 979 条读全量 ~10ms，与读 500 条无差别），
    #: 上限留在那里当增长的闸；真被截断时 `population` 会让面板说出来。
    scan: int = Query(default=2000, ge=1, le=5000),
    db: AsyncSession = Depends(get_db),
):
    """**只读**的阈值假设：这条线画到这里，已处置过的案件里有几条会被机器自动执行、
    其中几条与当时的人工结论相反（`conflicts`）。不改策略、不写库、不给任何引擎新资格。
    """
    report = await _svc(db).whatif(approve=approve, reject=reject, scan=scan)
    return WhatIfResponse(
        **{k: v for k, v in report.__dict__.items() if k != "rows"},
        scanned=report.evaluated + sum(report.skipped.values()),
        rows=[WhatIfRowResponse(**r.__dict__) for r in report.rows],
    )


@moderation_router.get("/cases/{case_id}", response_model=CaseResponse)
async def moderation_case(case_id: UUID, db: AsyncSession = Depends(get_db)):
    case = await _svc(db).get(case_id)
    if not case:
        raise HTTPException(404, "案件不存在")
    return case


@moderation_router.post("/cases/{case_id}/resolve", response_model=CaseResponse)
async def moderation_resolve(
    case_id: UUID,
    body: ResolveRequest,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    """处置人记为角色标签，不记 token 本身。

    两个方向都要避开：① 不接受请求体自报 actor——参照实现让客户端传且默认 "admin"，
    任何调用方都能冒充管理员结案；② 也不能把 `require_admin` 的返回值写进库，
    它返回的就是 Bearer token 原文，落库等于把 ADMIN_TOKEN 复制进每一行案件。
    ADR-018 的正式 RBAC 还没做，这里先记角色；等 user_accounts.role 生效时换成主体 id。
    """
    case = await _svc(db).resolve(
        case_id, outcome=body.outcome, actor=ADMIN_PRINCIPAL, note=body.note
    )
    if not case:
        raise HTTPException(404, "案件不存在")
    return case


@moderation_router.post("/cases/{case_id}/rejudge", response_model=CaseResponse)
async def moderation_rejudge(case_id: UUID, db: AsyncSession = Depends(get_db)):
    """让模型**现在**重判一次——"通过 Laya 进行自动判断"的手动入口。

    为什么需要它：判断只发生在内容保存的那一刻，那么重拟温度表、改词表、
    换题集之后，队列里的旧结论没有任何一条路能变成新结论——除非作者重新存一次稿。
    §12 把模型状态放进了幂等键，但没人触发它就没人重算。

    取的是**全文**而不是审阅面板那份 280 字摘录：看不全就自动裁决，
    是 `MAX_MODEL_CHARS` 明令禁止的事，不能因为换了入口就变成允许的。
    """
    svc = _svc(db)
    case = await svc.get(case_id)
    if not case:
        raise HTTPException(404, "案件不存在")
    content = await load_subject_content(
        db, subject_type=case.subject_type, subject_id=case.subject_id)
    if content is None:
        raise HTTPException(410, "原内容已删除，或这类主体暂不支持重判")
    title, body, author_id = content
    again = await svc.review(
        subject_type=case.subject_type, subject_id=case.subject_id,
        title=title, body=body, author_id=author_id)
    if again is None:
        raise HTTPException(409, "这条链现在给不出可落库的结论（引擎不可用、全部弃权，"
                                 "或正文超出模型窗口）")
    await db.commit()
    return again


@moderation_router.post("/cases/{case_id}/reopen", response_model=CaseResponse)
async def moderation_reopen(
    case_id: UUID,
    note: str = Query(default=""),
    db: AsyncSession = Depends(get_db),
    _: str = Depends(require_admin),
):
    case = await _svc(db).reopen(case_id, actor=ADMIN_PRINCIPAL, note=note)
    if not case:
        raise HTTPException(404, "案件不存在")
    return case
