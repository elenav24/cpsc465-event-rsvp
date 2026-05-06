"""Add display_name column to event_members

Revision ID: 0004_display_name
Revises: 0003_add_uuid_to_events
Create Date: 2026-05-05
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0004_display_name"
down_revision = "0003_add_uuid_to_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "event_members", sa.Column("display_name", sa.String(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("event_members", "display_name")
