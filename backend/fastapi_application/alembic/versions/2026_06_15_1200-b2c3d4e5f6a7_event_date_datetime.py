"""change event_date from date to datetime

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f7
Create Date: 2026-06-15 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6a7"
down_revision: str | Sequence[str] | None = "a1b2c3d4e5f7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "calendar_events",
        "event_date",
        existing_type=sa.Date(),
        type_=sa.DateTime(timezone=True),
        postgresql_using="event_date::timestamptz",
    )


def downgrade() -> None:
    op.alter_column(
        "calendar_events",
        "event_date",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.Date(),
        postgresql_using="event_date::date",
    )
