"""Check for old-format URLs in rich_content JSON fields and fix them."""
from __future__ import annotations

import asyncio
import json
import re
import sys
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

DATABASE_URL = "postgresql+asyncpg://postgres:1234@localhost:5432/business_planner_db_v2"
SAFE_RE = re.compile(r"[^\w.\-]")

OLD_URL_RE = re.compile(r"/api/v1/business/plans/blocks/attachments/(\d+)/([^\s\"\\]+)")

def fix_url(m: re.Match) -> str:
    plan_id = m.group(1)
    filename = m.group(2)
    safe = SAFE_RE.sub("_", filename)
    return f"/api/v1/business/plans/{plan_id}/blocks/attachments/{plan_id}/{safe}"

async def main() -> None:
    apply = "--apply" in sys.argv
    engine = create_async_engine(DATABASE_URL)
    try:
        async with engine.begin() as conn:
            rows = (await conn.execute(
                text("SELECT id, rich_content FROM plan_blocks WHERE rich_content::text != '{}'")
            )).fetchall()

        updated = 0
        for block_id, rc in rows:
            if not rc:
                continue
            s = json.dumps(rc, ensure_ascii=False)
            matches = list(OLD_URL_RE.finditer(s))
            if not matches:
                continue

            new_s = OLD_URL_RE.sub(fix_url, s)
            new_rc = json.loads(new_s)

            for m in matches:
                print(f"  block={block_id}: {m.group(0)} -> {fix_url(m)}")

            if apply:
                async with engine.begin() as conn:
                    await conn.execute(
                        text("UPDATE plan_blocks SET rich_content = :val WHERE id = :id"),
                        {"val": json.dumps(new_rc, ensure_ascii=False), "id": block_id},
                    )
            updated += 1

        print(f"\n{'Would update' if not apply else 'Updated'}: {updated} blocks with inline old-format URLs")
        if not apply and updated:
            print("Dry-run mode. Re-run with --apply to apply changes.")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
