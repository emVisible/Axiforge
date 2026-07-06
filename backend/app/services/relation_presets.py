PRESET_RELATIONS = [
    # 亲属
    {"name": "父子", "category": "亲属", "mutual": False},
    {"name": "母子", "category": "亲属", "mutual": False},
    {"name": "兄妹", "category": "亲属", "mutual": True},
    {"name": "姐弟", "category": "亲属", "mutual": True},
    # 情感
    {"name": "恋人", "category": "情感", "mutual": True},
    {"name": "暗恋", "category": "情感", "mutual": False},
    {"name": "挚友", "category": "情感", "mutual": True},
    {"name": "宿敌", "category": "情感", "mutual": True},
    # 社会
    {"name": "师徒", "category": "社会", "mutual": False},
    {"name": "上下级", "category": "社会", "mutual": False},
    {"name": "盟友", "category": "社会", "mutual": True},
    {"name": "竞争对手", "category": "社会", "mutual": True},
    # 创作
    {"name": "Fork自", "category": "创作", "mutual": False},
    {"name": "同一世界观", "category": "创作", "mutual": True},
    {"name": "同一作者", "category": "创作", "mutual": True},
]

CATEGORIES = ["亲属", "情感", "社会", "创作"]


def get_presets_by_category() -> dict:
    """按分类返回预设关系"""
    result = {}
    for cat in CATEGORIES:
        result[cat] = [r for r in PRESET_RELATIONS if r["category"] == cat]
    return result