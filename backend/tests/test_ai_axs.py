"""AI 草稿 → AXS 转换。"""

from app.domains.narrative.ai_draft import prose_to_axs


def test_prose_to_axs_basic_dialogue():
    axs = prose_to_axs(
        "小明：你好\n这是旁白。",
        title="测试",
        role_names=["小明"],
        default_speaker="旁白",
    )
    # ADR-027：旁白不再加星号，标题行与正文之间不再有空行——两者都不是 canonical，
    # 会被 parse 的兜底当成普通文本。产物的合法性由 packages/axs 的 TS runner 裁判。
    assert axs == "# 测试\n小明: 你好\n这是旁白。\n"
