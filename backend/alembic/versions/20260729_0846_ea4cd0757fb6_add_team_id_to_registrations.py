"""add_team_id_to_registrations

Revision ID: ea4cd0757fb6
Revises: 986d2fe017ca
Create Date: 2026-07-29 08:46:47.055425+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ea4cd0757fb6'
down_revision: Union[str, None] = '986d2fe017ca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE registrations ADD COLUMN IF NOT EXISTS team_id UUID;")


def downgrade() -> None:
    pass
