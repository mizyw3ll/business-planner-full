"""plan blocks draft/media links and currency rates

Revision ID: 4b7f6c2a9f1d
Revises: dd1c875d1eaa
Create Date: 2026-04-13 12:10:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "4b7f6c2a9f1d"
down_revision: str | Sequence[str] | None = "dd1c875d1eaa"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "plan_blocks",
        sa.Column("rich_content", sa.JSON(), server_default=sa.text("'{}'::json"), nullable=False),
    )
    op.add_column(
        "plan_blocks",
        sa.Column("media_attachments", sa.JSON(), server_default=sa.text("'[]'::json"), nullable=False),
    )
    op.add_column("plan_blocks", sa.Column("draft_title", sa.String(length=100), nullable=True))
    op.add_column("plan_blocks", sa.Column("draft_content", sa.Text(), nullable=True))
    op.add_column("plan_blocks", sa.Column("draft_rich_content", sa.JSON(), nullable=True))
    op.add_column("plan_blocks", sa.Column("draft_media_attachments", sa.JSON(), nullable=True))
    op.add_column("plan_blocks", sa.Column("draft_saved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "plan_blocks",
        sa.Column("has_unpublished_draft", sa.Boolean(), server_default="false", nullable=False),
    )

    op.create_table(
        "plan_block_financial_charts",
        sa.Column("plan_block_id", sa.Integer(), nullable=False),
        sa.Column("financial_chart_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["financial_chart_id"],
            ["financial_charts.id"],
            name=op.f("fk_plan_block_financial_charts_financial_chart_id_financial_charts"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["plan_block_id"],
            ["plan_blocks.id"],
            name=op.f("fk_plan_block_financial_charts_plan_block_id_plan_blocks"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("plan_block_id", "financial_chart_id", name=op.f("pk_plan_block_financial_charts")),
    )

    op.add_column(
        "currencies",
        sa.Column("kind", sa.String(length=20), server_default="fiat", nullable=False),
    )
    op.add_column("currencies", sa.Column("external_id", sa.String(length=100), nullable=True))
    op.add_column(
        "currencies",
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
    )

    op.create_table(
        "currency_rates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("currency_id", sa.Integer(), nullable=False),
        sa.Column("quote_code", sa.String(length=10), nullable=False),
        sa.Column("rate", sa.Numeric(precision=20, scale=8), nullable=False),
        sa.Column("source", sa.String(length=50), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["currency_id"],
            ["currencies.id"],
            name=op.f("fk_currency_rates_currency_id_currencies"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_currency_rates")),
        sa.UniqueConstraint(
            "currency_id",
            "quote_code",
            "fetched_at",
            name="uq_currency_rates_currency_quote_fetched_at",
        ),
    )
    op.create_index(op.f("ix_currency_rates_currency_id"), "currency_rates", ["currency_id"], unique=False)
    op.create_index(op.f("ix_currency_rates_quote_code"), "currency_rates", ["quote_code"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_currency_rates_quote_code"), table_name="currency_rates")
    op.drop_index(op.f("ix_currency_rates_currency_id"), table_name="currency_rates")
    op.drop_table("currency_rates")

    op.drop_column("currencies", "is_active")
    op.drop_column("currencies", "external_id")
    op.drop_column("currencies", "kind")

    op.drop_table("plan_block_financial_charts")

    op.drop_column("plan_blocks", "has_unpublished_draft")
    op.drop_column("plan_blocks", "draft_saved_at")
    op.drop_column("plan_blocks", "draft_media_attachments")
    op.drop_column("plan_blocks", "draft_rich_content")
    op.drop_column("plan_blocks", "draft_content")
    op.drop_column("plan_blocks", "draft_title")
    op.drop_column("plan_blocks", "media_attachments")
    op.drop_column("plan_blocks", "rich_content")
