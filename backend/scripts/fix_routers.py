#!/usr/bin/env python3
"""Fix merged router files: @router -> @named_router, relative imports."""

import re
from pathlib import Path

APP = Path(__file__).resolve().parent.parent / "app"
ROUTER_FILES = list((APP / "domains").rglob("router.py")) + [
    APP / "domains/platform/search_router.py"
]

RELATIVE_FIXES = {
    "from ...database": "from app.database",
    "from ...config": "from app.config",
    "from ...schemas.asset": "from app.domains.assets.schemas",
    "from ...services.asset": "from app.domains.assets.service",
    "from ...services.project": "from app.domains.narrative.service",
}


def fix_router_decorators(text: str) -> str:
    sections = re.split(r"(# --- from [^\n]+ ---\n)", text)
    if len(sections) < 2:
        # single router file
        m = re.search(r"^(\w+_router) = APIRouter", text, re.M)
        if m:
            name = m.group(1)
            text = re.sub(r"@router\.", f"@{name}.", text)
            text = re.sub(r"@router\(", f"@{name}(", text)
        return text

    out = [sections[0]]
    for i in range(1, len(sections), 2):
        header = sections[i]
        body = sections[i + 1] if i + 1 < len(sections) else ""
        m = re.search(r"^(\w+_router) = APIRouter", body, re.M)
        if not m:
            m = re.search(r"^(router) = APIRouter", body, re.M)
        if m:
            name = m.group(1)
            body = re.sub(r"@router\.", f"@{name}.", body)
            body = re.sub(r"@router\(", f"@{name}(", body)
        out.append(header + body)
    return "".join(out)


def fix_file(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    for old, new in RELATIVE_FIXES.items():
        text = text.replace(old, new)
    if "router" in path.name:
        text = fix_router_decorators(text)
    path.write_text(text, encoding="utf-8")
    print(f"fixed {path.relative_to(APP.parent)}")


def main() -> None:
    for p in ROUTER_FILES:
        if p.exists():
            fix_file(p)


if __name__ == "__main__":
    main()
