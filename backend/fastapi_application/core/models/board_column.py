from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    JSON,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .mixins.int_id_pk import IdIntPkMixin

if TYPE_CHECKING:
    from .board import Board


class BoardColumn(Base, IdIntPkMixin):
    board_id: Mapped[int] = mapped_column(
        ForeignKey("boards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str | None] = mapped_column(
        String(7),
        nullable=True,
    )
    column_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )

    board: Mapped["Board"] = relationship(
        back_populates="columns",
    )
    cards: Mapped[list["BoardCard"]] = relationship(
        back_populates="column",
        cascade="all, delete-orphan",
        order_by="BoardCard.card_order",
        lazy="noload",
    )


class BoardCard(Base, IdIntPkMixin):
    column_id: Mapped[int] = mapped_column(
        ForeignKey("board_columns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )
    card_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    metadata_json: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    column: Mapped["BoardColumn"] = relationship(
        back_populates="cards",
    )
