"""Initial users schema

Revision ID: 0001_users
Revises:
Create Date: 2026-05-02

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001_users"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("cognito_sub", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("cognito_sub", name="uq_users_cognito_sub"),
    )
    op.create_index("ix_users_cognito_sub", "users", ["cognito_sub"])


def downgrade() -> None:
    op.drop_index("ix_users_cognito_sub", table_name="users")
    op.drop_table("users")
