"""
app/repositories/token_repository.py
Token database operations.
"""
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, delete

from app.repositories.base import BaseRepository
from app.models.token import PasswordResetToken, RefreshToken


class PasswordResetTokenRepository(BaseRepository[PasswordResetToken]):
    def __init__(self, db: Session):
        super().__init__(PasswordResetToken, db)

    def get_valid_token(self, token: str) -> Optional[PasswordResetToken]:
        """Get a token that exists, is not used, and is not expired."""
        now = datetime.utcnow()
        return self.db.execute(
            select(PasswordResetToken).where(
                and_(
                    PasswordResetToken.token == token,
                    PasswordResetToken.used == False,
                    PasswordResetToken.expires_at > now,
                )
            )
        ).scalar_one_or_none()

    def invalidate_old_tokens(self, user_id: str) -> None:
        """Mark all old reset tokens for a user as used."""
        self.db.execute(
            delete(PasswordResetToken).where(
                and_(
                    PasswordResetToken.user_id == user_id,
                    PasswordResetToken.used == False,
                )
            )
        )
        self.db.flush()


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, db: Session):
        super().__init__(RefreshToken, db)

    def get_valid_token(self, token: str) -> Optional[RefreshToken]:
        """Get a refresh token that is not revoked and not expired."""
        now = datetime.utcnow()
        return self.db.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.token == token,
                    RefreshToken.revoked == False,
                    RefreshToken.expiry > now,
                )
            )
        ).scalar_one_or_none()

    def revoke_token(self, token: RefreshToken) -> None:
        """Revoke a specific refresh token (used on logout)."""
        token.revoked = True
        self.db.flush()

    def revoke_all_for_user(self, user_id: str) -> None:
        """Revoke all refresh tokens for a user (used on password change)."""
        from sqlalchemy import update
        self.db.execute(
            update(RefreshToken)
            .where(
                and_(RefreshToken.user_id == user_id, RefreshToken.revoked == False)
            )
            .values(revoked=True)
        )
        self.db.flush()
