from datetime import datetime

from core.types import BaseModel

NOTIFY_OPTIONS: list[dict] = [
    {"value": 0, "label": "Не уведомлять"},
    {"value": 15, "label": "За 15 минут"},
    {"value": 30, "label": "За 30 минут"},
    {"value": 60, "label": "За 1 час"},
    {"value": 120, "label": "За 2 часа"},
    {"value": 1440, "label": "За 1 день"},
    {"value": 2880, "label": "За 2 дня"},
    {"value": 10080, "label": "За неделю"},
]


class TaxEventBase(BaseModel):
    title: str
    description: str | None = None
    event_date: datetime
    event_type: str = "other"
    amount: int | None = None
    is_recurring: bool = False
    recurrence_rule: str | None = None
    notify_before: list[int] | None = None


class TaxEventCreate(TaxEventBase):
    pass


class TaxEventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    event_date: datetime | None = None
    event_type: str | None = None
    amount: int | None = None
    is_recurring: bool | None = None
    recurrence_rule: str | None = None
    is_completed: bool | None = None
    notify_before: list[int] | None = None


class TaxEventRead(TaxEventBase):
    id: int
    user_id: int
    is_completed: bool
    notified_at: datetime | None = None
    notified_values: list[int] | None = None
    created_at: datetime
    updated_at: datetime
    notify_before: list[int] | None = None

    model_config = {"from_attributes": True}
