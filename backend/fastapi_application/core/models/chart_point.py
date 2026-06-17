import decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from core.models.mixins.int_id_pk import IdIntPkMixin

from .base import Base

if TYPE_CHECKING:
    from core.models.financial_chart import FinancialChart


class ChartPoint(Base, IdIntPkMixin):
    chart_id: Mapped[int] = mapped_column(
        ForeignKey(
            "financial_charts.id",
            ondelete="CASCADE",
        )
    )
    date: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
    )
    type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="expense",
    )
    amount: Mapped[decimal.Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        server_default="0.00",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    financial_chart: Mapped["FinancialChart"] = relationship(back_populates="chart_points")

    __table_args__ = (
        CheckConstraint(type.in_(["income", "expense"])),
        CheckConstraint(amount >= 0),
    )
