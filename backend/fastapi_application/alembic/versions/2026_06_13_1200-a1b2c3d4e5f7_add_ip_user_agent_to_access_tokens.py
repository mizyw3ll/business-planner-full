"""add ip_address and user_agent to access_tokens

Revision ID: a1b2c3d4e5f7
Revises: d512983fa450
Create Date: 2026-06-13 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f7"
down_revision: str | Sequence[str] | None = "d512983fa450"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "access_tokens",
        sa.Column(
            "ip_address",
            sa.String(length=45),
            nullable=True,
            comment="IP address of the client at login (IPv4 or IPv6)",
        ),
    )
    op.add_column(
        "access_tokens",
        sa.Column(
            "user_agent",
            sa.String(length=512),
            nullable=True,
            comment="User-Agent header at login",
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("access_tokens", "user_agent")
    op.drop_column("access_tokens", "ip_address")
