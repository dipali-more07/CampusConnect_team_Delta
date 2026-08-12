"""
app/core/security.py
=====================
All security-related functions: password hashing and JWT tokens.

WHY BCRYPT:
  - bcrypt is a one-way hashing function
  - You can NEVER reverse a bcrypt hash back to the original password
  - Even if someone steals your database, they can't read passwords
  - It's intentionally slow, making brute-force attacks take years

WHY JWT:
  - JWT (JSON Web Token) is a compact, self-contained token
  - It contains user info (user_id, role) that we can verify
  - We don't need to query the database for every request
  - The token is signed with our SECRET_KEY - if tampered, it becomes invalid

HOW TOKENS WORK:
  Login → Server creates JWT with user_id → Client stores it
  Next Request → Client sends JWT → Server verifies it → No DB query needed
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# ---------------------------------------------------------------
# PASSWORD HASHING
# ---------------------------------------------------------------

import base64


def decode_prehashed_or_base64_password(password: str) -> str:
    """
    If password is base64 encoded (e.g. btoa from frontend), decode it.
    Otherwise return the password as-is.
    """
    if not password:
        return password
    try:
        decoded_bytes = base64.b64decode(password)
        decoded_str = decoded_bytes.decode("utf-8")
        if base64.b64encode(decoded_str.encode("utf-8")).decode("utf-8") == password.strip():
            return decoded_str
    except Exception:
        pass
    return password


def hash_password(plain_password: str) -> str:
    """
    Convert a plain text (or base64 btoa prehashed) password to a secure bcrypt hash.

    Example:
        hash_password("mypassword123") → "$2b$12$abcdef..."
        The "$2b$12$" part tells us it's bcrypt with 12 rounds.
    """
    clean_pwd = decode_prehashed_or_base64_password(plain_password)
    pwd_bytes = clean_pwd.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check if a plain password (or base64 btoa prehashed password) matches a stored hash.
    Supports both direct string comparison and base64 decoded string verification.
    """
    hashed_bytes = hashed_password.encode("utf-8")

    # Try 1: Direct verification
    pwd_bytes = plain_password.encode("utf-8")
    try:
        if bcrypt.checkpw(pwd_bytes, hashed_bytes):
            return True
    except Exception:
        pass

    # Try 2: Base64 (btoa) decoded password verification
    try:
        decoded_pwd = decode_prehashed_or_base64_password(plain_password)
        if decoded_pwd != plain_password:
            dec_bytes = decoded_pwd.encode("utf-8")
            if bcrypt.checkpw(dec_bytes, hashed_bytes):
                return True
    except Exception:
        pass

    return False


# ---------------------------------------------------------------
# JWT TOKENS
# ---------------------------------------------------------------

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a short-lived JWT access token.

    HOW IT WORKS:
      1. Take user data (usually {"sub": user_id, "role": "admin"})
      2. Add an expiry time
      3. Sign it with our SECRET_KEY
      4. Return the encoded token string

    The token looks like: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOi..."
    It has 3 parts separated by dots: header.payload.signature
    """
    # Make a copy so we don't modify the original dict
    to_encode = data.copy()

    # Set expiry time
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Add expiry to the token payload
    to_encode.update({"exp": expire, "type": "access"})

    # Sign and encode the token
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a long-lived JWT refresh token.

    WHY TWO TOKENS:
      - Access token: short-lived (30 min), used for API calls
      - Refresh token: long-lived (7 days), used only to get new access tokens

    If an access token is stolen, it expires in 30 minutes.
    The refresh token is stored in DB so we can revoke it manually.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT token.

    Returns:
        The payload dict if token is valid.
        None if token is invalid, expired, or tampered.

    This automatically checks:
        - Signature is valid (not tampered)
        - Token is not expired
        - Token format is correct
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        # JWTError covers: expired tokens, invalid signature, malformed tokens
        return None


def get_token_subject(token: str) -> Optional[str]:
    """
    Extract the user_id from a token.

    The 'sub' (subject) field in JWT is standard for storing the user identifier.
    """
    payload = decode_token(token)
    if payload is None:
        return None
    return payload.get("sub")
