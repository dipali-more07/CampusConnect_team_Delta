"""
app/services/auth_service.py
=============================
Authentication business logic.

SERVICE RULES:
  - Business logic lives here (not in repositories, not in routers)
  - Services call repositories for DB operations
  - Services handle transactions (commit/rollback)
  - Services raise meaningful exceptions that routers convert to HTTP responses

AUTH FLOW:
  Register:
    1. Check email not already used
    2. Hash the password
    3. Create User record
    4. Create UserProfile record (empty)
    5. Send verification email
    6. Return user data

  Login:
    1. Find user by email
    2. Verify password hash
    3. Check account is active
    4. Generate access token (JWT)
    5. Generate refresh token (JWT + save to DB)
    6. Update last_login timestamp
    7. Return tokens
"""
import secrets
from datetime import datetime
from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository, UserProfileRepository
from app.repositories.token_repository import RefreshTokenRepository, PasswordResetTokenRepository
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.core.constants import UserRole
from app.core.exceptions import (
    ConflictException, UnauthorizedException, BadRequestException, NotFoundException
)
from app.models.user import User, UserProfile
from app.models.token import RefreshToken, PasswordResetToken
from app.schemas.auth import RegisterRequest, LoginRequest
from app.utils.helpers import generate_reset_token, get_reset_token_expiry, get_refresh_token_expiry
from app.services.email_service import email_service


