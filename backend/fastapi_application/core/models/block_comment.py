from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.models.mixins.int_id_pk import IdIntPkMixin

from .base import Base

if TYPE_CHECKING:
    from .plan_block import PlanBlock
    from .user import User


class BlockComment(Base, IdIntPkMixin):
    plan_block_id: Mapped[int] = mapped_column(
        ForeignKey("plan_blocks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    resolved: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
        server_default="false",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("NOW()"),
        nullable=False,
    )

    plan_block: Mapped["PlanBlock"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship(back_populates="block_comments")
