"""One-time migration: fix attachment URLs and rename files with spaces.

Fixes:
1. Old URLs were missing /{plan_id}/blocks/ segment (stored as /plans/blocks/att/...)
   Correct format: /api/v1/business/plans/{plan_id}/blocks/attachments/{plan_id}/{filename}
2. Files with spaces/special chars in names get renamed to use underscores.

Usage:
    cd backend
    .venv/Scripts/python migrate_attachments.py          # dry-run (default)
    .venv/Scripts/python migrate_attachments.py --apply   # apply changes
"""

from __future__ import annotations

import asyncio
import json
import re
import sys
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://postgres:1234@localhost:5432/business_planner_db_v2"
UPLOAD_ROOT = Path(__file__).resolve().parent / "uploads"

SAFE_RE = re.compile(r"[^\w.\-]")


def sanitized(filename: str) -> str:
    return SAFE_RE.sub("_", filename)


def fix_url_and_name(url: str, name: str, plan_id_str: str) -> tuple[str, str]:
    """Fix URL format and sanitize filename in name."""
    stored_name = url.rsplit("/", 1)[-1]
    safe_name = sanitized(stored_name)

    # Fix URL: must be /api/v1/business/plans/{plan_id}/blocks/attachments/{plan_id}/{filename}
    new_url = f"/api/v1/business/plans/{plan_id_str}/blocks/attachments/{plan_id_str}/{safe_name}"
    new_name = sanitized(name) if name else safe_name

    return new_url, new_name


async def main() -> None:
    apply = "--apply" in sys.argv

    engine = create_async_engine(DATABASE_URL)
    try:
        async with engine.begin() as conn:
            rows = (
                await conn.execute(
                    text("SELECT id, media_attachments, draft_media_attachments FROM plan_blocks")
                )
            ).fetchall()

        renamed = 0
        url_fixed = 0
        updated_blocks = 0

        for block_id, media, draft_media in rows:
            for label, attachments in [("media", media or []), ("draft", draft_media or [])]:
                changed = False
                for att in attachments:
                    url: str = att.get("url", "")
                    name: str = att.get("name", "")

                    if not url or "/plans/" not in url:
                        continue

                    # Extract plan_id from URL
                    # Old format: /api/v1/business/plans/blocks/attachments/{plan_id}/{filename}
                    # after /plans/ -> "blocks/attachments/{plan_id}/{filename}"
                    parts = url.split("/plans/", 1)
                    if len(parts) < 2:
                        continue
                    after_plans = parts[1]
                    segments = after_plans.split("/")
                    # segments = ["blocks", "attachments", "{plan_id}", "{filename}"]
                    if len(segments) >= 4:
                        plan_id_str = segments[2]
                        stored_name = segments[3]
                    else:
                        continue

                    safe_name = sanitized(stored_name)

                    # Rename file if needed
                    plan_dir = UPLOAD_ROOT / "plans" / plan_id_str
                    if stored_name != safe_name:
                        old_path = plan_dir / stored_name
                        new_path = plan_dir / safe_name

                        if old_path.is_file() and not new_path.exists():
                            print(f"  RENAME  block={block_id} ({label}): {stored_name} -> {safe_name}")
                            if apply:
                                old_path.rename(new_path)
                            renamed += 1
                        elif old_path.is_file() and new_path.exists():
                            print(f"  EXISTS  block={block_id} ({label}): {safe_name} already exists, keeping both")
                        else:
                            print(f"  SKIP    block={block_id} ({label}): file not found: {old_path}")

                    # Fix URL
                    new_url, new_name = fix_url_and_name(url, name, plan_id_str)
                    if new_url != url or new_name != name:
                        print(f"  URL     block={block_id} ({label}): {url} -> {new_url}")
                        if apply:
                            att["url"] = new_url
                            att["name"] = new_name
                            changed = True
                        url_fixed += 1

                if changed:
                    updated_blocks += 1
                    col = "media_attachments" if label == "media" else "draft_media_attachments"
                    if apply:
                        async with engine.begin() as conn:
                            await conn.execute(
                                text(f"UPDATE plan_blocks SET {col} = :val WHERE id = :id"),
                                {"val": json.dumps(attachments, ensure_ascii=False), "id": block_id},
                            )

        print(f"\n{'Would fix' if not apply else 'Fixed'}: {url_fixed} URLs")
        print(f"{'Would rename' if not apply else 'Renamed'}: {renamed} files")
        print(f"{'Would update' if not apply else 'Updated'}: {updated_blocks} blocks")

        if not apply and (url_fixed or renamed):
            print("\nDry-run mode. Re-run with --apply to apply changes.")

    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
