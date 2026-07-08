#!/usr/bin/env python3
"""Remove circular self-imports in merged domain files."""

import re
from pathlib import Path

APP = Path(__file__).resolve().parent.parent / "app"

SELF_IMPORT_PATTERNS = [
    # character merged files
    (APP / "domains/character/schemas.py", r"^from app\.domains\.character\.schemas import TagResponse\n"),
    (APP / "domains/character/models.py", r"^from app\.domains\.character\.models import character_tags\n"),
]

FIXES = [
    (
        APP / "domains/character/service.py",
        "from app.domains.character.models import VersionService",
        "from app.domains.character.version_service import VersionService",
    ),
]


def main() -> None:
    for path, pattern in SELF_IMPORT_PATTERNS:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        new = re.sub(pattern, "", text, flags=re.M)
        if new != text:
            path.write_text(new, encoding="utf-8")
            print(f"stripped self-import in {path.name}")

    for path, old, new in FIXES:
        if path.exists():
            text = path.read_text(encoding="utf-8")
            if old in text:
                path.write_text(text.replace(old, new), encoding="utf-8")
                print(f"fixed {path.name}")


if __name__ == "__main__":
    main()
