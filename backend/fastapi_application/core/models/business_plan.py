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
    from .plan_block import PlanBlock
    from .plan_snapshot import PlanSnapshot
    from .tag import Tag
    from .user import User


class BusinessPlan(Base, IdIntPkMixin):
    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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
    share_token: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        unique=True,
        index=True,
    )
    is_public: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
        server_default="false",
    )

    # Связи
    user: Mapped["User"] = relationship(
        back_populates="business_plans",
    )
    blocks: Mapped[list["PlanBlock"]] = relationship(
        back_populates="business_plan",
        cascade="all, delete-orphan",
        order_by="PlanBlock.block_order",
        lazy="noload",
    )
    snapshots: Mapped[list["PlanSnapshot"]] = relationship(
        back_populates="business_plan",
        cascade="all, delete-orphan",
        order_by="PlanSnapshot.created_at.desc()",
        lazy="noload",
    )
    tags: Mapped[list["Tag"]] = relationship(
        secondary="plan_tags",
        back_populates="business_plans",
        lazy="noload",
    )
