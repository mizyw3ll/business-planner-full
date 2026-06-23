from datetime import datetime

from pydantic import ConfigDict, Field, field_validator

from core.types import BaseModel


class CalendarEventBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str | None = None
    event_date: datetime
    notify_before: list[int] | None = None
    event_type: str = Field(default="manual", max_length=50)
    related_plan_id: int | None = None
    related_block_id: int | None = None
    related_note_id: int | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Название события не может быть пустым")
        return v.strip()


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    description: str | None = None
    event_date: datetime | None = None
    notify_before: list[int] | None = None
    event_type: str | None = None
    related_plan_id: int | None = None
    related_block_id: int | None = None
    related_note_id: int | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Название события не может быть пустым")
        return v.strip() if v else v


class CalendarEventRead(CalendarEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    notified_at: datetime | None = None
    notified_values: list[int] | None = None
    created_at: datetime


class CalendarImportResult(BaseModel):
    imported: int = Field(description="Количество импортированных событий")
    skipped: int = Field(description="Количество пропущенных (дубликаты)")
    errors: int = Field(description="Количество ошибок")
    details: list[str] = Field(default_factory=list, description="Детали ошибок")
