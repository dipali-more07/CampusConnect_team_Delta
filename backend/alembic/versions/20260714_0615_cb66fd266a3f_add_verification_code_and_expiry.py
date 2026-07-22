"""add_verification_code_and_expiry

Revision ID: cb66fd266a3f
Revises: 77ffa750631f
Create Date: 2026-07-14 06:15:28.948424+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'cb66fd266a3f'
down_revision: Union[str, None] = '77ffa750631f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # 1. Inspect organizers table
    org_columns = inspector.get_columns('organizers')
    created_at_col = next((c for c in org_columns if c['name'] == 'created_at'), None)
    if created_at_col and created_at_col['nullable']:
        op.alter_column('organizers', 'created_at',
                   existing_type=postgresql.TIMESTAMP(),
                   nullable=False,
                   existing_server_default=sa.text('now()'))
                   
    uq_constraints = inspector.get_unique_constraints('organizers')
    uq_names = [uc['name'] for uc in uq_constraints if uc.get('name')]
    if 'uq_organizer_user' in uq_names:
        op.drop_constraint('uq_organizer_user', 'organizers', type_='unique')
        
    indexes = inspector.get_indexes('organizers')
    index_names = [idx['name'] for idx in indexes if idx.get('name')]
    if 'ix_organizers_organizer_id' not in index_names:
        op.create_index('ix_organizers_organizer_id', 'organizers', ['organizer_id'], unique=False)
    if 'ix_organizers_user_id' not in index_names:
        op.create_index('ix_organizers_user_id', 'organizers', ['user_id'], unique=True)
        
    # 2. Inspect users table
    user_columns = [col['name'] for col in inspector.get_columns('users')]
    if 'verification_code' not in user_columns:
        op.add_column('users', sa.Column('verification_code', sa.String(length=6), nullable=True))
    if 'verification_code_expires_at' not in user_columns:
        op.add_column('users', sa.Column('verification_code_expires_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    
    # 1. Inspect users table
    user_columns = [col['name'] for col in inspector.get_columns('users')]
    if 'verification_code' in user_columns:
        op.drop_column('users', 'verification_code')
    if 'verification_code_expires_at' in user_columns:
        op.drop_column('users', 'verification_code_expires_at')
        
    # 2. Inspect organizers table
    indexes = inspector.get_indexes('organizers')
    index_names = [idx['name'] for idx in indexes if idx.get('name')]
    if 'ix_organizers_user_id' in index_names:
        op.drop_index('ix_organizers_user_id', table_name='organizers')
    if 'ix_organizers_organizer_id' in index_names:
        op.drop_index('ix_organizers_organizer_id', table_name='organizers')
        
    uq_constraints = inspector.get_unique_constraints('organizers')
    uq_names = [uc['name'] for uc in uq_constraints if uc.get('name')]
    if 'uq_organizer_user' not in uq_names:
        op.create_unique_constraint('uq_organizer_user', 'organizers', ['user_id'])
        
    org_columns = inspector.get_columns('organizers')
    created_at_col = next((c for c in org_columns if c['name'] == 'created_at'), None)
    if created_at_col and not created_at_col['nullable']:
        op.alter_column('organizers', 'created_at',
                   existing_type=postgresql.TIMESTAMP(),
                   nullable=True,
                   existing_server_default=sa.text('now()'))
