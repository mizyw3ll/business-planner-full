from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.models.mixins.int_id_pk import IdIntPkMixin

from .base import Base

if TYPE_CHECKING:
    from .business_plan import BusinessPlan
    from .user import User


class PlanSnapshot(Base, IdIntPkMixin):
    business_plan_id: Mapped[int] = mapped_column(
        ForeignKey("business_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    blocks_snapshot: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        server_default=text("'[]'::json"),
    )
    created_by_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("NOW()"),
        nullable=False,
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    business_plan: Mapped["BusinessPlan"] = relationship(back_populates="snapshots")
    created_by: Mapped["User"] = relationship(back_populates="snapshots")
