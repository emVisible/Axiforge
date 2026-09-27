"""作品文本的两条纯投影：给读者看的正文，和给判断层送的正文。

放在独立模块而不是 `service.py`：这两个函数不碰数据库、不依赖领域服务，
而判断层需要它们（`moderation.content`）。让它们住在 service 里，
"审核派发 → 取送审正文 → narrative.service → 审核派发"就绕成一个导入环。
"""
from __future__ import annotations

from typing import List, Tuple


def narrative_prose_text(nodes) -> str:
    """送审正文 = 读者会看到的文字（旁白 + 台词），按运行时顺序拼接。

    库里**两种形状并存**（实测 400 个节点：扁平 `narration`/`dialogue` 占 309/382，
    新编辑器写的 `script: [{op, text}]` 占 21 且会越来越多），只认一种就等于
    对另一半内容永远拿到空正文——而空正文不会报错，只会让审核"看起来很干净"。

    不用 `axs_source`：那是带 `【背景 …】` 之类指令的真相源，把标记喂给内容模型
    只会让它去判断排版指令，而不是判断这篇稿子本身。
    """
    parts: List[str] = []
    for n in sorted(nodes, key=lambda x: (x.sort_order or 0)):
        nd = n.narrative_data or {}
        for key in ("narration", "dialogue"):
            val = nd.get(key)
            if isinstance(val, str) and val.strip():
                parts.append(val.strip())
        script = nd.get("script")
        if isinstance(script, list):
            for item in script:
                if (isinstance(item, dict) and item.get("op") in ("narration", "say")
                        and isinstance(item.get("text"), str)):
                    parts.append(item["text"].strip())
    return "\n".join(p for p in parts if p)


def project_subject_text(*, title: str, description: str, nodes) -> Tuple[str, str]:
    """作品作为审核主体的口径：标题单独给，正文 = 简介 + 读者会看到的文字。

    这里必须是**唯一一处**定义：保存、举报、重判、后台派发四个入口都经 `moderation.content`
    取到这里。在此之前保存路径只判正文、举报路径只判简介（面板那份摘录），
    同一部作品于是留下两份内容指纹、挂着两个案件，而两边看起来都"判过了"。
    简介是发现页上读者真正看到的文案，漏掉它等于给导流话术留了一条公开面。
    """
    prose = narrative_prose_text(nodes)
    body = "\n\n".join(p for p in ((description or "").strip(), prose) if p)
    return (title or ""), body

