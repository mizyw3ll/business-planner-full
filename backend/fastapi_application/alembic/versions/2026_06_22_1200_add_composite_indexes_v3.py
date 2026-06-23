"""add_missing_composite_indexes_v3

Revision ID: add_composite_indexes_v3
Revises: add_composite_indexes_v2
Create Date: 2026-06-22 12:00:00.000000

Adds missing composite and single-column indexes for common query patterns.
"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "add_composite_indexes_v3"
down_revision: str | Sequence[str] | None = "add_composite_indexes_v2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_plan_blocks_plan_order",
        "plan_blocks",
        ["business_plan_id", "block_order"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_board_cards_column_order",
        "board_cards",
        ["column_id", "card_order"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_calendar_events_user_date",
        "calendar_events",
        ["user_id", "event_date"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_notifications_user_created",
        "notifications",
        ["user_id", "created_at"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_tax_events_user_date",
        "tax_events",
        ["user_id", "event_date"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_chart_points_chart_date",
        "chart_points",
        ["chart_id", "date"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_contacts_user_created",
        "contacts",
        ["user_id", "created_at"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_deals_user_created",
        "deals",
        ["user_id", "created_at"],
        unique=False,
        if_not_exists=True,
    )


def downgrade() -> None:
    op.drop_index("ix_deals_user_created", table_name="deals")
    op.drop_index("ix_contacts_user_created", table_name="contacts")
    op.drop_index("ix_chart_points_chart_date", table_name="chart_points")
    op.drop_index("ix_tax_events_user_date", table_name="tax_events")
    op.drop_index("ix_notifications_user_created", table_name="notifications")
    op.drop_index("ix_calendar_events_user_date", table_name="calendar_events")
    op.drop_index("ix_board_cards_column_order", table_name="board_cards")
    op.drop_index("ix_plan_blocks_plan_order", table_name="plan_blocks")
