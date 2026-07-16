CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='userrole') THEN
        CREATE TYPE userrole AS ENUM
        ('ADMIN','ORGANIZER','PARTICIPANT');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='gender') THEN
        CREATE TYPE gender AS ENUM
        ('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='eventcategory') THEN
        CREATE TYPE eventcategory AS ENUM
        (
        'TECHNICAL',
        'CULTURAL',
        'SPORTS',
        'ACADEMIC',
        'WORKSHOP',
        'SEMINAR',
        'HACKATHON',
        'COMPETITION',
        'OTHER'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='eventtype') THEN
        CREATE TYPE eventtype AS ENUM
        ('ONLINE','OFFLINE','HYBRID');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='eventstatus') THEN
        CREATE TYPE eventstatus AS ENUM
        (
        'DRAFT',
        'PUBLISHED',
        'UPCOMING',
        'COMPLETED',
        'CANCELLED'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='approvalstatus') THEN
        CREATE TYPE approvalstatus AS ENUM
        ('PENDING','APPROVED','REJECTED');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='participationtype') THEN
        CREATE TYPE participationtype AS ENUM
        ('INDIVIDUAL','TEAM','BOTH');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='registrationstatus') THEN
        CREATE TYPE registrationstatus AS ENUM
        (
        'CONFIRMED',
        'WAITLISTED',
        'ATTENDED',
        'CANCELLED'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='paymentstatus') THEN
        CREATE TYPE paymentstatus AS ENUM
        (
        'FREE',
        'PENDING',
        'COMPLETED',
        'FAILED',
        'REFUNDED'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='attendancestatus') THEN
        CREATE TYPE attendancestatus AS ENUM
        ('PRESENT','ABSENT','PARTIAL');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='attendancemethod') THEN
        CREATE TYPE attendancemethod AS ENUM
        ('QR','MANUAL');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='notificationtype') THEN
        CREATE TYPE notificationtype AS ENUM
        (
        'EVENT',
        'REGISTRATION',
        'CERTIFICATE',
        'SYSTEM',
        'REMINDER'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='certificatetype') THEN
        CREATE TYPE certificatetype AS ENUM
        (
        'PARTICIPATION',
        'WINNER',
        'RUNNER_UP',
        'VOLUNTEER'
        );
    END IF;
