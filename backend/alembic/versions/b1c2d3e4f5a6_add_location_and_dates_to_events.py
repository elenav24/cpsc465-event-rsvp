"""Add location and dates to events

Revision ID: b1c2d3e4f5a6
Revises: 04da1380e233
Create Date: 2026-05-03 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, Sequence[str], None] = '04da1380e233'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('events', sa.Column('location', sa.String(), nullable=True))
    op.add_column('events', sa.Column('start_dt', sa.DateTime(), nullable=True))
    op.add_column('events', sa.Column('end_dt', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('events', 'end_dt')
    op.drop_column('events', 'start_dt')
    op.drop_column('events', 'location')
