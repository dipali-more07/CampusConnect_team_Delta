"""remove_clubs

Revision ID: 77ffa750631f
Revises: 658ade079d7b
Create Date: 2026-07-10 20:00:00.000000+00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '77ffa750631f'
down_revision: Union[str, None] = '658ade079d7b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Safely drop constraints and columns on events if they exist
    op.execute("ALTER TABLE events DROP CONSTRAINT IF EXISTS events_club_id_fkey")
    op.execute("ALTER TABLE events DROP COLUMN IF EXISTS club_id")
    
    # 2. Create organizers table if it does not exist (without club_id)
    op.execute("""
        CREATE TABLE IF NOT EXISTS organizers (
            organizer_id UUID NOT NULL,
            user_id UUID NOT NULL,
            designation VARCHAR(255),
            permissions JSON,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
            PRIMARY KEY (organizer_id),
            FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
            CONSTRAINT uq_organizer_user UNIQUE (user_id)
        )
    """)

    # 3. Safely drop club_id constraint/column from organizers if they exist
    op.execute("ALTER TABLE organizers DROP CONSTRAINT IF EXISTS organizers_club_id_fkey")
    op.execute("ALTER TABLE organizers DROP COLUMN IF EXISTS club_id")
    
    # 4. Drop clubs table if it exists
    op.execute("DROP TABLE IF EXISTS clubs CASCADE")


def downgrade() -> None:
    # Recreate table and columns if ever rolled back
    op.create_table('clubs',
        sa.Column('club_id', sa.UUID(), autoincrement=False, nullable=False),
        sa.Column('college_id', sa.UUID(), autoincrement=False, nullable=False),
        sa.Column('club_name', sa.String(length=255), autoincrement=False, nullable=False),
        sa.Column('description', sa.Text(), autoincrement=False, nullable=True),
        sa.Column('faculty_incharge', sa.String(length=255), autoincrement=False, nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), autoincrement=False, nullable=False),
        sa.PrimaryKeyConstraint('club_id', name='clubs_pkey')
    )
    op.add_column('organizers', sa.Column('club_id', sa.UUID(), autoincrement=False, nullable=True))
    op.add_column('events', sa.Column('club_id', sa.UUID(), autoincrement=False, nullable=True))
    op.create_foreign_key('organizers_club_id_fkey', 'organizers', 'clubs', ['club_id'], ['club_id'], ondelete='CASCADE')
    op.create_foreign_key('events_club_id_fkey', 'events', 'clubs', ['club_id'], ['club_id'], ondelete='SET NULL')
