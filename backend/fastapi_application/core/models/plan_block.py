from datetime import date, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Column, Date, DateTime, ForeignKey, Integer, String, Table, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .mixins.int_id_pk import IdIntPkMixin

if TYPE_CHECKING:
    from .block_comment import BlockComment
    from .business_plan import BusinessPlan
    from .financial_chart import FinancialChart
    from .tag import Tag


plan_block_financial_chart_association = Table(
    "plan_block_financial_charts",
    Base.metadata,
    Column(
        "plan_block_id",
        ForeignKey("plan_blocks.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "financial_chart_id",
        ForeignKey("financial_charts.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class PlanBlock(Base, IdIntPkMixin):
    business_plan_id: Mapped[int] = mapped_column(
        ForeignKey("business_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    block_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    block_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    rich_content: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
        server_default=text("'{}'::json"),
    )
    media_attachments: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        server_default=text("'[]'::json"),
    )
    # Черновик хранится отдельно от опубликованного контента.
    draft_title: Mapped[str | None] = mapped_column(String(100), nullable=True)
    draft_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    draft_rich_content: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    draft_media_attachments: Mapped[list[dict[str, Any]] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    draft_saved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    has_unpublished_draft: Mapped[bool] = mapped_column(
        nullable=False,
        default=False,
        server_default="false",
    )
    due_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    business_plan: Mapped["BusinessPlan"] = relationship(
        back_populates="blocks",
    )
    linked_financial_charts: Mapped[list["FinancialChart"]] = relationship(
        secondary=plan_block_financial_chart_association,
        lazy="noload",
    )
    comments: Mapped[list["BlockComment"]] = relationship(
        back_populates="plan_block",
        cascade="all, delete-orphan",
        order_by="BlockComment.created_at",
        lazy="noload",
    )
    tags: Mapped[list["Tag"]] = relationship(
        secondary="block_tags",
        back_populates="blocks",
        lazy="noload",
    )

    def get_linked_chart_ids(self) -> list[int]:
        """Return linked chart IDs. Only works if relationship is loaded via selectinload."""
        return [chart.id for chart in self.linked_financial_charts]

    def get_comments_count(self) -> int:
        """Return comments count. Only works if relationship is loaded via selectinload."""
        return len(self.comments)

    @property
    def linked_financial_chart_ids(self) -> list[int]:
        import warnings
        warnings.warn(
            "linked_financial_chart_ids property relies on noload relationship. "
            "Use selectinload(PlanBlock.linked_financial_charts) or call get_linked_chart_ids().",
            DeprecationWarning,
            stacklevel=2,
        )
        return self.get_linked_chart_ids()

    @property
    def comments_count(self) -> int:
        import warnings
        warnings.warn(
            "comments_count property relies on noload relationship. "
            "Use selectinload(PlanBlock.comments) or call get_comments_count().",
            DeprecationWarning,
            stacklevel=2,
        )
        return self.get_comments_count()
