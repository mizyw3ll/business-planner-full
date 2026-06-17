"""tax_events_datetime_notify

Revision ID: 00e0591122d1
Revises: b9c0d1e2f3a4
Create Date: 2026-06-11 18:19:51.774268

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "00e0591122d1"
down_revision: str | Sequence[str] | None = "b9c0d1e2f3a4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "tax_events",
        sa.Column(
            "notify_before",
            sa.Integer(),
            nullable=True,
            comment="За сколько минут до события уведомить",
        ),
    )
    op.add_column(
        "tax_events",
        sa.Column(
            "notified_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="Когда было отправлено уведомление",
        ),
    )
    op.alter_column(
        "tax_events",
        "event_date",
        existing_type=sa.DATE(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False,
        postgresql_using="event_date::timestamptz",
    )
    op.drop_index(op.f("ix_tax_events_event_date"), table_name="tax_events")
    op.create_index(
        op.f("ix_tax_events_event_date"),
        "tax_events",
        ["event_date"],
        unique=False,
        postgresql_using="btree",
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_tax_events_event_date"), table_name="tax_events")
    op.alter_column(
        "tax_events",
        "event_date",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DATE(),
        existing_nullable=False,
    )
    op.create_index("ix_tax_events_event_date", "tax_events", ["event_date"], unique=False)
    op.drop_column("tax_events", "notified_at")
    op.drop_column("tax_events", "notify_before")
