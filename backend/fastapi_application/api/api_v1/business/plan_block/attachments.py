"""File attachments for plan blocks — S3 or local storage."""

from __future__ import annotations

import mimetypes
import re
import uuid

from fastapi import HTTPException, UploadFile, status

from services.s3 import storage

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_MIME_PREFIXES = (
    "image/",
    "video/",
    "audio/",
    "application/pdf",
    "text/",
    "application/msword",
    "application/vnd.openxmlformats-officedocument",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    "application/zip",
    "application/x-zip",
    "application/json",
    "application/xml",
    "application/javascript",
    "application/octet-stream",
)


def _validate_file(file: UploadFile, size: int) -> None:
    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Файл слишком большой. Максимум {MAX_FILE_SIZE // (1024 * 1024)} МБ",
        )
    mime = file.content_type or mimetypes.guess_type(file.filename or "")[0] or ""
    if not any(mime.startswith(p) for p in ALLOWED_MIME_PREFIXES):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неподдерживаемый тип файла",
        )


def _s3_key(plan_id: int, stored_name: str) -> str:
    return f"plans/{plan_id}/{stored_name}"


async def save_attachment(plan_id: int, file: UploadFile) -> dict:
    raw = await file.read()
    _validate_file(file, len(raw))
    att_id = str(uuid.uuid4())
    safe_name = re.sub(r"[^\w.\-]", "_", file.filename or "file")
    stored_name = f"{att_id}_{safe_name}"
    key = _s3_key(plan_id, stored_name)
    mime = file.content_type or "application/octet-stream"
    await storage.put_object(key, raw, mime)
    url = f"/api/v1/business/plans/{plan_id}/blocks/attachments/{plan_id}/{stored_name}"
    return {
        "id": att_id,
        "name": safe_name,
        "url": url,
        "size": len(raw),
        "mime_type": mime,
    }


async def delete_attachment_file(plan_id: int, attachment: dict) -> None:
    url = attachment.get("url", "")
    if f"/plans/{plan_id}/" not in url:
        return
    filename = url.rsplit("/", 1)[-1]
    key = _s3_key(plan_id, filename)
    await storage.delete_object(key)


async def get_attachment_bytes(plan_id: int, filename: str) -> tuple[bytes, str]:
    """Return (content, content_type) for the given attachment."""
    key = _s3_key(plan_id, filename)
    return await storage.get_object(key)
