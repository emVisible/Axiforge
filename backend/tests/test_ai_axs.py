"""AI 草稿 → AXS 转换。"""

from app.domains.narrative.ai_draft import prose_to_axs


def test_prose_to_axs_basic_dialogue():
    axs = prose_to_axs(
        "小明：你好\n这是旁白。",
        title="测试",
        role_names=["小明"],
        default_speaker="旁白",
    )
    assert "# 测试" in axs
    assert "小明: 你好" in axs
    assert "*这是旁白。*" in axs
