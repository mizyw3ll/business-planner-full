from datetime import datetime

from pydantic import BaseModel


class NotificationRead(BaseModel):
    id: int
    user_id: int
    title: str
    body: str | None = None
    source_type: str
    source_id: int | None = None
    is_read: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationCreate(BaseModel):
    title: str
    body: str | None = None
    source_type: str
    source_id: int | None = None
