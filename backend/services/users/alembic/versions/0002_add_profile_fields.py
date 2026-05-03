"""Add display_name, phone_number, sms_opted_in to users

Revision ID: 0002_users
Revises: 0001_users
Create Date: 2026-05-03
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0002_users"
down_revision: Union[str, Sequence[str], None] = "0001_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("display_name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("phone_number", sa.String(), nullable=True))
    op.add_column("users", sa.Column("sms_opted_in", sa.Boolean(), nullable=False, server_default="false"))


def downgrade() -> None:
    op.drop_column("users", "sms_opted_in")
    op.drop_column("users", "phone_number")
    op.drop_column("users", "display_name")
