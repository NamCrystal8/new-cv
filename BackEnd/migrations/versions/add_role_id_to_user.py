"""Add role_id to user table

Revision ID: add_role_id_to_user
Revises: 7328bcefd75a
Create Date: 2025-06-03 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_role_id_to_user'
down_revision = '7328bcefd75a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add role_id column with default=2 (User role)
    op.add_column('user', sa.Column('role_id', sa.Integer(), nullable=False, server_default='2'))
    
    # Create foreign key constraint
    op.create_foreign_key(
        "fk_user_role_id_roles", 
        "user", 
        "roles", 
        ["role_id"], 
        ["id"]
    )


def downgrade() -> None:
    # Drop foreign key first
    op.drop_constraint("fk_user_role_id_roles", "user", type_="foreignkey")
    
    # Then drop column
    op.drop_column('user', 'role_id')
