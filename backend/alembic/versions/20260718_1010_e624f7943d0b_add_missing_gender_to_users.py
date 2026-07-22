"""add_missing_gender_to_users

Revision ID: e624f7943d0b
Revises: 923a0a9b7d7f
Create Date: 2026-07-18 10:10:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e624f7943d0b'
down_revision: Union[str, None] = '923a0a9b7d7f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'gender' not in columns:
        op.add_column('users', sa.Column('gender', sa.String(length=50), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    if 'gender' in columns:
        op.drop_column('users', 'gender')
