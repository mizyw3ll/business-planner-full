from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, declared_attr, mapped_column, relationship

from core.models.mixins.int_id_pk import IdIntPkMixin

from .base import Base

if TYPE_CHECKING:
    from core.models.financial_chart import FinancialChart


class Currency(Base, IdIntPkMixin):
    @declared_attr  # type: ignore[arg-type]
    def __tablename__(cls) -> str:  # noqa: N805
        return "currencies"

    code: Mapped[str] = mapped_column(
        String(10),
        unique=True,
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    kind: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default="fiat",
    )
    external_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        nullable=False,
        server_default="true",
    )
    is_popular: Mapped[bool] = mapped_column(
        nullable=False,
        server_default="false",
    )

    financial_charts: Mapped[list["FinancialChart"]] = relationship(
        back_populates="currency",
        lazy="noload",
    )
    rates: Mapped[list["CurrencyRate"]] = relationship(
        back_populates="currency",
        cascade="all, delete-orphan",
        lazy="noload",
    )


class CurrencyRate(Base, IdIntPkMixin):
    @declared_attr  # type: ignore[arg-type]
    def __tablename__(cls) -> str:  # noqa: N805
        return "currency_rates"

    __table_args__ = (
        UniqueConstraint(
            "currency_id",
            "quote_code",
            "fetched_at",
            name="uq_currency_rates_currency_quote_fetched_at",
        ),
    )

    currency_id: Mapped[int] = mapped_column(
        ForeignKey("currencies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quote_code: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        index=True,
    )
    rate: Mapped[float] = mapped_column(
        Numeric(20, 8),
        nullable=False,
    )
    source: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    fetched_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
    )

    currency: Mapped["Currency"] = relationship(
        back_populates="rates",
    )
