from datetime import datetime

from pydantic import ConfigDict, Field, field_validator

from core.types import BaseModel

from api.api_v1.tags.schemas import TagRead

# ── Project ──


class ProjectBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: str | None = None
    color_idx: int = Field(default=0, ge=0, le=9)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Название проекта не может быть пустым")
        return v.strip()


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    description: str | None = None
    color_idx: int | None = Field(None, ge=0, le=9)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Название проекта не может быть пустым")
        return v.strip() if v else v


class ProjectRead(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime


# ── Note ──


class NoteBase(BaseModel):
    title: str = Field(..., max_length=200)
    content_markdown: str = ""
    project_id: int | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Заголовок заметки не может быть пустым")
        return v.strip()


class NoteCreate(NoteBase):
    tag_ids: list[int] = Field(default_factory=list)


class NoteUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    content_markdown: str | None = None
    project_id: int | None = None
    tag_ids: list[int] | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Заголовок заметки не может быть пустым")
        return v.strip() if v else v


class NoteRead(NoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    tags: list[TagRead] = Field(default_factory=list)


class PaginatedNotes(BaseModel):
    items: list[NoteRead]
    total: int
    page: int
    per_page: int
