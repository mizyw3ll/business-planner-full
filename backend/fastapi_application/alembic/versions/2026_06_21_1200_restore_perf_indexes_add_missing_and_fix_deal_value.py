"""restore_indexes_add_missing_and_fix_deal_value

Revision ID: restore_perf_indexes
Revises: b2c3d4e5f6a7
Create Date: 2026-06-21 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "restore_perf_indexes"
down_revision: str | Sequence[str] | None = "b2c3d4e5f6a7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── 1. Restore 7 performance indexes dropped by d512983fa450 ──
    op.create_index(
        "ix_business_plans_user_id",
        "business_plans",
        ["user_id"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_chart_points_chart_id",
        "chart_points",
        ["chart_id"],
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
        "ix_notes_user_updated",
        "notes",
        ["user_id", "updated_at"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_plan_tags_tag_id",
        "plan_tags",
        ["tag_id"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_block_tags_tag_id",
        "block_tags",
        ["tag_id"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_note_tags_tag_id",
        "note_tags",
        ["tag_id"],
        unique=False,
        if_not_exists=True,
    )

    # ── 2. Add missing FK indexes ──
    op.create_index(
        "ix_access_tokens_user_id",
        "access_tokens",
        ["user_id"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_block_comments_user_id",
        "block_comments",
        ["user_id"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_plan_snapshots_created_by_id",
        "plan_snapshots",
        ["created_by_id"],
        unique=False,
        if_not_exists=True,
    )

    # ── 3. Add missing indexes on commonly filtered columns ──
    op.create_index(
        "ix_deals_status",
        "deals",
        ["status"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_deals_user_id",
        "deals",
        ["user_id"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_notifications_is_read",
        "notifications",
        ["is_read"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_notifications_created_at",
        "notifications",
        ["created_at"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_tags_user_id_name",
        "tags",
        ["user_id", "name"],
        unique=False,
        if_not_exists=True,
    )

    # ── 4. Fix Float -> Numeric for deals.value (monetary precision) ──
    op.alter_column(
        "deals",
        "value",
        existing_type=sa.Float(),
        type_=sa.Numeric(15, 2),
        existing_nullable=True,
    )


def downgrade() -> None:
    # Revert deals.value Float -> Numeric
    op.alter_column(
        "deals",
        "value",
        existing_type=sa.Numeric(15, 2),
        type_=sa.Float(),
        existing_nullable=True,
    )

    # Drop newly added indexes
    op.drop_index("ix_tags_user_id_name", table_name="tags")
    op.drop_index("ix_notifications_created_at", table_name="notifications")
    op.drop_index("ix_notifications_is_read", table_name="notifications")
    op.drop_index("ix_deals_user_id", table_name="deals")
    op.drop_index("ix_deals_status", table_name="deals")
    op.drop_index("ix_plan_snapshots_created_by_id", table_name="plan_snapshots")
    op.drop_index("ix_block_comments_user_id", table_name="block_comments")
    op.drop_index("ix_access_tokens_user_id", table_name="access_tokens")

    # Drop restored performance indexes
    op.drop_index("ix_note_tags_tag_id", table_name="note_tags")
    op.drop_index("ix_block_tags_tag_id", table_name="block_tags")
    op.drop_index("ix_plan_tags_tag_id", table_name="plan_tags")
    op.drop_index("ix_notes_user_updated", table_name="notes")
    op.drop_index("ix_calendar_events_user_date", table_name="calendar_events")
    op.drop_index("ix_chart_points_chart_id", table_name="chart_points")
    op.drop_index("ix_business_plans_user_id", table_name="business_plans")
