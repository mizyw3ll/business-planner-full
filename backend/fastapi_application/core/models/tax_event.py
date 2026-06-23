from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .mixins.int_id_pk import IdIntPkMixin

if TYPE_CHECKING:
    from .user import User


class TaxEvent(Base, IdIntPkMixin):
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    event_date: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    notify_before: Mapped[list[int] | None] = mapped_column(
        JSON,
        nullable=True,
        comment="За сколько минут до события уведомить (массив)",
    )
    event_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="other",
        server_default="other",
    )
    amount: Mapped[int | None] = mapped_column(
        nullable=True,
    )
    is_recurring: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
        server_default="false",
    )
    recurrence_rule: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    is_completed: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
        server_default="false",
    )
    notified_at: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Когда было отправлено уведомление",
    )
    notified_values: Mapped[list[int] | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Какие значения notify_before уже сработали",
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("NOW()"),
        nullable=False,
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("NOW()"),
        onupdate=text("NOW()"),
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        back_populates="tax_events",
    )
