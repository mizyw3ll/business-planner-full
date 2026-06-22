from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    Text,
    text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from core.models.mixins.int_id_pk import IdIntPkMixin

from .base import Base

if TYPE_CHECKING:
    from .chart_point import ChartPoint
    from .currency import Currency
    from .plan_block import PlanBlock
    from .user import User


class FinancialChart(Base, IdIntPkMixin):
    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        index=True,
    )
    currency_id: Mapped[int] = mapped_column(
        ForeignKey("currencies.id"),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        default=True,
        index=True,
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("NOW()"),
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("NOW()"),
        onupdate=text("NOW()"),
    )

    user: Mapped["User"] = relationship(
        back_populates="financial_charts",
    )
    currency: Mapped["Currency"] = relationship(
        back_populates="financial_charts",
    )
    chart_points: Mapped[list["ChartPoint"]] = relationship(
        back_populates="financial_chart",
        cascade="all, delete-orphan",
        order_by="ChartPoint.date",
        lazy="noload",
    )
    linked_plan_blocks: Mapped[list["PlanBlock"]] = relationship(
        secondary="plan_block_financial_charts",
        lazy="noload",
        overlaps="linked_financial_charts",
    )
