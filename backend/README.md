# CampusConnect Backend API

CampusConnect is a production-grade college event management platform built using Python 3.13, FastAPI, SQLAlchemy 2.0, PostgreSQL, and Docker. 

## Features
- **Secure Authentication**: JWT-based auth flow (Login, Register, Logout, token Refresh, Password Reset).
- **Role-Based Access Control (RBAC)**: Distinct permissions for `Admin`, `Organizer`, and `Participant`.
- **Event Lifecycle**: Supports Draft, Pending Approval, Published, Cancelled, and Completed event states.
- **Capacity & Waitlisting**: Automatically handles registration limits, waitlists, and waitlist promotion.
- **QR Attendance Verification**: Generates check-in QR codes, validates check-in, check-out, and prevents duplicate scanning.
- **PDF Certificates**: Auto-generates participation certificates with unique serial numbers and verification QR codes.
- **Analytics & Charts**: Detailed metrics for platforms, events, and monthly timelines.
- **Structured Logging & Rate Limiting**: Production-grade SlowAPI limits, request/response logger, and structured logging.

---

## Technical Stack
- **Framework**: FastAPI (ASGI)
- **Database ORM**: SQLAlchemy 2.0 (Repository pattern, async-capable setup)
- **Database Migrations**: Alembic
- **Validation**: Pydantic v2
- **PDF Generation**: ReportLab
- **QR Generation**: Python qrcode (PIL)
- **Containerization**: Docker & Docker Compose

---

## Directory Structure
```
campusconnect/
├── alembic.ini          # Alembic configuration
├── Dockerfile           # Docker configuration for production
├── docker-compose.yml   # Multi-container orchestrator
├── requirements.txt     # Python dependencies
├── Makefile             # Automation shortcut commands
├── .env.example         # Environment template file
├── docs/                # Design architecture docs (HLD, LLD, diagrams)
└── app/
    ├── api/             # HTTP router layer
    │   └── v1/          # API endpoint routes
    ├── core/            # Config, security, exceptions, and constants
    ├── database/        # Engine creation, db sessions, and dependencies
    ├── middleware/      # Logging, Rate limiting
    ├── models/          # SQLAlchemy model definitions
    ├── repositories/    # Generic and specific CRUD repository classes
    ├── services/        # Business logic, file storage, email sending, PDF, QR
    ├── schemas/         # Pydantic validation request/response models
    ├── utils/           # Pagination, phone validation, filename sanitization
    ├── tests/           # Integration/Unit test suites
    └── main.py          # App bootstrapper
```

---

## Quick Start Setup (Without Docker)

### 1. Prerequisites
- Python 3.13+ installed
- PostgreSQL database running locally

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in details:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` matches your local database settings:
```ini
DATABASE_URL=postgresql://postgres_user:postgres_pass@localhost:5432/campusconnect_db
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run Migrations
```bash
alembic upgrade head
```

### 5. Start Development Server
```bash
uvicorn app.main:app --reload
```
Open **[http://localhost:8000/docs](http://localhost:8000/docs)** to view the Swagger API Documentation.

---

## Running with Docker (Recommended)

### 1. Run DB & App
To start the database and the FastAPI application in the background:
```bash
docker compose up -d db
docker compose --profile migrate up migrate
docker compose up api
```

### 2. Check logs
```bash
docker compose logs -f api
```

### 3. Stop containers
```bash
docker compose down
```

---

## Running Tests
Run all unit and integration tests using pytest:
```bash
pytest app/tests/ -v
```
To run tests with code coverage analysis:
```bash
pytest app/tests/ -v --cov=app --cov-report=html
```
Then open `htmlcov/index.html` in your browser.
