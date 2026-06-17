from datetime import datetime

from pydantic import BaseModel

# ── Contact ──


class ContactCreate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    position: str | None = None
    notes: str | None = None
    is_lead: bool = False


class ContactUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    position: str | None = None
    notes: str | None = None
    is_lead: bool | None = None


class ContactRead(BaseModel):
    id: int
    user_id: int
    name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None
    position: str | None = None
    notes: str | None = None
    is_lead: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Deal ──


class DealCreate(BaseModel):
    title: str
    description: str | None = None
    contact_id: int | None = None
    status: str = "new"
    value: float | None = None
    currency: str = "RUB"
    priority: str = "medium"
    due_date: str | None = None


class DealUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    contact_id: int | None = None
    status: str | None = None
    value: float | None = None
    currency: str | None = None
    priority: str | None = None
    due_date: str | None = None


class DealRead(BaseModel):
    id: int
    user_id: int
    contact_id: int | None = None
    title: str
    description: str | None = None
    status: str
    value: float | None = None
    currency: str
    priority: str
    due_date: str | None = None
    created_at: datetime
    updated_at: datetime
    contact: ContactRead | None = None

    model_config = {"from_attributes": True}


# ── Pipeline ──


class PipelineStats(BaseModel):
    total_deals: int = 0
    total_value: float = 0
    by_status: dict[str, int] = {}
    by_priority: dict[str, int] = {}
