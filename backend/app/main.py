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
from fastapi.responses import JSONResponse, HTMLResponse
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
cors_args = {
    "allow_credentials": True,        # Allow cookies/auth headers
    "allow_methods": ["*"],           # Allow all HTTP methods (GET, POST, etc.)
    "allow_headers": ["*"],           # Allow all headers
}

allowed_origins = settings.get_allowed_origins_list()

if settings.DEBUG or "*" in allowed_origins:
    cors_args["allow_origin_regex"] = r"https?://.*"
else:
    cors_args["allow_origins"] = allowed_origins

app.add_middleware(CORSMiddleware, **cors_args)

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


@app.get("/reset-password", response_class=HTMLResponse, tags=["Authentication"])
def reset_password_page(token: str = ""):
    """
    Renders a beautiful, responsive HTML page to reset account password.
    """
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password | CampusConnect</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #0f172a;
            --card-bg: rgba(30, 41, 59, 0.7);
            --border-color: rgba(255, 255, 255, 0.1);
            --accent-primary: #6366f1;
            --accent-secondary: #a855f7;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --error: #ef4444;
            --success: #10b981;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Outfit', sans-serif;
        }

        body {
            background: radial-gradient(circle at top right, #1e1b4b, var(--bg-dark));
            color: var(--text-main);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow-x: hidden;
        }

        .container {
            width: 100%;
            max-width: 440px;
            background: var(--card-bg);
            backdrop-filter: blur(16px);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
            position: relative;
            animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .logo {
            font-size: 28px;
            font-weight: 700;
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }

        .subtitle {
            color: var(--text-muted);
            font-size: 15px;
            margin-bottom: 32px;
        }

        .form-group {
            text-align: left;
            margin-bottom: 24px;
        }

        .form-group label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 8px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .form-group input {
            width: 100%;
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 14px 16px;
            color: var(--text-main);
            font-size: 15px;
            outline: none;
            transition: all 0.3s ease;
        }

        .form-group input:focus {
            border-color: var(--accent-primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
            background: rgba(15, 23, 42, 0.8);
        }

        .btn-submit {
            width: 100%;
            background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
            color: white;
            border: none;
            border-radius: 12px;
            padding: 14px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            margin-top: 8px;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
        }

        .btn-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
            box-shadow: none !important;
        }

        .feedback-message {
            margin-top: 16px;
            padding: 12px;
            border-radius: 10px;
            font-size: 14px;
            display: none;
            animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .feedback-error {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid var(--error);
            color: #fca5a5;
            display: block;
        }

        .success-screen {
            display: none;
            animation: fadeIn 0.5s ease forwards;
        }

        .success-icon {
            width: 72px;
            height: 72px;
            background: rgba(16, 185, 129, 0.1);
            border: 2px solid var(--success);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            color: var(--success);
            font-size: 32px;
        }

        .success-screen h2 {
            font-size: 24px;
            margin-bottom: 12px;
        }

        .success-screen p {
            color: var(--text-muted);
            font-size: 15px;
            line-height: 1.6;
        }

        .password-requirements {
            margin-top: 10px;
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 12px 16px;
            font-size: 13px;
            color: var(--text-muted);
        }

        .requirement-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
            transition: color 0.3s ease;
        }

        .requirement-item:last-child {
            margin-bottom: 0;
        }

        .requirement-item .icon {
            font-size: 11px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 1.5px solid var(--text-muted);
            transition: all 0.3s ease;
        }

        .requirement-item.valid {
            color: var(--success);
        }

        .requirement-item.valid .icon {
            border-color: var(--success);
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .requirement-item.invalid {
            color: var(--error);
        }

        .requirement-item.invalid .icon {
            border-color: var(--error);
            background: rgba(239, 68, 68, 0.1);
            color: var(--error);
        }
    </style>
</head>
<body>
    <div class="container" id="cardContainer">
        <!-- Input Form Screen -->
        <div id="formScreen">
            <div class="logo">CampusConnect</div>
            <div class="subtitle">Set your new account password</div>
            
            <form id="resetForm" onsubmit="handleSubmit(event)">
                <div class="form-group">
                    <label for="password">New Password</label>
                    <input type="password" id="password" required minlength="8" placeholder="••••••••">
                    <div class="password-requirements" id="passwordRequirements">
                        <div class="requirement-item" id="reqLength">
                            <span class="icon">○</span> At least 8 characters
                        </div>
                        <div class="requirement-item" id="reqUpper">
                            <span class="icon">○</span> At least one uppercase letter (A-Z)
                        </div>
                        <div class="requirement-item" id="reqLower">
                            <span class="icon">○</span> At least one lowercase letter (a-z)
                        </div>
                        <div class="requirement-item" id="reqNumber">
                            <span class="icon">○</span> At least one number (0-9)
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password</label>
                    <input type="password" id="confirmPassword" required minlength="8" placeholder="••••••••">
                    <div class="requirement-item" id="reqMatch" style="margin-top: 10px; display: none;">
                        <span class="icon">○</span> Passwords match
                    </div>
                </div>

                <div id="errorMessage" class="feedback-message"></div>
                
                <button type="submit" class="btn-submit" id="submitBtn">Reset Password</button>
            </form>
        </div>

        <!-- Success Screen -->
        <div id="successScreen" class="success-screen">
            <div class="success-icon">✓</div>
            <h2>Password Updated</h2>
            <p>Your password has been reset successfully. You can now close this tab and log in to the CampusConnect app with your new credentials.</p>
        </div>
    </div>

    <script>
        // Extract token from query params
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const reqLength = document.getElementById('reqLength');
        const reqUpper = document.getElementById('reqUpper');
        const reqLower = document.getElementById('reqLower');
        const reqNumber = document.getElementById('reqNumber');
        const reqMatch = document.getElementById('reqMatch');
        const submitBtn = document.getElementById('submitBtn');

        if (!token) {
            showError("Invalid or missing password reset token. Please check the link in your email.");
            submitBtn.disabled = true;
        }

        function showError(msg) {
            const errDiv = document.getElementById('errorMessage');
            errDiv.innerText = msg;
            errDiv.className = "feedback-message feedback-error";
        }

        function updateRequirement(element, isValid) {
            if (isValid) {
                element.classList.remove('invalid');
                element.classList.add('valid');
                element.querySelector('.icon').innerText = '✓';
            } else {
                element.classList.remove('valid');
                element.classList.remove('invalid');
                element.querySelector('.icon').innerText = '○';
            }
        }

        function validatePassword() {
            const val = passwordInput.value;
            
            const hasLength = val.length >= 8;
            const hasUpper = /[A-Z]/.test(val);
            const hasLower = /[a-z]/.test(val);
            const hasNumber = /\d/.test(val);

            updateRequirement(reqLength, hasLength);
            updateRequirement(reqUpper, hasUpper);
            updateRequirement(reqLower, hasLower);
            updateRequirement(reqNumber, hasNumber);

            const isAllValid = hasLength && hasUpper && hasLower && hasNumber;

            const confirmVal = confirmPasswordInput.value;
            if (confirmVal.length > 0) {
                reqMatch.style.display = 'flex';
                const isMatch = val === confirmVal;
                if (isMatch) {
                    reqMatch.classList.remove('invalid');
                    reqMatch.classList.add('valid');
                    reqMatch.querySelector('.icon').innerText = '✓';
                } else {
                    reqMatch.classList.remove('valid');
                    reqMatch.classList.add('invalid');
                    reqMatch.querySelector('.icon').innerText = '✗';
                }
            } else {
                reqMatch.style.display = 'none';
            }

            // Disable submit if invalid or token is missing
            if (token) {
                submitBtn.disabled = !isAllValid || (confirmVal.length > 0 && val !== confirmVal);
            }
        }

        // Initialize state
        if (token) {
            submitBtn.disabled = true;
        }
        passwordInput.addEventListener('input', validatePassword);
        confirmPasswordInput.addEventListener('input', validatePassword);

        async function handleSubmit(event) {
            event.preventDefault();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const errDiv = document.getElementById('errorMessage');

            // Reset UI
            errDiv.style.display = 'none';

            if (password !== confirmPassword) {
                showError("Passwords do not match.");
                return;
            }

            // Lock submit button
            submitBtn.disabled = true;
            submitBtn.innerText = "Updating...";

            try {
                const response = await fetch('/api/v1/auth/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        token: token,
                        new_password: password,
                        confirm_password: confirmPassword
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Show success screen
                    document.getElementById('formScreen').style.display = 'none';
                    document.getElementById('successScreen').style.display = 'block';
                } else {
                    let errMsg = data.message || "Failed to reset password. The link may have expired.";
                    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
                        const detailMsgs = data.data.map(err => err.message).join(". ");
                        errMsg = `${data.message} Detail: ${detailMsgs}`;
                    }
                    showError(errMsg);
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Reset Password";
                }
            } catch (err) {
                showError("An error occurred. Please check your internet connection.");
                submitBtn.disabled = false;
                submitBtn.innerText = "Reset Password";
            }
        }
    </script>
</body>
</html>"""
    return HTMLResponse(content=html_content)


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
