from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import ConfigDict, Field

from core.types import BaseModel


class ChartPointBase(BaseModel):
    date: datetime = Field(..., description="Дата операции", examples=["2025-04-15T10:30:00Z"])
    type: Literal["income", "expense"] = Field(
        ...,
        description="Тип операции: доход(income) или расход(expense)",
        examples=["income", "expense"],
    )
    amount: Decimal = Field(
        ...,
        decimal_places=2,
        max_digits=15,
        ge=0,
        description="Сумма операции (всегда положительная)",
        examples=[150000.00, 49999.99],
    )
    description: str | None = Field(
        None,
        max_length=500,
        description="Описание операции (опционально)",
        examples=["Зарплата за апрель", "Аренда офиса"],
    )


class ChartPointCreate(ChartPointBase):
    pass


class ChartPointUpdate(BaseModel):
    date: datetime | None = Field(None, description="Новая дата операции", examples=["2025-05-01T00:00:00Z"])
    type: Literal["income", "expense"] | None = Field(None, description="Новый тип операции", examples=["income"])
    amount: Decimal | None = Field(
        None,
        decimal_places=2,
        max_digits=15,
        ge=0,
        description="Новая сумма (должна быть ≥ 0)",
        examples=[200000.00],
    )
    description: str | None = Field(None, max_length=500, description="Новое описание")


class ChartPointRead(ChartPointBase):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="ID точки", examples=[42])
    chart_id: int = Field(..., description="ID финансового графика", examples=[5])
    created_at: datetime | None = Field(None, description="Когда создана", examples=["2025-04-15T10:30:00Z"])
    updated_at: datetime | None = Field(None, description="Когда обновлена", examples=["2025-04-16T08:20:00Z"])

    amount: Decimal = Field(
        ...,
        decimal_places=2,
        max_digits=15,
        ge=0,
        description="Сумма операции",
        examples=[274412.90],
    )
