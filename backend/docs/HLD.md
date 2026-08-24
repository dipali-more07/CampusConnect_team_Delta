# High Level Design (HLD) — CampusConnect Enterprise

## 1. Introduction
**CampusConnect** is an enterprise-grade Academic & Campus Event Operations System that unifies event discovery, digital registrations, venue attendance tracking, automated certificate issuance, and multilingual AI assistant capabilities for universities and colleges.

## 2. System Architecture
CampusConnect follows a **Layered Clean Architecture** combined with the **Service-Repository Pattern** to keep the business logic isolated from database persistence and HTTP presentation layers.

```
┌───────────────────────────────────────────────────────────┐
│                    Client Application                     │
│               (Web Portal / Mobile Browser)               │
└─────────────────────────────┬─────────────────────────────┘
                              │ HTTPS / REST (JSON)
                              ▼
┌───────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                    │
│            (SSL Termination + Security Headers)           │
└─────────────────────────────┬─────────────────────────────┘
                              │ Reverse Proxy :5000
                              ▼
┌───────────────────────────────────────────────────────────┐
│                    FastAPI Router Layer                   │
│              (api/v1/ - Pydantic Validation & RBAC)       │
└─────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────┐
│                        Service Layer                      │
│     (Business Logic, AI Fallbacks, PDF Engine, Mail)      │
└─────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────┐
│                Repository / ORM Layer                     │
│          (SQLAlchemy 2.0 - Parameterized Queries)         │
└─────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────┐
│                      Database Layer                       │
│                       (PostgreSQL 15)                     │
└───────────────────────────────────────────────────────────┘
```

### 3. Key Core Modules
- **Authentication & RBAC:** Stateless JWT tokens (Access/Refresh) with Bcrypt 12-round password hashing.
- **Event Lifecycle Engine:** Draft, Publishing, Seating Limits, Venue Scheduling, and Completion state machine.
- **Registration & Ticketing:** 1-Click signup, duplicate registration prevention, and digital entry pass codes.
- **Venue Attendance Tracking:** Live attendee check-in with organizer authentication and proxy prevention.
- **Certificate Issuance Engine:** ReportLab-powered automated vector PDF generation with dynamic participant data.
- **Camy AI Autonomous Assistant:** 3-tier fallback LLM engine (Gemini Flash $\rightarrow$ Groq Llama 3.3 $\rightarrow$ Native Offline RAG) with multilingual voice synthesis.
- **Gamification & Engagement:** Point-based merit progression (Bronze, Silver, Gold Champion tiers).
- **Institutional Analytics:** Real-time KPI summaries, event registration charts, and department participation distribution.

## 4. Technology Stack Justification
- **FastAPI (Python 3.11):** High-throughput ASGI framework with native asynchronous execution.
- **PostgreSQL 15:** Enterprise ACID-compliant relational data store.
- **SQLAlchemy 2.0:** Modern declarative ORM offering complete SQL injection protection.
- **Docker Compose:** Containerized orchestration ensuring zero environmental drift across environments.
- **ReportLab:** Direct vector PDF generation with coordinate accuracy.
