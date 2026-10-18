"""AXS 提示词的两端一致性锁。

同一个摘要也写在 `packages/axs/src/prompt.test.ts` 里。两份测试各自从**同一份 JSON**
加载再算摘要，测的是"Python 侧读出来的文本与 TS 侧逐字节相同"——
提示词的内容就是 AXS 语法，谁在 Python 里另抄一份、或加载时把换行吃掉，这里就会红。

摘要变更必须是刻意为之：它一改，模型写出来的 AXS 形态就可能跟着改，
而 AXS 对认不出的行的兜底是"当旁白读"，漂移不会有报错。
"""

import hashlib

from app.domains.llm.prompts import prose_to_axs_system, prose_to_axs_user

SYSTEM_SHA256 = "756070e37ea171f85f9a27f13f60db992f091227d12f0dcd5a0f5d7f32eccc0f"


def test_system_prompt_matches_shared_digest() -> None:
    got = hashlib.sha256(prose_to_axs_system().encode("utf-8")).hexdigest()
    assert got == SYSTEM_SHA256


def test_user_prompt_fill_matches_ts_composition() -> None:
    filled = prose_to_axs_user("下雨了", title="序章", role_names=["甲", "乙"], default_speaker="旁白")
    assert filled == "标题：序章\n可用角色：甲、乙\n\n散文：\n下雨了"


def test_grammar_tokens_are_all_listed() -> None:
    """漏一条指令 = 模型不会写它，而解析器明明支持——这种缺口头等查不出来。"""
    sys_text = prose_to_axs_system()
    for token in ("# ", "@bg ", "@bgm ", "@se ", "@voice ", "@wait ",
                  "@transition ", "@fx ", "@camera ", "@show ", "@hide ", "@move ", "> "):
        assert token in sys_text, f"提示词里缺了 {token.strip()}"
    assert "禁止使用【背景】" in sys_text
