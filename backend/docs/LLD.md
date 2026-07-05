# Low Level Design (LLD) — CampusConnect

## 1. Database Schema (3NF)

```mermaid
erDiagram
    users ||--o| user_profiles : "has profile"
    users ||--o{ event_registrations : "registers"
    users ||--o{ notifications : "receives"
    users ||--o{ certificates : "earns"
    users ||--o{ refresh_tokens : "owns"
    users ||--o{ password_reset_tokens : "owns"
    colleges ||--o{ clubs : "has"
    colleges ||--o{ user_profiles : "enrolled students"
    clubs ||--o{ organizers : "members"
    clubs ||--o{ events : "hosts"
    organizers ||--o{ events : "manages"
    events ||--o{ event_registrations : "has registrations"
    event_registrations ||--o| attendance : "tracks check-in"
    events ||--o{ certificates : "issues"

    users {
        uuid user_id PK
        string email UNIQUE
        string password_hash
        enum role "admin/organizer/participant"
        boolean is_active
        boolean is_email_verified
        timestamp created_at
        timestamp updated_at
        timestamp last_login
    }

    user_profiles {
        uuid profile_id PK
        uuid user_id FK
        uuid college_id FK
        string full_name
        string phone
        enum gender
        string department
        string course
        integer year_of_study
        text bio
        string profile_picture
        timestamp created_at
        timestamp updated_at
    }

    colleges {
        uuid college_id PK
        string college_name UNIQUE
        string city
        string state
        string website
        string logo
        boolean is_verified
        timestamp created_at
    }

    clubs {
        uuid club_id PK
        uuid college_id FK
        string club_name
        text description
        string faculty_incharge
        timestamp created_at
    }

    organizers {
        uuid organizer_id PK
        uuid user_id FK UNIQUE
        uuid club_id FK
        string designation
        json permissions
        timestamp created_at
    }

    events {
        uuid event_id PK
        uuid organizer_id FK
        uuid club_id FK
        string title
        text description
        enum category
        enum event_type
        string venue
        timestamp start_datetime
        timestamp end_datetime
        integer max_participants
        timestamp registration_deadline
        string poster
        enum status "draft/published/cancelled/completed"
        enum approval_status "pending/approved/rejected"
        text rejection_reason
        string qr_code
        timestamp created_at
        timestamp updated_at
    }

    event_registrations {
        uuid registration_id PK
        uuid event_id FK
        uuid user_id FK
        enum registration_status "confirmed/cancelled/waitlisted/attended"
        enum payment_status
        timestamp registered_at
    }

    attendance {
        uuid attendance_id PK
        uuid registration_id FK UNIQUE
        timestamp check_in_time
        timestamp check_out_time
        enum attendance_status "present/absent/partial"
        uuid scanned_by FK
    }

    certificates {
        uuid certificate_id PK
        uuid event_id FK
        uuid user_id FK
        string certificate_number UNIQUE
        string pdf_path
        timestamp generated_at
    }

    notifications {
        uuid notification_id PK
        uuid user_id FK
        string title
        text message
        enum notification_type
        boolean is_read
        timestamp created_at
    }

    password_reset_tokens {
        uuid token_id PK
        uuid user_id FK
        string token UNIQUE
        timestamp expires_at
        boolean used
        timestamp created_at
    }

    refresh_tokens {
        uuid refresh_token_id PK
        uuid user_id FK
        string token UNIQUE
        timestamp expiry
        boolean revoked
        timestamp created_at
    }
```

## 2. Directory Structure
```
app/
├── api/             # HTTP router layer
│   └── v1/          # Version 1 routing modules
├── core/            # Config, security, exceptions, constants
├── database/        # Engine creation, get_db dependency injection
├── middleware/      # Logging, rate limiter, auth middleware
├── models/          # SQLAlchemy 2.0 database tables
├── repositories/    # Direct database interaction queries
├── services/        # Business logic, mail, PDF generation, security
├── schemas/         # Pydantic v2 validation models
├── utils/           # Time, string, phone helpers
├── tests/           # Integration & unit test files
└── main.py          # App initialization & middleware assembly
```
