"""
app/database/deps.py
=====================
FastAPI dependency functions for authentication and authorization.

WHY DEPENDENCIES:
  FastAPI's Depends() system is powerful - it automatically:
    1. Runs a function before your route handler
    2. Passes the result to your route
    3. Can chain multiple dependencies

  This means authentication logic is written ONCE here,
  and then just used with Depends() in every protected route.

HOW TO USE IN ROUTES:
  # Public route (no auth needed)
  @router.get("/events")
  def list_events(db: Session = Depends(get_db)):
      ...

  # Protected route (must be logged in)
  @router.get("/profile")
  def get_profile(current_user: User = Depends(get_current_user)):
      ...

  # Admin only route
  @router.delete("/colleges/{id}")
  def delete_college(current_user: User = Depends(require_admin)):
      ...
"""

from typing import Optional
from fastapi import Depends, Header
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.base import get_db
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.core.constants import UserRole
from app.models.user import User
from app.models.token import RefreshToken


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Extract and validate the current user from the JWT token.

    HOW IT WORKS:
      1. Frontend sends: Authorization: Bearer <token>
      2. We extract the token from the header
      3. We decode the token to get the user_id
      4. We fetch the user from the database
      5. We return the user object

    If anything fails → raise UnauthorizedException (401)

    This function is used in every protected route.
    """
    # Check if Authorization header exists
    if not authorization:
        raise UnauthorizedException("No authorization token provided")

    # Authorization header format: "Bearer eyJhbGci..."
    # We need just the token part (after "Bearer ")
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException("Invalid token format. Use: Bearer <token>")

    token = parts[1]

    # Decode the JWT token (verify signature + expiry)
    payload = decode_token(token)
    if payload is None:
        raise UnauthorizedException("Token is invalid or expired. Please login again.")

    # Check it's an access token (not a refresh token)
    if payload.get("type") != "access":
        raise UnauthorizedException("Invalid token type")

    # Get user_id from token's 'sub' field
    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Token payload is invalid")

    # Fetch user from database
    user = db.execute(
        select(User).where(User.user_id == user_id)
    ).scalar_one_or_none()

    if user is None:
        raise UnauthorizedException("User associated with this token no longer exists")

    if not user.is_active:
        raise UnauthorizedException("Your account has been deactivated. Contact admin.")

    return user


def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Like get_current_user but returns None instead of raising error.
    Used for routes that work both for guests and logged-in users.

    Example: Public event listing (guests can browse, logged-in users see if registered)
    """
    if not authorization:
        return None
    try:
        return get_current_user(authorization, db)
    except UnauthorizedException:
        return None


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    Ensure current user has Admin role.
    Raises ForbiddenException if not admin.

    Usage: current_user: User = Depends(require_admin)
    """
    if current_user.role != UserRole.ADMIN:
        raise ForbiddenException("This action requires Admin privileges")
    return current_user


def require_organizer(current_user: User = Depends(get_current_user)) -> User:
    """
    Ensure current user has Organizer role.
    Raises ForbiddenException if not organizer.

    Usage: current_user: User = Depends(require_organizer)
    """
    if current_user.role not in [UserRole.ORGANIZER, UserRole.ADMIN]:
        raise ForbiddenException("This action requires Organizer privileges")
    return current_user


def require_participant(current_user: User = Depends(get_current_user)) -> User:
    """
    Ensure current user is authenticated (any role works).
    Just confirms the user is logged in.
    """
    return current_user  # Already validated by get_current_user
