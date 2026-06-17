"""add_calendar_event_model_and_due_date_on_block

Revision ID: add_calendar
Revises: add_projects_notes
Create Date: 2026-06-07 17:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "add_calendar"
down_revision: str | Sequence[str] | None = "add_projects_notes"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("plan_blocks", sa.Column("due_date", sa.Date(), nullable=True))

    op.create_table(
        "calendar_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False, server_default="manual"),
        sa.Column("related_plan_id", sa.Integer(), nullable=True),
        sa.Column("related_block_id", sa.Integer(), nullable=True),
        sa.Column("related_note_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_calendar_events_user_id"), "calendar_events", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_calendar_events_user_id"), table_name="calendar_events")
    op.drop_table("calendar_events")
    op.drop_column("plan_blocks", "due_date")
