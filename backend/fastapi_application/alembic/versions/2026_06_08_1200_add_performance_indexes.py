"""add_performance_indexes

Revision ID: perf_indexes
Revises: add_calendar
Create Date: 2026-06-08 12:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "perf_indexes"
down_revision: str | Sequence[str] | None = "add_calendar"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_business_plans_user_id",
        "business_plans",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_chart_points_chart_id",
        "chart_points",
        ["chart_id"],
        unique=False,
    )
    op.create_index(
        "ix_calendar_events_user_date",
        "calendar_events",
        ["user_id", "event_date"],
        unique=False,
    )
    op.create_index(
        "ix_notes_user_updated",
        "notes",
        ["user_id", "updated_at"],
        unique=False,
    )
    op.create_index(
        "ix_plan_tags_tag_id",
        "plan_tags",
        ["tag_id"],
        unique=False,
    )
    op.create_index(
        "ix_block_tags_tag_id",
        "block_tags",
        ["tag_id"],
        unique=False,
    )
    op.create_index(
        "ix_note_tags_tag_id",
        "note_tags",
        ["tag_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_note_tags_tag_id", table_name="note_tags")
    op.drop_index("ix_block_tags_tag_id", table_name="block_tags")
    op.drop_index("ix_plan_tags_tag_id", table_name="plan_tags")
    op.drop_index("ix_notes_user_updated", table_name="notes")
    op.drop_index("ix_calendar_events_user_date", table_name="calendar_events")
    op.drop_index("ix_chart_points_chart_id", table_name="chart_points")
    op.drop_index("ix_business_plans_user_id", table_name="business_plans")