END$$;
-- ----------------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS colleges(
    college_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_name VARCHAR(255) NOT NULL UNIQUE,
    city VARCHAR(100),
    state VARCHAR(100),
    website VARCHAR(500),
    logo VARCHAR(500),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_college_name
ON colleges(college_name);


CREATE TABLE IF NOT EXISTS users(
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role userrole NOT NULL DEFAULT 'PARTICIPANT',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_code VARCHAR(6),
    verification_code_expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
ON users(email);

CREATE TABLE IF NOT EXISTS user_profiles(
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    college_id UUID,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    gender gender,
    department VARCHAR(255),
    course VARCHAR(255),
    year_of_study INTEGER
    CHECK(year_of_study BETWEEN 1 AND 6),
    bio TEXT,
    profile_picture VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_profile_user
    FOREIGN KEY(user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE,

    CONSTRAINT fk_profile_college
    FOREIGN KEY(college_id)
    REFERENCES colleges(college_id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_profile_user
ON user_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_profile_college
ON user_profiles(college_id);

CREATE TABLE IF NOT EXISTS event_categories(
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens(
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reset_user
    FOREIGN KEY(user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reset_user
ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS refresh_tokens(
    refresh_token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expiry TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_user
    FOREIGN KEY(user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_user
ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS events(
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL,
    category_id UUID,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    category eventcategory NOT NULL,
    event_type eventtype NOT NULL,
    participation_type participationtype NOT NULL DEFAULT 'INDIVIDUAL',
    venue VARCHAR(500),
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    registration_deadline TIMESTAMP,
    max_participants INTEGER
        CHECK (max_participants > 0),
    registration_fee NUMERIC(10,2)
        DEFAULT 0.00
        CHECK (registration_fee >= 0),
    poster_url VARCHAR(500),
    rulebook_url VARCHAR(500),
    schedule_url VARCHAR(500),
    qr_code_url VARCHAR(500),
    status eventstatus NOT NULL DEFAULT 'DRAFT',
    approval_status approvalstatus NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_event_time
        CHECK (end_datetime > start_datetime),

    CONSTRAINT fk_event_organizer
        FOREIGN KEY (organizer_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_category
        FOREIGN KEY (category_id)
        REFERENCES event_categories(category_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_events_title
ON events(title);

CREATE INDEX IF NOT EXISTS idx_events_status
ON events(status);

CREATE INDEX IF NOT EXISTS idx_events_organizer
ON events(organizer_id);

CREATE INDEX IF NOT EXISTS idx_events_category
ON events(category_id);

CREATE TABLE IF NOT EXISTS organizers(
    organizer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    designation VARCHAR(255),
    permissions JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_organizer_user
        FOREIGN KEY(user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_organizer_user
ON organizers(user_id);

CREATE TABLE IF NOT EXISTS teams(
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    leader_id UUID NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_team_name
        UNIQUE(event_id, team_name),

    CONSTRAINT fk_team_event
        FOREIGN KEY(event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_team_leader
        FOREIGN KEY(leader_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_team_event
ON teams(event_id);

CREATE INDEX IF NOT EXISTS idx_team_leader
ON teams(leader_id);

CREATE TABLE IF NOT EXISTS team_members(
    team_member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    participant_id UUID NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_team_member
        UNIQUE(team_id, participant_id),

    CONSTRAINT fk_member_team
        FOREIGN KEY(team_id)
        REFERENCES teams(team_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_member_user
        FOREIGN KEY(participant_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_team_members_team
ON team_members(team_id);

CREATE INDEX IF NOT EXISTS idx_team_members_user
ON team_members(participant_id);


CREATE TABLE IF NOT EXISTS registrations(
    registration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    participant_id UUID NOT NULL,
    team_id UUID,
    registration_status registrationstatus
        NOT NULL DEFAULT 'CONFIRMED',
    payment_status paymentstatus
        NOT NULL DEFAULT 'PENDING',
    qr_code VARCHAR(500),
    registered_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_registration
        UNIQUE(event_id, participant_id),

    CONSTRAINT fk_registration_event
        FOREIGN KEY(event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_registration_user
        FOREIGN KEY(participant_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_registration_team
        FOREIGN KEY(team_id)
        REFERENCES teams(team_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_registration_event
ON registrations(event_id);

CREATE INDEX IF NOT EXISTS idx_registration_user
ON registrations(participant_id);

CREATE INDEX IF NOT EXISTS idx_registration_team
ON registrations(team_id);

CREATE TABLE IF NOT EXISTS attendance(
    attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    event_id UUID NOT NULL,
    attendance_status attendancestatus
        NOT NULL DEFAULT 'ABSENT',
    attendance_method attendancemethod
        NOT NULL DEFAULT 'QR',
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    scanned_by UUID,
    CONSTRAINT chk_checkout
        CHECK
        (
            check_out_time IS NULL
            OR
            check_out_time >= check_in_time
        ),

    CONSTRAINT fk_attendance_registration
        FOREIGN KEY(registration_id)
        REFERENCES registrations(registration_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_user
        FOREIGN KEY(user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_event
        FOREIGN KEY(event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_attendance_scanned
        FOREIGN KEY(scanned_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_user
ON attendance(user_id);

CREATE INDEX IF NOT EXISTS idx_attendance_event
ON attendance(event_id);

CREATE INDEX IF NOT EXISTS idx_attendance_status
ON attendance(attendance_status);

CREATE TABLE IF NOT EXISTS payments(
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    registration_id UUID NOT NULL UNIQUE,
    amount NUMERIC(10,2)
        NOT NULL
        CHECK (amount >= 0),
    payment_gateway VARCHAR(100),
    payment_method VARCHAR(100),
    transaction_id VARCHAR(255) UNIQUE,
    payment_status paymentstatus
        NOT NULL DEFAULT 'PENDING',
    payment_date TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_event
        FOREIGN KEY(event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payment_registration
        FOREIGN KEY(registration_id)
        REFERENCES registrations(registration_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_event
ON payments(event_id);

CREATE INDEX IF NOT EXISTS idx_payment_status
ON payments(payment_status);

CREATE TABLE IF NOT EXISTS certificates(
    certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    registration_id UUID NOT NULL,
    participant_id UUID NOT NULL,
    certificate_number VARCHAR(100)
        NOT NULL UNIQUE,
    certificate_type certificatetype
        NOT NULL DEFAULT 'PARTICIPATION',
    certificate_url VARCHAR(500),
    generated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    issue_date TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_certificate_event
        FOREIGN KEY(event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_certificate_registration
        FOREIGN KEY(registration_id)
        REFERENCES registrations(registration_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_certificate_user
        FOREIGN KEY(participant_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_certificate_event
ON certificates(event_id);

CREATE INDEX IF NOT EXISTS idx_certificate_user
ON certificates(participant_id);

CREATE TABLE IF NOT EXISTS results(
    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    participant_id UUID,
    team_id UUID,
    rank INTEGER
        CHECK(rank > 0),
    score NUMERIC(10,2)
        CHECK(score >= 0),
    remarks TEXT,
    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_result_owner
    CHECK
    (
        participant_id IS NOT NULL
        OR
        team_id IS NOT NULL
    ),

    CONSTRAINT fk_result_event
        FOREIGN KEY(event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_result_user
        FOREIGN KEY(participant_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_result_team
        FOREIGN KEY(team_id)
        REFERENCES teams(team_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_result_event
ON results(event_id);

CREATE INDEX IF NOT EXISTS idx_result_rank
ON results(rank);

CREATE TABLE IF NOT EXISTS feedback(
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    participant_id UUID NOT NULL,
    rating INTEGER
        NOT NULL
        CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_feedback
        UNIQUE(event_id, participant_id),

    CONSTRAINT fk_feedback_event
        FOREIGN KEY(event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_feedback_user
        FOREIGN KEY(participant_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feedback_event
ON feedback(event_id);

CREATE TABLE IF NOT EXISTS notifications(
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title VARCHAR(255)
        NOT NULL,
    message TEXT
        NOT NULL,
    notification_type notificationtype
        NOT NULL,
    is_read BOOLEAN
        NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY(user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_user
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_read
ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_notification_created
ON notifications(created_at);

