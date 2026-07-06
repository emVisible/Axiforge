import hashlib

PRESET_COLORS = [
    "#C44D4D",
    "#B8602A",
    "#7A8C4A",
    "#4A6B8C",
    "#8C5A7A",
    "#5A7A6A",
    "#9C6A4A",
    "#6A5A8C",
    "#4A7A8C",
    "#8C6A5A",
    "#6A8C5A",
    "#8C4A6A",
    "#5A6A8C",
    "#9C8A5A",
    "#6A4A5A",
    "#4A8C7A",
]


def generate_tag_color(name: str) -> str:
    hash_val = int(hashlib.md5(name.encode()).hexdigest(), 16)
    return PRESET_COLORS[hash_val % len(PRESET_COLORS)]
