"""notify_before to JSON array + notified_values

Revision ID: notify_before_json
Revises: add_composite_indexes_v3
Create Date: 2026-06-23 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "notify_before_json"
down_revision: str | Sequence[str] | None = "add_composite_indexes_v3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # calendar_events: integer → json, add notified_values
    op.execute(
        "ALTER TABLE calendar_events ALTER COLUMN notify_before TYPE jsonb "
        "USING CASE "
        "  WHEN notify_before IS NOT NULL THEN to_jsonb(notify_before) "
        "  ELSE NULL "
        "END"
    )
    op.add_column(
        "calendar_events",
        sa.Column("notified_values", sa.JSON(), nullable=True),
    )

    # tax_events: integer → json, add notified_values
    op.execute(
        "ALTER TABLE tax_events ALTER COLUMN notify_before TYPE jsonb "
        "USING CASE "
        "  WHEN notify_before IS NOT NULL THEN to_jsonb(notify_before) "
        "  ELSE NULL "
        "END"
    )
    op.add_column(
        "tax_events",
        sa.Column("notified_values", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    # calendar_events: json → integer (take first value)
    op.execute(
        "ALTER TABLE calendar_events ALTER COLUMN notify_before TYPE integer "
        "USING CASE "
        "  WHEN notify_before IS NOT NULL THEN (notify_before->>0)::integer "
        "  ELSE NULL "
        "END"
    )
    op.drop_column("calendar_events", "notified_values")

    # tax_events: json → integer
    op.execute(
        "ALTER TABLE tax_events ALTER COLUMN notify_before TYPE integer "
        "USING CASE "
        "  WHEN notify_before IS NOT NULL THEN (notify_before->>0)::integer "
        "  ELSE NULL "
        "END"
    )
    op.drop_column("tax_events", "notified_values")
