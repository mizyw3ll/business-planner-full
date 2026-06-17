from core.models import db_helper, Currency, CurrencyRate
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import crud, schemas

router = APIRouter()

IMPORTANT_CURRENCIES = [
    {"code": "USD", "name": "US Dollar"},
    {"code": "EUR", "name": "Euro"},
    {"code": "RUB", "name": "Russian Ruble"},
    {"code": "GBP", "name": "British Pound"},
    {"code": "JPY", "name": "Japanese Yen"},
    {"code": "CNY", "name": "Chinese Yuan"},
    {"code": "CHF", "name": "Swiss Franc"},
    {"code": "CAD", "name": "Canadian Dollar"},
    {"code": "AUD", "name": "Australian Dollar"},
    {"code": "INR", "name": "Indian Rupee"},
]


@router.get("", response_model=list[schemas.CurrencyRead])
async def get_currencies(
    session: AsyncSession = Depends(db_helper.session_getter),
):
    return await crud.get_currencies(session)


@router.post("/sync", response_model=schemas.CurrencySyncResponse)
async def sync_currencies(
    session: AsyncSession = Depends(db_helper.session_getter),
):
    from datetime import datetime, UTC

    synced_fiat = 0
    synced_crypto = 0
    inserted_rates = 0

    for c in IMPORTANT_CURRENCIES:
        stmt = select(Currency).where(Currency.code == c["code"])
        result = await session.execute(stmt)
        currency = result.scalar_one_or_none()
        if currency is None:
            currency = Currency(code=c["code"], name=c["name"], kind="fiat")
            session.add(currency)
            await session.flush()
        currency.is_popular = True
        currency.is_active = True
        currency.name = c["name"]
        synced_fiat += 1

    # Deactivate any previously-popular currencies no longer in the list
    codes = {c["code"] for c in IMPORTANT_CURRENCIES}
    stmt = select(Currency).where(Currency.is_popular == True, Currency.code.notin_(codes))
    result = await session.execute(stmt)
    for cur in result.scalars().all():
        cur.is_popular = False

    await session.commit()
    return {
        "quote_code": "USD",
        "synced_fiat_count": synced_fiat,
        "synced_crypto_count": synced_crypto,
        "inserted_rates_count": inserted_rates,
    }
