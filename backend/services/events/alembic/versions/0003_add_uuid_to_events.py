"""Add uuid column to events table

Revision ID: 0003
Revises: 0002_full_schema
Create Date: 2026-05-04
"""
from alembic import op
import sqlalchemy as sa
import uuid


# revision identifiers, used by Alembic.
revision = "0003_add_uuid_to_events"
down_revision = "0002_full_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add uuid column as nullable first
    op.add_column("events", sa.Column("uuid", sa.String(), nullable=True))

    # Backfill existing rows with unique UUIDs
    connection = op.get_bind()
    events = connection.execute(sa.text("SELECT id FROM events")).fetchall()
    for row in events:
        connection.execute(
            sa.text("UPDATE events SET uuid = :uuid WHERE id = :id"),
            {"uuid": str(uuid.uuid4()), "id": row[0]},
        )

    # Now make it non-nullable and add unique index
    op.alter_column("events", "uuid", nullable=False)
    op.create_index("ix_events_uuid", "events", ["uuid"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_events_uuid", table_name="events")
    op.drop_column("events", "uuid")
