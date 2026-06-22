from datetime import datetime

from core.types import BaseModel

# ── Board ──


class BoardCreate(BaseModel):
    title: str
    business_plan_id: int | None = None


class BoardUpdate(BaseModel):
    title: str | None = None


class BoardCardRead(BaseModel):
    id: int
    column_id: int
    title: str
    description: str | None = None
    card_order: int
    metadata_json: dict | None = None

    model_config = {"from_attributes": True}


class BoardColumnRead(BaseModel):
    id: int
    board_id: int
    title: str
    color: str | None = None
    column_order: int
    cards: list[BoardCardRead] = []

    model_config = {"from_attributes": True}


class BoardRead(BaseModel):
    id: int
    user_id: int
    business_plan_id: int | None = None
    title: str
    created_at: datetime
    updated_at: datetime
    columns: list[BoardColumnRead] = []

    model_config = {"from_attributes": True}


class BoardListItemRead(BaseModel):
    id: int
    title: str
    business_plan_id: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Column ──


class ColumnCreate(BaseModel):
    title: str
    color: str | None = None
    column_order: int | None = None


class ColumnUpdate(BaseModel):
    title: str | None = None
    color: str | None = None
    column_order: int | None = None


# ── Card ──


class CardCreate(BaseModel):
    title: str
    description: str | None = None
    metadata_json: dict | None = None


class CardUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    card_order: int | None = None
    metadata_json: dict | None = None


class CardMoveRequest(BaseModel):
    column_id: int
    card_order: int


class ReorderColumnsRequest(BaseModel):
    column_ids: list[int]
