

CREATE TYPE user_role AS ENUM ('student','organizer','admin');
CREATE TYPE event_status_enum AS ENUM ('draft','published','ongoing','completed','cancelled');
CREATE TYPE event_type_enum AS ENUM ('competition','workshop','seminar','hackathon','cultural','sports');
CREATE TYPE registration_status_enum AS ENUM ('pending','confirmed','cancelled');
CREATE TYPE attendance_status_enum AS ENUM ('present','absent');
CREATE TYPE attendance_method_enum AS ENUM ('qr','manual');
CREATE TYPE payment_status_enum AS ENUM ('pending','success','failed');
CREATE TYPE payment_method_enum AS ENUM ('upi','card','netbanking','cash');
CREATE TYPE certificate_type_enum AS ENUM ('participation','winner','runner-up');

CREATE TABLE users(
 user_id SERIAL PRIMARY KEY,
 full_name VARCHAR(100) NOT NULL,
 email VARCHAR(255) UNIQUE NOT NULL,
 mobile VARCHAR(20) UNIQUE,
 password_hash TEXT NOT NULL,
 role user_role NOT NULL DEFAULT 'student',
 college_name VARCHAR(255),
 department VARCHAR(100),
 course VARCHAR(100),
 profile_image TEXT,
 gender VARCHAR(20),
 verification_code VARCHAR(10),
 verification_code_expires_at TIMESTAMP,
 is_verified BOOLEAN DEFAULT FALSE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clubs(
 club_id SERIAL PRIMARY KEY,
 club_name VARCHAR(150) UNIQUE NOT NULL,
 description TEXT,
 faculty_name VARCHAR(150),
 logo_url TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_categories(
 category_id SERIAL PRIMARY KEY,
 category_name VARCHAR(100) UNIQUE NOT NULL,
 description TEXT,
 icon_url TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events(
 event_id SERIAL PRIMARY KEY,
 category_id INT REFERENCES event_categories(category_id) ON DELETE SET NULL,
 organizer_id INT REFERENCES users(user_id) ON DELETE SET NULL,
 club_id INT REFERENCES clubs(club_id) ON DELETE SET NULL,
 title VARCHAR(255) NOT NULL,
 description TEXT,
 venue VARCHAR(255),
 event_date DATE,
 start_time TIME,
 end_time TIME,
 capacity INT CHECK(capacity>0),
 registration_fee NUMERIC(10,2) DEFAULT 0 CHECK(registration_fee>=0),
 registration_deadline TIMESTAMP,
 qr_code TEXT,
 poster_url TEXT,
 schedule_url TEXT,
 event_type event_type_enum,
 status event_status_enum DEFAULT 'draft',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications(
 notification_id SERIAL PRIMARY KEY,
 user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
 title VARCHAR(255),
 message TEXT,
 is_read BOOLEAN DEFAULT FALSE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE registrations(
 registration_id SERIAL PRIMARY KEY,
 participant_id INT REFERENCES users(user_id) ON DELETE CASCADE,
 event_id INT REFERENCES events(event_id) ON DELETE CASCADE,
 registration_type VARCHAR(20),
 qr_code TEXT,
 registration_status registration_status_enum DEFAULT 'pending',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(participant_id,event_id)
);

CREATE TABLE teams(
 team_id SERIAL PRIMARY KEY,
 event_id INT REFERENCES events(event_id) ON DELETE CASCADE,
 team_name VARCHAR(100) NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_members(
 team_member_id SERIAL PRIMARY KEY,
 team_id INT REFERENCES teams(team_id) ON DELETE CASCADE,
 participant_id INT REFERENCES users(user_id) ON DELETE CASCADE,
 UNIQUE(team_id,participant_id)
);

CREATE TABLE results(
 result_id SERIAL PRIMARY KEY,
 event_id INT REFERENCES events(event_id) ON DELETE CASCADE,
 participant_id INT REFERENCES users(user_id) ON DELETE CASCADE,
 team_id INT REFERENCES teams(team_id) ON DELETE SET NULL,
 rank INT,
 score NUMERIC(10,2),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance(
 attendance_id SERIAL PRIMARY KEY,
 registration_id INT REFERENCES registrations(registration_id) ON DELETE CASCADE,
 event_id INT REFERENCES events(event_id) ON DELETE CASCADE,
 user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
 attendance_status attendance_status_enum,
 check_in_time TIMESTAMP,
 check_out_time TIMESTAMP,
 scanned_by INT REFERENCES users(user_id) ON DELETE SET NULL,
 attendance_method attendance_method_enum,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments(
 payment_id SERIAL PRIMARY KEY,
 registration_id INT REFERENCES registrations(registration_id) ON DELETE CASCADE,
 event_id INT REFERENCES events(event_id) ON DELETE CASCADE,
 amount NUMERIC(10,2) NOT NULL CHECK(amount>=0),
 payment_gateway VARCHAR(100),
 payment_method payment_method_enum,
 transaction_id VARCHAR(255) UNIQUE,
 payment_status payment_status_enum,
 payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE certificates(
 certificate_id SERIAL PRIMARY KEY,
 event_id INT REFERENCES events(event_id) ON DELETE CASCADE,
 registration_id INT REFERENCES registrations(registration_id) ON DELETE CASCADE,
 participant_id INT REFERENCES users(user_id) ON DELETE CASCADE,
 certificate_type certificate_type_enum,
 certificate_url TEXT,
 issued_date DATE
);

CREATE TABLE feedback(
 feedback_id SERIAL PRIMARY KEY,
 event_id INT REFERENCES events(event_id) ON DELETE CASCADE,
 participant_id INT REFERENCES users(user_id) ON DELETE CASCADE,
 rating INT CHECK(rating BETWEEN 1 AND 5),
 review TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(event_id,participant_id)
);

CREATE TABLE event_analytics(
 analytics_id SERIAL PRIMARY KEY,
 event_id INT UNIQUE REFERENCES events(event_id) ON DELETE CASCADE,
 total_registrations INT DEFAULT 0,
 confirmed_registrations INT DEFAULT 0,
 cancelled_registrations INT DEFAULT 0,
 total_checkins INT DEFAULT 0,
 attendance_rate NUMERIC(5,2) DEFAULT 0 CHECK(attendance_rate BETWEEN 0 AND 100),
 total_revenue NUMERIC(12,2) DEFAULT 0,
 total_payments INT DEFAULT 0,
 total_teams INT DEFAULT 0,
 total_feedbacks INT DEFAULT 0,
 avg_rating NUMERIC(3,2) DEFAULT 0,
 certificates_issued INT DEFAULT 0,
 last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE platform_analytics(
 platform_analytics_id SERIAL PRIMARY KEY,
 date DATE UNIQUE NOT NULL,
 new_users INT DEFAULT 0,
 active_users INT DEFAULT 0,
 events_created INT DEFAULT 0,
 events_completed INT DEFAULT 0,
 total_registrations INT DEFAULT 0,
 total_payments INT DEFAULT 0,
 total_revenue NUMERIC(12,2) DEFAULT 0,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_reg_event ON registrations(event_id);
CREATE INDEX idx_reg_user ON registrations(participant_id);
CREATE INDEX idx_attendance_event ON attendance(event_id);
CREATE INDEX idx_payment_reg ON payments(registration_id);
CREATE INDEX idx_feedback_event ON feedback(event_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
 NEW.updated_at=CURRENT_TIMESTAMP;
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_events BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clubs BEFORE UPDATE ON clubs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_categories BEFORE UPDATE ON event_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_teams BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION set_updated_at();
