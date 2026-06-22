from typing import TYPE_CHECKING

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .mixins.int_id_pk import IdIntPkMixin

if TYPE_CHECKING:
    from .business_plan import BusinessPlan
    from .note import Note
    from .plan_block import PlanBlock
    from .user import User


plan_tags = Table(
    "plan_tags",
    Base.metadata,
    Column(
        "business_plan_id",
        ForeignKey("business_plans.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

block_tags = Table(
    "block_tags",
    Base.metadata,
    Column(
        "plan_block_id",
        ForeignKey("plan_blocks.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

note_tags = Table(
    "note_tags",
    Base.metadata,
    Column(
        "note_id",
        ForeignKey("notes.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Tag(Base, IdIntPkMixin):
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    color_idx: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("NOW()"),
        nullable=False,
    )

    user: Mapped["User"] = relationship(
        back_populates="tags",
    )
    business_plans: Mapped[list["BusinessPlan"]] = relationship(
        secondary=plan_tags,
        back_populates="tags",
        lazy="noload",
    )
    blocks: Mapped[list["PlanBlock"]] = relationship(
        secondary=block_tags,
        back_populates="tags",
        lazy="noload",
    )
    notes: Mapped[list["Note"]] = relationship(
        secondary=note_tags,
        back_populates="tags",
        lazy="noload",
    )
