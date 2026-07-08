"""上传图片轻量压缩（JPEG/PNG/WebP）。"""

from __future__ import annotations

import io
from typing import Tuple

MAX_EDGE = 1920
JPEG_QUALITY = 85


def compress_image(contents: bytes, content_type: str) -> Tuple[bytes, str]:
    """返回 (bytes, content_type)；GIF 或失败时原样返回。"""
    if content_type == "image/gif":
        return contents, content_type

    try:
        from PIL import Image
    except ImportError:
        return contents, content_type

    try:
        with Image.open(io.BytesIO(contents)) as img:
            img = img.convert("RGBA" if content_type == "image/png" else "RGB")
            w, h = img.size
            if max(w, h) > MAX_EDGE:
                scale = MAX_EDGE / max(w, h)
                img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

            out = io.BytesIO()
            if content_type == "image/png":
                img.save(out, format="PNG", optimize=True)
                return out.getvalue(), "image/png"
            if content_type == "image/webp":
                img.save(out, format="WEBP", quality=JPEG_QUALITY, method=4)
                return out.getvalue(), "image/webp"
            if img.mode == "RGBA":
                img = img.convert("RGB")
            img.save(out, format="JPEG", quality=JPEG_QUALITY, optimize=True)
            return out.getvalue(), "image/jpeg"
    except Exception:
        return contents, content_type
