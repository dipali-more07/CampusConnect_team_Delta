"""
app/main.py
============
The entry point of the entire FastAPI application.

HOW FASTAPI APP STARTS:
  1. Python imports this file
  2. FastAPI() creates the app
  3. We add middleware (logging, rate limiting, CORS)
  4. We mount the API router
  5. We add global exception handlers
  6. Uvicorn calls app.run() which starts the HTTP server

ON STARTUP:
  - We create the first admin user if it doesn't exist
  - We create upload directories

LIFESPAN:
  FastAPI uses a 'lifespan' context manager to run code:
  - Before the server starts (startup)
  - After the server stops (shutdown)

  Think of it like: before opening a restaurant, turn on the stoves.
  After closing, turn them off.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.api.v1.router import api_router
from app.middleware.logging_middleware import LoggingMiddleware
from app.middleware.rate_limit_middleware import limiter, rate_limit_exceeded_handler
# pyrefly: ignore [missing-import]
from slowapi.errors import RateLimitExceeded
from pathlib import Path

# Set up application-level logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("campusconnect.main")


def create_upload_directories() -> None:
    """Create required directories for file uploads."""
    for subdir in ["posters", "profiles", "certificates", "qrcodes"]:
        Path(settings.UPLOAD_DIR, subdir).mkdir(parents=True, exist_ok=True)
    logger.info(f"Upload directories created in: {settings.UPLOAD_DIR}")


def create_first_admin() -> None:
    """
    Create the default admin user on first startup.

    WHY: Someone needs to manage the platform initially.
         Instead of manually inserting into DB, we auto-create the first admin.
         Credentials come from .env (FIRST_ADMIN_EMAIL, FIRST_ADMIN_PASSWORD).
    """
    from app.database.base import SessionLocal
    from app.models.user import User, UserProfile
    from app.core.security import hash_password
    from app.core.constants import UserRole
    from sqlalchemy import select

    db = SessionLocal()
    try:
        # Check if admin already exists
        existing = db.execute(
            select(User).where(User.email == settings.FIRST_ADMIN_EMAIL)
        ).scalar_one_or_none()

        if existing:
            logger.info(f"Admin user already exists: {settings.FIRST_ADMIN_EMAIL}")
            return

        # Create admin user
        admin = User(
            email=settings.FIRST_ADMIN_EMAIL,
            password_hash=hash_password(settings.FIRST_ADMIN_PASSWORD),
            role=UserRole.ADMIN,
            is_active=True,
            is_email_verified=True,  # Admin doesn't need email verification
        )
        db.add(admin)
        db.flush()

        # Create admin profile
        profile = UserProfile(user_id=admin.user_id, full_name="System Administrator")
        db.add(profile)

        db.commit()
        logger.info(
            f"✅ First admin created: {settings.FIRST_ADMIN_EMAIL}\n"
            f"   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION!"
        )

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create admin user: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs startup code before the server begins accepting requests.
    Runs shutdown code after the server stops.

    The 'yield' separates startup (before) from shutdown (after).
    """
    # STARTUP
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    create_upload_directories()
    create_first_admin()
    logger.info("✅ Application startup complete")

    yield  # <-- Server is running here, handling requests

    # SHUTDOWN
    logger.info("🛑 Application shutting down...")


# ---------------------------------------------------------------
# CREATE FASTAPI APP
# ---------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    description="""
## CampusConnect API

A production-grade college event management platform.

### Features
- 🔐 JWT Authentication with refresh tokens
- 👤 Role-based access control (Admin, Organizer, Participant)
- 🎓 College, Club, and Organizer management
- 📅 Event lifecycle management (Draft → Approved → Published → Completed)
- 📝 Event registration with waitlist support
- 📱 QR code check-in system
- 🏆 Certificate generation and verification
- 🔔 Notification system
- 📊 Analytics dashboard

### Authentication
Use `Bearer <your_access_token>` in the Authorization header.

### Getting Started
1. Register: `POST /api/v1/auth/register`
2. Login: `POST /api/v1/auth/login`
3. Use the `access_token` in the Authorization header
    """,
    version=settings.APP_VERSION,
    docs_url="/docs",          # Swagger UI at /docs
    redoc_url="/redoc",        # ReDoc at /redoc
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ---------------------------------------------------------------
# ATTACH RATE LIMITER
# ---------------------------------------------------------------
# Attach the limiter to the app so slowapi can intercept requests
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# ---------------------------------------------------------------
# MIDDLEWARE (order matters - first added = last to run on request)
# ---------------------------------------------------------------

# 1. Request/Response Logging
app.add_middleware(LoggingMiddleware)

# 2. CORS - Allow frontend to call our API
# CORS = Cross-Origin Resource Sharing
# Without this, browsers block requests from localhost:3000 to localhost:8000
# Added after LoggingMiddleware so it is the outermost middleware.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins_list(), 
    allow_credentials=True,        # Allow cookies/auth headers
    allow_methods=["*"],           # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],           # Allow all headers
)

# ---------------------------------------------------------------
# STATIC FILES (for serving uploaded files)
# ---------------------------------------------------------------
# This serves uploaded files at /static/uploads/...
# In production, use nginx or S3 instead
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="."), name="static")

# ---------------------------------------------------------------
# GLOBAL EXCEPTION HANDLERS
# ---------------------------------------------------------------

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handle HTTP exceptions (404, 403, etc.) with our standard format.
    Without this, FastAPI returns: {"detail": "Not Found"}
    With this, we return: {"success": false, "message": "Not Found", "data": null}
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": str(exc.detail),
            "data": None,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle Pydantic validation errors (422 Unprocessable Entity).

    When request data fails validation (e.g., invalid email format),
    Pydantic raises RequestValidationError.
    We format this nicely for the frontend.

    Example: POST /auth/register with invalid email
    Returns: {"success": false, "message": "Validation error", "data": [{"field": "email", "message": "..."}]}
    """
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"],
        })

    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation error. Please check your request data.",
            "data": errors,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for unexpected errors.
    Logs the error and returns a safe error message.

    In production: log to Sentry/Datadog, never expose internal details.
    """
    logger.error(
        f"Unhandled exception on {request.method} {request.url}: {exc}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An unexpected error occurred. Please try again later.",
            "data": None,
        },
    )


# ---------------------------------------------------------------
# MOUNT API ROUTES
# ---------------------------------------------------------------
# All routes will be under /api/v1/
# Example: /api/v1/auth/login, /api/v1/events, etc.
app.include_router(api_router, prefix="/api/v1")


# ---------------------------------------------------------------
# ROOT ENDPOINT
# ---------------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    """Health check endpoint. Returns app name and version."""
    return {
        "success": True,
        "message": f"Welcome to {settings.APP_NAME} API",
        "data": {
            "version": settings.APP_VERSION,
            "docs": "/docs",
            "redoc": "/redoc",
        },
    }


@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint for deployment monitoring.
    Load balancers ping this to check if the app is running.
    """
    return {
        "success": True,
        "message": "Service is healthy",
        "data": {"status": "ok"},
    }
