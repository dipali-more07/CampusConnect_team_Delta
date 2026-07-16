"""
app/core/config.py
==================
Configuration module - reads all settings from the .env file.

WHY: We never hardcode passwords, secrets, or database URLs in code.
     Instead, we read them from environment variables. This way:
     - Dev uses one database, Production uses another
     - Secrets are never committed to GitHub
     - Different environments work with the same code

HOW: Pydantic Settings reads from .env file automatically.
     If a variable is missing, it raises an error on startup.
"""

# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    """
    All application settings come from environment variables.
    Pydantic automatically reads from .env file.
    """

    # --- App Info ---
    APP_NAME: str = "CampusConnect"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    APP_URL: str = "http://localhost:8000"

    # --- Database ---
    # Full PostgreSQL connection string
    DATABASE_URL: str

    # --- JWT Tokens ---
    SECRET_KEY: str                           # Must be secret and long
    ALGORITHM: str = "HS256"                  # JWT signing algorithm
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30     # Access token lifetime
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7        # Refresh token lifetime

    # --- Email ---
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@campusconnect.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    MOCK_EMAIL: bool = False

    # --- Razorpay ---
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    MOCK_PAYMENT: bool = True

    # --- File Storage ---
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10

    # --- Rate Limiting ---
    RATE_LIMIT_PER_MINUTE: int = 60

    # --- CORS ---
    # This is a comma-separated string in .env, we parse it into a list below
    ALLOWED_ORIGINS: str = (
        "http://localhost:3000,http://localhost:3001,http://localhost:5173,http://localhost:8000,"
        "http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:5173,http://127.0.0.1:8000"
    )

    # --- First Admin ---
    FIRST_ADMIN_EMAIL: str = "admin@campusconnect.com"
    FIRST_ADMIN_PASSWORD: str = "Admin@123456"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: str) -> str:
        """Keep as string, we'll split it when needed."""
        return v

    def get_allowed_origins_list(self) -> List[str]:
        """Returns ALLOWED_ORIGINS as a Python list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        # Tell Pydantic to read from .env file
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"


# Create a single instance that every module imports
# This is the Singleton pattern - only one settings object exists
settings = Settings()
