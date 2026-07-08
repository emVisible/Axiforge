"""图片压缩工具。"""

from app.core.image_compress import compress_image


def test_compress_image_passthrough_gif():
    raw = b"GIF89a"
    out, ctype = compress_image(raw, "image/gif")
    assert out == raw
    assert ctype == "image/gif"
