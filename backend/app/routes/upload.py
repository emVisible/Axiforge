import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.config import settings

router = APIRouter(prefix="/api/v1", tags=["upload"])

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
MAX_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "仅支持 JPEG/PNG/WebP/GIF")

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(400, "图片不能超过 5MB")

    ext = file.filename.split(".")[-1] if file.filename else "png"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = Path(settings.upload_dir) / filename
    filepath.parent.mkdir(parents=True, exist_ok=True)
    filepath.write_bytes(contents)

    return {"url": f"/uploads/{filename}"}