class AuthService:
    """
    Handles all authentication operations.
    Each method is one complete business operation.
    """

    def __init__(self, db: Session):
        # Initialize all repositories we need
        self.db = db
        self.user_repo = UserRepository(db)
        self.profile_repo = UserProfileRepository(db)
        self.refresh_token_repo = RefreshTokenRepository(db)
        self.reset_token_repo = PasswordResetTokenRepository(db)

    async def register(self, data: RegisterRequest) -> User:
        """
        Register a new user.

        Steps:
          1. Check email doesn't exist
          2. Hash password (never store plain text!)
          3. Create User in DB
          4. Create empty UserProfile linked to the User
          5. Commit transaction (both records saved together)
          6. Send verification email

        WHY COMMIT BOTH TOGETHER:
          If User saved but Profile fails -> inconsistent state
          Using one transaction: either BOTH save or NEITHER saves
        """
        # Step 1: Check for duplicate email
        if self.user_repo.email_exists(data.email):
            raise ConflictException(f"Email '{data.email}' is already registered")

        # Step 2: Hash the password
        password_hash = hash_password(data.password)

        # Step 3: Create the User object (not yet in DB)
        new_user = User(
            email=data.email,
            password_hash=password_hash,
            role=UserRole.PARTICIPANT,
            is_active=True,
            is_email_verified=True,  # Set to True because email service is not working
        )

        # Step 4: Save User to DB (flush sends SQL but doesn't commit yet)
        self.user_repo.create(new_user)

        # Step 5: Create empty UserProfile linked to the User
        new_profile = UserProfile(
            user_id=new_user.user_id,
        )
        self.profile_repo.create(new_profile)

        # Step 6: Commit both records at once
        # If anything above failed, we'd never reach this line
        # and SQLAlchemy would rollback automatically
        self.db.commit()

        # Step 7: Generate a 6-digit OTP verification code and send it
        import random
        verification_otp = f"{random.randint(100000, 999999)}"
        await email_service.send_verification_otp(data.email, verification_otp)

        return new_user

    def login(self, data: LoginRequest) -> dict:
        """
        Log in a user and return JWT tokens.

        Returns dict with: access_token, refresh_token, expires_in
        """
        # Step 1: Find user by email
        user = self.user_repo.get_by_email(data.email)
        if user is None:
            # Don't say 'email not found' - that leaks info to hackers
            # Always say 'Invalid credentials'
            raise UnauthorizedException("Invalid email or password")

        # Step 2: Verify password
        if not verify_password(data.password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        # Step 3: Check account status
        if not user.is_active:
            raise UnauthorizedException("Your account has been deactivated. Contact admin.")

        # Step 4: Generate JWT access token
        # 'sub' (subject) is the standard JWT field for user identifier
        access_token = create_access_token(
            data={"sub": user.user_id, "role": user.role}
        )

        # Step 5: Generate refresh token and save to DB
        refresh_token_str = create_refresh_token(
            data={"sub": user.user_id}
        )

        # Save refresh token to DB so we can revoke it later
        refresh_token = RefreshToken(
            user_id=user.user_id,
            token=refresh_token_str,
            expiry=get_refresh_token_expiry(settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.refresh_token_repo.create(refresh_token)

        # Step 6: Update last login time
        self.user_repo.update_last_login(user)

        # Step 7: Commit everything
        self.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token_str,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        }

    def refresh_access_token(self, refresh_token_str: str) -> dict:
        """
        Get a new access token using a refresh token.

        This is called when the access token expires (after 30 min).
        Instead of making the user log in again, we silently issue a new access token.
        """
        # Step 1: Verify the refresh token JWT
        payload = decode_token(refresh_token_str)
        if not payload or payload.get("type") != "refresh":
            raise UnauthorizedException("Invalid refresh token")

        # Step 2: Check if token exists in DB and is not revoked
        db_token = self.refresh_token_repo.get_valid_token(refresh_token_str)
        if db_token is None:
            raise UnauthorizedException("Refresh token is expired or has been revoked")

        # Step 3: Get the user
        user_id = payload.get("sub")
        user = self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or account deactivated")

        # Step 4: Generate new access token
        new_access_token = create_access_token(
            data={"sub": user.user_id, "role": user.role}
        )

        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    def logout(self, refresh_token_str: str) -> None:
        """Revoke refresh token on logout."""
        db_token = self.refresh_token_repo.get_valid_token(refresh_token_str)
        if db_token:
            self.refresh_token_repo.revoke_token(db_token)
            self.db.commit()

    async def forgot_password(self, email: str) -> None:
        """
        Initiate password reset flow.

        Security Note: We always return success even if email doesn't exist.
        This prevents 'email enumeration' attacks (hackers probing which emails are registered).
        """
        user = self.user_repo.get_by_email(email)

        # Always return success (don't reveal if email exists)
        if user is None:
            return

        # Invalidate any existing reset tokens
        self.reset_token_repo.invalidate_old_tokens(user.user_id)

        # Generate new token
        token = generate_reset_token()
        reset_token = PasswordResetToken(
            user_id=user.user_id,
            token=token,
            expires_at=get_reset_token_expiry(),
        )
        self.reset_token_repo.create(reset_token)
        self.db.commit()

        # Send reset email
        await email_service.send_password_reset_email(email, token)

    def reset_password(self, token: str, new_password: str) -> None:
        """Reset password using the token from the email."""
        # Verify token is valid, not used, and not expired
        reset_token = self.reset_token_repo.get_valid_token(token)
        if reset_token is None:
            raise BadRequestException("Invalid or expired password reset token")

        # Get the user
        user = self.user_repo.get_by_id(reset_token.user_id)
        if not user:
            raise NotFoundException("User not found")

        # Update password
        user.password_hash = hash_password(new_password)

        # Mark token as used (can't be reused)
        reset_token.used = True

        # Revoke all refresh tokens (security: new password = new session)
        self.refresh_token_repo.revoke_all_for_user(user.user_id)

        self.db.commit()

    def change_password(
        self, user: User, current_password: str, new_password: str
    ) -> None:
        """Change password for a logged-in user."""
        # Verify they know their current password
        if not verify_password(current_password, user.password_hash):
            raise BadRequestException("Current password is incorrect")

        # Update to new password
        user.password_hash = hash_password(new_password)

        # Revoke all refresh tokens (force re-login on all devices)
        self.refresh_token_repo.revoke_all_for_user(user.user_id)

        self.db.commit()
