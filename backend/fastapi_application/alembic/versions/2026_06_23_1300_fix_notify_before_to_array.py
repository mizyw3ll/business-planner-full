"""fix notify_before scalar → array for existing rows

Revision ID: fix_notify_before_array
Revises: notify_before_json
Create Date: 2026-06-23 13:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "fix_notify_before_array"
down_revision: str | Sequence[str] | None = "notify_before_json"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # calendar_events: scalar jsonb number → array
    op.execute("""
        UPDATE calendar_events
        SET notify_before = jsonb_build_array(notify_before::numeric::int)
        WHERE jsonb_typeof(notify_before) = 'number'
    """)
    # tax_events
    op.execute("""
        UPDATE tax_events
        SET notify_before = jsonb_build_array(notify_before::numeric::int)
        WHERE jsonb_typeof(notify_before) = 'number'
    """)


def downgrade() -> None:
    # calendar_events: array → first element as scalar
    op.execute("""
        UPDATE calendar_events
        SET notify_before = (notify_before->>0)::numeric::int
        WHERE jsonb_typeof(notify_before) = 'array'
    """)
    # tax_events
    op.execute("""
        UPDATE tax_events
        SET notify_before = (notify_before->>0)::numeric::int
        WHERE jsonb_typeof(notify_before) = 'array'
    """)
