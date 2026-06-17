from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class CurrencyBase(BaseModel):
    code: str
    name: str
    kind: str = Field(default="fiat")
    external_id: str | None = None


class CurrencyCreate(CurrencyBase):
    pass


class CurrencyUpdate(BaseModel):
    code: str | None = Field(None, max_length=10)
    name: str | None = Field(None, max_length=50)
    kind: str | None = Field(None, max_length=20)
    external_id: str | None = Field(None, max_length=100)


class CurrencyRead(CurrencyBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    is_popular: bool


class CurrencyRateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    currency_id: int
    quote_code: str
    rate: float
    source: str
    fetched_at: datetime


class CurrencyWithRateRead(BaseModel):
    id: int
    code: str
    name: str
    kind: str
    latest_rate: float
    quote_code: str
    source: str
    fetched_at: datetime


class CurrencySyncResponse(BaseModel):
    quote_code: str
    synced_fiat_count: int
    synced_crypto_count: int
    inserted_rates_count: int
