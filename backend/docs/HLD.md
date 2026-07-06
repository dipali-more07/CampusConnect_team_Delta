# High Level Design (HLD) — CampusConnect

## 1. Introduction
CampusConnect is a college event management platform that connects students, organizers, clubs, and administrators. It facilitates discovering events, managing registrations, tracking attendance using QR codes, generating and verifying certificates, and dashboard analytics.

## 2. System Architecture
CampusConnect follows a **Layered Clean Architecture** combined with the **Repository Pattern** to keep the business logic separated from database concerns and route presentation.

```
+-----------------------------------------------------------+
|                       Client App                          |
|                     (Next.js / React)                     |
+-----------------------------+-----------------------------+
                              | HTTP (REST)
                              v
+-----------------------------+-----------------------------+
|                     FastAPI Router Layer                  |
|                 (api/v1/ - Request validation)            |
+-----------------------------+-----------------------------+
                              |
                              v
+-----------------------------+-----------------------------+
|                        Service Layer                      |
|                 (Business logic & Transactions)           |
+-----------------------------+-----------------------------+
                              |
                              v
+-----------------------------+-----------------------------+
|                      Repository Layer                     |
|                 (Data Access & SQL Generation)            |
+-----------------------------+-----------------------------+
                              |
                              v
+-----------------------------+-----------------------------+
|                         Database                          |
|                       (PostgreSQL)                        |
+-----------------------------------------------------------+
```

### Key Modules
- **Authentication**: RBAC with JWT (Access + Refresh tokens).
- **Colleges/Clubs/Organizers**: Entity registry management.
- **Events**: Draft, Review, Approval, Publication, and Event Search.
- **Registrations**: Event signups, duplicate check, and waitlist.
- **Attendance**: Check-in and check-out via unique QR codes.
- **Certificates**: reportlab-generated PDF certificates with embedded QR codes for verification.
- **Notifications**: Transactional and in-app system notifications.
- **Analytics**: Statistics for platforms, events, and monthly charts.

## 3. Technology Stack Choice
- **FastAPI**: Exceptionally fast Python web framework based on ASGI. Supports OpenAPI auto-generation.
- **SQLAlchemy 2.0**: The most robust Python ORM, configured for Clean transactions.
- **Alembic**: Database migration tool to track structural changes.
- **PostgreSQL**: Highly scalable, stable relational database.
- **Docker / Gunicorn**: Industry standard for containerized production deployments.
