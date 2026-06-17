"""Background task for automatic currency rate sync."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime
from decimal import Decimal

import httpx
from core.config import settings
from core.models import Currency, CurrencyRate, db_helper
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

FIAT_ENDPOINT = "https://api.exchangerate-api.com/v4/latest"
CRYPTO_ENDPOINT = "https://api.coingecko.com/api/v3/simple/price"

IMPORTANT_CURRENCIES = {"USD", "EUR", "RUB", "GBP", "JPY", "CNY", "CHF", "CAD", "AUD", "INR"}

CRYPTO_COINS = {
    "BTC": ("Bitcoin", "bitcoin"),
    "ETH": ("Ethereum", "ethereum"),
    "BNB": ("BNB", "binancecoin"),
    "SOL": ("Solana", "solana"),
    "TON": ("Toncoin", "the-open-network"),
}


async def _fetch_fiat_rates(quote_code: str) -> dict[str, float]:
    url = f"{FIAT_ENDPOINT}/{quote_code}"
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(url)
        response.raise_for_status()
        payload = response.json()
    rates = payload.get("rates", {})
    rates[quote_code] = 1.0
    return {str(code).upper(): float(rate) for code, rate in rates.items()}


async def _fetch_crypto_rates(quote_code: str) -> dict[str, tuple[str, str, float]]:
    ids = ",".join(coin_id for _, coin_id in CRYPTO_COINS.values())
    params = {"ids": ids, "vs_currencies": quote_code.lower()}
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(CRYPTO_ENDPOINT, params=params)
        response.raise_for_status()
        payload = response.json()
    result: dict[str, tuple[str, str, float]] = {}
    for code, (name, coin_id) in CRYPTO_COINS.items():
        quote_rate = payload.get(coin_id, {}).get(quote_code.lower())
        if quote_rate is None:
            continue
        result[code] = (name, coin_id, float(quote_rate))
    return result


async def _upsert_currency(
    session: AsyncSession,
    code: str,
    name: str,
    kind: str,
    external_id: str | None,
) -> Currency:
    stmt = select(Currency).where(Currency.code == code)
    result = await session.execute(stmt)
    currency = result.scalar_one_or_none()
    if currency is None:
        currency = Currency(code=code, name=name, kind=kind, external_id=external_id)
        session.add(currency)
        await session.flush()
        return currency
    currency.name = name
    currency.kind = kind
    currency.external_id = external_id
    currency.is_active = True
    return currency


async def sync_rates_from_external_api(
    session: AsyncSession,
    quote_code: str = "USD",
    codes: set[str] | None = None,
) -> dict:
    quote = quote_code.upper()
    fiat_rates = await _fetch_fiat_rates(quote)
    crypto_rates = await _fetch_crypto_rates(quote)

    if codes is None:
        codes = IMPORTANT_CURRENCIES | set(CRYPTO_COINS.keys())

    synced_fiat = 0
    synced_crypto = 0
    inserted_rates = 0
    fetched_at = datetime.now(UTC)

    for code, rate in fiat_rates.items():
        if code not in codes:
            continue
        currency = await _upsert_currency(
            session=session,
            code=code,
            name=code,
            kind="fiat",
            external_id=None,
        )
        currency.is_popular = True
        synced_fiat += 1
        session.add(
            CurrencyRate(
                currency_id=currency.id,
                quote_code=quote,
                rate=Decimal(str(rate)),
                source="frankfurter",
                fetched_at=fetched_at,
            )
        )
        inserted_rates += 1

    for code, payload in crypto_rates.items():
        name, external_id, rate = payload
        if code not in codes:
            continue
        currency = await _upsert_currency(
            session=session,
            code=code,
            name=name,
            kind="crypto",
            external_id=external_id,
        )
        currency.is_popular = True
        synced_crypto += 1
        session.add(
            CurrencyRate(
                currency_id=currency.id,
                quote_code=quote,
                rate=Decimal(str(rate)),
                source="coingecko",
                fetched_at=fetched_at,
            )
        )
        inserted_rates += 1

    # Deactivate currencies not in the important set
    stmt = select(Currency).where(Currency.is_popular == True, Currency.code.notin_(codes))
    result = await session.execute(stmt)
    for cur in result.scalars().all():
        cur.is_popular = False

    await session.commit()
    return {
        "quote_code": quote,
        "synced_fiat_count": synced_fiat,
        "synced_crypto_count": synced_crypto,
        "inserted_rates_count": inserted_rates,
    }


async def _sync_loop() -> None:
    cfg = settings.currency_sync
    if not cfg.enabled:
        logger.info("Currency auto-sync disabled")
        return

    logger.info(
        "Currency auto-sync started (interval=%d min, quote=%s)",
        cfg.interval_minutes,
        cfg.quote_code,
    )

    while True:
        try:
            async with db_helper.session_factory() as session:
                result = await sync_rates_from_external_api(
                    session=session,
                    quote_code=cfg.quote_code,
                )
                logger.info(
                    "Currency sync completed: fiat=%d crypto=%d rates=%d",
                    result["synced_fiat_count"],
                    result["synced_crypto_count"],
                    result["inserted_rates_count"],
                )
        except Exception:
            logger.exception("Currency sync failed")

        await asyncio.sleep(cfg.interval_minutes * 60)


_task: asyncio.Task[None] | None = None


def start() -> None:
    global _task
    if _task is not None and not _task.done():
        return
    _task = asyncio.create_task(_sync_loop())


def stop() -> None:
    global _task
    if _task is not None and not _task.done():
        _task.cancel()
    _task = None
