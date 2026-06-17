from typing import Any

from sqlalchemy import JSON, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from core.models.mixins.int_id_pk import IdIntPkMixin

from .base import Base


class Template(Base, IdIntPkMixin):
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    blocks: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        server_default=text("'[]'::json"),
    )
    is_public: Mapped[bool] = mapped_column(
        nullable=False,
        default=True,
        server_default="true",
    )
