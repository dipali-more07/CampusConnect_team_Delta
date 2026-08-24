# Low Level Design (LLD) — CampusConnect Enterprise

## 1. Database Schema (3NF Relational Model)

```mermaid
erDiagram
    users ||--o| user_profiles : "has profile"
    users ||--o{ event_registrations : "registers"
    users ||--o{ certificates : "earns"
    users ||--o{ notifications : "receives"
    clubs ||--o{ organizers : "members"
    clubs ||--o{ events : "hosts"
    organizers ||--o{ events : "manages"
    events ||--o{ event_registrations : "has registrations"
    event_registrations ||--o| attendance : "tracks check-in"
    events ||--o{ certificates : "issues"

    users {
        uuid id PK
        string email UK
        string password_hash
        enum role "admin | organizer | student"
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    user_profiles {
        uuid id PK
        uuid user_id FK
        string full_name
        string phone
        string department
        string course
        integer year_of_study
        integer merit_points
        string badge_tier
        timestamp created_at
    }

    events {
        uuid id PK
        uuid organizer_id FK
        uuid club_id FK
        string title
        text description
        string category
        string venue
        timestamp start_datetime
        timestamp end_datetime
        integer max_capacity
        decimal entry_fee
        enum status "DRAFT | PUBLISHED | COMPLETED | CANCELLED"
        timestamp created_at
    }

    event_registrations {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        string pass_code UK
        enum status "CONFIRMED | WAITLISTED | CANCELLED"
        timestamp registered_at
    }

    attendance {
        uuid id PK
        uuid registration_id FK UK
        enum status "PRESENT | ABSENT"
        timestamp check_in_time
        uuid scanned_by FK
    }

    certificates {
        uuid id PK
        uuid event_id FK
        uuid user_id FK
        string certificate_number UK
        string cert_type "PARTICIPATION | MERIT | EXCELLENCE"
        string pdf_path
        timestamp generated_at
    }
```

## 2. Directory Architecture & Layer Mapping
```
app/
├── api/v1/          # Controller / Router Layer (HTTP status, schema validation)
│   ├── auth.py
│   ├── events.py
│   ├── registrations.py
│   ├── attendance.py
│   ├── certificates.py
│   ├── analytics.py
│   └── ai.py
├── core/            # Config, Security, JWT utilities, Constants
├── database/        # Sessionmaker & get_db Dependency Injection
├── models/          # SQLAlchemy 2.0 ORM Entity Classes
├── repositories/    # Parameterized DB Access & Query logic
├── services/        # Domain Business Logic, AI Fallbacks, PDF generation
├── schemas/         # Pydantic v2 Request / Response validation DTOs
└── main.py          # Application Assembly & CORS Middleware
```

## 3. Design Patterns Implemented
1. **Dependency Injection (DI):** Injected DB sessions (`get_db`) and user security context (`require_role`) into endpoints.
2. **Chain of Responsibility:** 3-tier fallback execution in AI service (Gemini $\rightarrow$ Groq $\rightarrow$ Native RAG).
3. **Factory Pattern:** Dynamic generation of certificate templates (Participation, Merit, Excellence).
4. **Singleton Pattern:** Global configuration object (`Settings`) and connection engine initialization.
