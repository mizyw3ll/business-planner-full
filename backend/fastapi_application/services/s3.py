"""Async S3 storage service using aiobotocore."""

from __future__ import annotations

import asyncio
from functools import partial
from typing import TYPE_CHECKING

from aiobotocore.session import get_session

if TYPE_CHECKING:
    from botocore.response import StreamingBody


class S3Storage:
    def __init__(
        self,
        endpoint_url: str,
        bucket: str,
        access_key: str,
        secret_key: str,
        region: str = "ru-central-1",
    ) -> None:
        self.endpoint_url = endpoint_url
        self.bucket = bucket
        self.region = region
        self._session = get_session()
        self._creds = {
            "aws_access_key_id": access_key,
            "aws_secret_access_key": secret_key,
        }

    def _client(self):
        return self._session.create_client(
            "s3",
            endpoint_url=self.endpoint_url,
            region_name=self.region,
            **self._creds,
        )

    async def put_object(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
        async with self._client() as client:
            await client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=data,
                ContentType=content_type,
            )

    async def get_object(self, key: str) -> tuple[bytes, str]:
        async with self._client() as client:
            try:
                response = await client.get_object(Bucket=self.bucket, Key=key)
            except Exception as exc:
                if exc.response.get("Error", {}).get("Code") in ("NoSuchKey", "404"):
                    raise FileNotFoundError(f"Not found: {key}") from exc
                raise
            body: StreamingBody = response["Body"]
            data = await body.read()
            content_type = response.get("ContentType", "application/octet-stream")
            return data, content_type

    async def delete_object(self, key: str) -> None:
        async with self._client() as client:
            try:
                await client.delete_object(Bucket=self.bucket, Key=key)
            except Exception:
                pass

    async def head_object(self, key: str) -> dict | None:
        async with self._client() as client:
            try:
                response = await client.head_object(Bucket=self.bucket, Key=key)
                return response
            except Exception:
                return None

    async def list_objects(self, prefix: str = "") -> list[str]:
        async with self._client() as client:
            response = await client.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
            return [obj["Key"] for obj in response.get("Contents", [])]


class LocalStorage:
    """Fallback local file storage when S3 is disabled."""

    def __init__(self, root: str) -> None:
        from pathlib import Path

        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str):
        return self.root / key

    async def put_object(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        await asyncio.to_thread(path.write_bytes, data)

    async def get_object(self, key: str) -> tuple[bytes, str]:
        import mimetypes

        path = self._path(key)
        if not path.is_file():
            raise FileNotFoundError(f"File not found: {key}")
        data = await asyncio.to_thread(path.read_bytes)
        content_type = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
        return data, content_type

    async def delete_object(self, key: str) -> None:
        path = self._path(key)
        if path.is_file():
            await asyncio.to_thread(path.unlink)

    async def head_object(self, key: str) -> dict | None:
        path = self._path(key)
        def _stat():
            return path.stat().st_size if path.is_file() else None
        size = await asyncio.to_thread(_stat)
        return {"ContentLength": size} if size is not None else None

    async def list_objects(self, prefix: str = "") -> list[str]:
        def _scan():
            results = []
            for p in self.root.rglob("*"):
                if p.is_file():
                    rel = str(p.relative_to(self.root)).replace("\\", "/")
                    if rel.startswith(prefix):
                        results.append(rel)
            return results
        return await asyncio.to_thread(_scan)


def create_storage() -> S3Storage | LocalStorage:
    from core.config import settings

    if settings.s3.enabled and settings.s3.bucket:
        return S3Storage(
            endpoint_url=settings.s3.endpoint_url,
            bucket=settings.s3.bucket,
            access_key=settings.s3.access_key,
            secret_key=settings.s3.secret_key,
            region=settings.s3.region,
        )
    from pathlib import Path

    uploads_root = Path(__file__).resolve().parents[1] / "uploads"
    return LocalStorage(str(uploads_root))


storage = create_storage()
