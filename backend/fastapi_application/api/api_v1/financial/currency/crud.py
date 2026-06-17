from __future__ import annotations

import time

from core.models import Currency
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

_RATES_CACHE: dict[str, tuple[float, list[dict]]] = {}
_RATES_CACHE_TTL_SEC = 600  # 10 minutes


async def get_currencies(session: AsyncSession) -> list[Currency]:
    stmt = select(Currency).where(Currency.is_popular).order_by(Currency.kind, Currency.code)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_latest_rates(
    session: AsyncSession,
    quote_code: str,
    include_crypto: bool,
) -> list[dict]:
    quote = quote_code.upper()
    cache_key = f"{quote}:{include_crypto}"
    cached = _RATES_CACHE.get(cache_key)
    if cached and (time.monotonic() - cached[0]) < _RATES_CACHE_TTL_SEC:
        return cached[1]

    sql = text("""
        SELECT DISTINCT ON (cr.currency_id, cr.quote_code)
            c.id,
            c.code,
            c.name,
            c.kind,
            cr.rate,
            cr.quote_code,
            cr.source,
            cr.fetched_at
        FROM currencies c
        JOIN currency_rates cr ON cr.currency_id = c.id
        WHERE cr.quote_code = :quote_code
          AND c.is_active = true
        ORDER BY cr.currency_id, cr.quote_code, cr.fetched_at DESC
    """)
    result = await session.execute(sql, {"quote_code": quote})
    rows = result.mappings().all()

    response: list[dict] = []
    for row in rows:
        if not include_crypto and row["kind"] == "crypto":
            continue
        response.append(
            {
                "id": row["id"],
                "code": row["code"],
                "name": row["name"],
                "kind": row["kind"],
                "latest_rate": float(row["rate"]),
                "quote_code": row["quote_code"],
                "source": row["source"],
                "fetched_at": row["fetched_at"],
            }
        )

    _RATES_CACHE[cache_key] = (time.monotonic(), response)
    return response


def clear_rates_cache() -> None:
    _RATES_CACHE.clear()
