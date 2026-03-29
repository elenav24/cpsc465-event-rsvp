"""replace username with cognito_sub

Revision ID: a1b2c3d4e5f6
Revises: 04da1380e233
Create Date: 2026-03-29
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '04da1380e233'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column('users', 'username')
    op.add_column('users', sa.Column('cognito_sub', sa.String(), nullable=False, server_default=''))
    op.alter_column('users', 'cognito_sub', server_default=None)
    op.create_unique_constraint('uq_users_cognito_sub', 'users', ['cognito_sub'])
    op.create_index('ix_users_cognito_sub', 'users', ['cognito_sub'])


def downgrade() -> None:
    op.drop_index('ix_users_cognito_sub', table_name='users')
    op.drop_constraint('uq_users_cognito_sub', 'users', type_='unique')
    op.drop_column('users', 'cognito_sub')
    op.add_column('users', sa.Column('username', sa.String(), nullable=False, server_default=''))
