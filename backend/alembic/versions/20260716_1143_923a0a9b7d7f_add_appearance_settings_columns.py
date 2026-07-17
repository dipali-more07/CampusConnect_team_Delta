"""add_appearance_settings_columns

Revision ID: 923a0a9b7d7f
Revises: cb66fd266a3f
Create Date: 2026-07-16 11:43:12.628183+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '923a0a9b7d7f'
down_revision: Union[str, None] = 'cb66fd266a3f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('user_profiles')]
    
    if 'theme_mode' not in columns:
        op.add_column('user_profiles', sa.Column('theme_mode', sa.String(length=50), nullable=True))
    if 'accent_color' not in columns:
        op.add_column('user_profiles', sa.Column('accent_color', sa.String(length=50), nullable=True))
    if 'font_size' not in columns:
        op.add_column('user_profiles', sa.Column('font_size', sa.String(length=50), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col['name'] for col in inspector.get_columns('user_profiles')]
    
    if 'font_size' in columns:
        op.drop_column('user_profiles', 'font_size')
    if 'accent_color' in columns:
        op.drop_column('user_profiles', 'accent_color')
    if 'theme_mode' in columns:
        op.drop_column('user_profiles', 'theme_mode')
