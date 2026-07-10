"""
app/models/token.py
PasswordResetToken and RefreshToken models.
"""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    token_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="password_reset_tokens")

    def __repr__(self) -> str:
        return f"<PasswordResetToken user:{self.user_id} used:{self.used}>"


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    refresh_token_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token: Mapped[str] = mapped_column(String(500), unique=True, nullable=False, index=True)
    expiry: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")

    def __repr__(self) -> str:
        return f"<RefreshToken user:{self.user_id} revoked:{self.revoked}>"
