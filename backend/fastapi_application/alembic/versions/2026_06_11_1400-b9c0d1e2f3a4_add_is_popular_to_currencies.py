"""add is_popular to currencies and seed popular ones

Revision ID: b9c0d1e2f3a4
Revises: a7b8c9d0e1f2
Create Date: 2026-06-11 14:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b9c0d1e2f3a4"
down_revision: str | Sequence[str] | None = "a7b8c9d0e1f2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "currencies",
        sa.Column("is_popular", sa.Boolean(), server_default="false", nullable=False),
    )
    op.execute(
        "UPDATE currencies SET is_popular = true WHERE code IN "
        "('USD', 'EUR', 'RUB', 'GBP', 'JPY', 'CNY', 'CHF', 'CAD', 'AUD')"
    )


def downgrade() -> None:
    op.drop_column("currencies", "is_popular")
