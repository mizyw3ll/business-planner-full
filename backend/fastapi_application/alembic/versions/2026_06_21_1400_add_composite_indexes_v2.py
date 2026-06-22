"""add_missing_composite_indexes_and_email_log_fk

Revision ID: add_composite_indexes_v2
Revises: restore_perf_indexes
Create Date: 2026-06-21 14:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "add_composite_indexes_v2"
down_revision: str | Sequence[str] | None = "restore_perf_indexes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── 1. Add missing composite indexes for common query patterns ──
    op.create_index(
        "ix_notifications_user_unread",
        "notifications",
        ["user_id", "is_read"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_deals_user_status",
        "deals",
        ["user_id", "status"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_tax_events_user_completed",
        "tax_events",
        ["user_id", "is_completed"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_calendar_events_user_notified",
        "calendar_events",
        ["user_id", "notified_at"],
        unique=False,
        if_not_exists=True,
    )
    op.create_index(
        "ix_business_plans_updated_at",
        "business_plans",
        ["updated_at"],
        unique=False,
        if_not_exists=True,
    )

    # ── 2. Add FK constraint to email_logs.user_id ──
    op.create_foreign_key(
        "fk_email_logs_user_id_users",
        "email_logs",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_email_logs_user_id_users", "email_logs", type_="foreignkey")
    op.drop_index("ix_business_plans_updated_at", table_name="business_plans")
    op.drop_index("ix_calendar_events_user_notified", table_name="calendar_events")
    op.drop_index("ix_tax_events_user_completed", table_name="tax_events")
    op.drop_index("ix_deals_user_status", table_name="deals")
    op.drop_index("ix_notifications_user_unread", table_name="notifications")
