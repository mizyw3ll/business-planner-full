from typing import TYPE_CHECKING

from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTable
from sqlalchemy import DateTime, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.types.user_id import UserIdType

from .base import Base
from .mixins.int_id_pk import IdIntPkMixin

if TYPE_CHECKING:
    from .block_comment import BlockComment
    from .business_plan import BusinessPlan
    from .calendar_event import CalendarEvent
    from .financial_chart import FinancialChart
    from .note import Note
    from .plan_snapshot import PlanSnapshot
    from .project import Project
    from .tag import Tag
from .board import Board
from .contact import Contact
from .deal import Deal
from .notification import Notification
from .tax_event import TaxEvent


class User(Base, IdIntPkMixin, SQLAlchemyBaseUserTable[UserIdType]):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(1024), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(default=False, nullable=False)
    is_verified: Mapped[bool] = mapped_column(default=False, nullable=False)

    # ── новые / уточнённые поля ────────────────────────────────────────
    username: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        index=True,
        nullable=False,  # важно!
    )

    first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("NOW()"),
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("NOW()"),
        onupdate=text("NOW()"),
    )

    # отношения
    business_plans: Mapped[list["BusinessPlan"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    financial_charts: Mapped[list["FinancialChart"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    snapshots: Mapped[list["PlanSnapshot"]] = relationship(back_populates="created_by", cascade="all, delete-orphan")
    block_comments: Mapped[list["BlockComment"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    tags: Mapped[list["Tag"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    projects: Mapped[list["Project"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    notes: Mapped[list["Note"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    calendar_events: Mapped[list["CalendarEvent"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    tax_events: Mapped[list["TaxEvent"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    boards: Mapped[list["Board"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    contacts: Mapped[list["Contact"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    deals: Mapped[list["Deal"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="noload",
    )
