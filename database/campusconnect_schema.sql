
-- =====================================================
-- CampusConnect Database Schema (PostgreSQL DDL)
-- =====================================================

CREATE TYPE registrationstatus AS ENUM ('CONFIRMED', 'CANCELLED', 'WAITLISTED', 'ATTENDED');

CREATE TYPE paymentstatus AS ENUM ('FREE', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

CREATE TYPE notificationtype AS ENUM ('EVENT', 'REGISTRATION', 'CERTIFICATE', 'SYSTEM', 'REMINDER');

CREATE TYPE userrole AS ENUM ('ADMIN', 'ORGANIZER', 'PARTICIPANT');

CREATE TYPE gender AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

CREATE TYPE eventcategory AS ENUM ('TECHNICAL', 'CULTURAL', 'SPORTS', 'ACADEMIC', 'WORKSHOP', 'SEMINAR', 'HACKATHON', 'COMPETITION', 'OTHER');

CREATE TYPE eventtype AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');

CREATE TYPE eventstatus AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED', 'UPCOMING');

CREATE TYPE approvalstatus AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TYPE participationtype AS ENUM ('TEAM', 'INDIVIDUAL', 'BOTH');

CREATE TYPE attendancestatus AS ENUM ('PRESENT', 'ABSENT', 'PARTIAL');


CREATE TABLE colleges (
	college_id UUID NOT NULL, 
	college_name VARCHAR(255) NOT NULL, 
	city VARCHAR(100), 
	state VARCHAR(100), 
	website VARCHAR(500), 
	logo VARCHAR(500), 
	is_verified BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (college_id), 
	UNIQUE (college_name)
);

CREATE INDEX ix_colleges_college_id ON colleges (college_id);


CREATE TABLE users (
	user_id UUID NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	role userrole NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	is_email_verified BOOLEAN NOT NULL, 
	verification_code VARCHAR(6), 
	verification_code_expires_at TIMESTAMP WITHOUT TIME ZONE, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	last_login TIMESTAMP WITHOUT TIME ZONE, 
	full_name VARCHAR(255), 
	mobile VARCHAR(20), 
	college_name VARCHAR(255), 
	department VARCHAR(255), 
	course VARCHAR(255), 
	profile_image VARCHAR(500), 
	gender VARCHAR(50), 
	PRIMARY KEY (user_id)
);

CREATE INDEX ix_users_user_id ON users (user_id);

CREATE UNIQUE INDEX ix_users_email ON users (email);


CREATE TABLE event_categories (
	category_id UUID NOT NULL, 
	category_name VARCHAR(255) NOT NULL, 
	description TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (category_id)
);

CREATE INDEX ix_event_categories_category_id ON event_categories (category_id);

CREATE UNIQUE INDEX ix_event_categories_category_name ON event_categories (category_name);


CREATE TABLE password_reset_tokens (
	token_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	token VARCHAR(255) NOT NULL, 
	expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	used BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (token_id), 
	FOREIGN KEY(user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX ix_password_reset_tokens_token ON password_reset_tokens (token);

CREATE INDEX ix_password_reset_tokens_user_id ON password_reset_tokens (user_id);


CREATE TABLE refresh_tokens (
	refresh_token_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	token VARCHAR(500) NOT NULL, 
	expiry TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	revoked BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (refresh_token_id), 
	FOREIGN KEY(user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX ix_refresh_tokens_token ON refresh_tokens (token);

CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);


CREATE TABLE notifications (
	notification_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	message TEXT NOT NULL, 
	notification_type notificationtype NOT NULL, 
	is_read BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (notification_id), 
	FOREIGN KEY(user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE INDEX ix_notifications_created_at ON notifications (created_at);

CREATE INDEX ix_notifications_user_id ON notifications (user_id);

CREATE INDEX ix_notifications_notification_id ON notifications (notification_id);


CREATE TABLE user_profiles (
	profile_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	college_id UUID, 
	full_name VARCHAR(255), 
	phone VARCHAR(20), 
	gender gender, 
	department VARCHAR(255), 
	course VARCHAR(255), 
	year_of_study INTEGER, 
	bio TEXT, 
	profile_picture VARCHAR(500), 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (profile_id), 
	FOREIGN KEY(user_id) REFERENCES users (user_id) ON DELETE CASCADE, 
	FOREIGN KEY(college_id) REFERENCES colleges (college_id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX ix_user_profiles_user_id ON user_profiles (user_id);


CREATE TABLE events (
	event_id UUID NOT NULL, 
	organizer_id UUID NOT NULL, 
	category_id UUID, 
	title VARCHAR(300) NOT NULL, 
	description TEXT, 
	category eventcategory NOT NULL, 
	event_type eventtype NOT NULL, 
	venue VARCHAR(500), 
	start_datetime TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	end_datetime TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	max_participants INTEGER, 
	registration_deadline TIMESTAMP WITHOUT TIME ZONE, 
	poster VARCHAR(500), 
	status eventstatus NOT NULL, 
	approval_status approvalstatus NOT NULL, 
	rejection_reason TEXT, 
	qr_code VARCHAR(500), 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	event_date DATE, 
	start_time TIME WITHOUT TIME ZONE, 
	end_time TIME WITHOUT TIME ZONE, 
	capacity INTEGER, 
	fees NUMERIC(10, 2), 
	participation_type participationtype NOT NULL, 
	reg_date_time TIMESTAMP WITHOUT TIME ZONE, 
	poster_url VARCHAR(500), 
	rulebook_url VARCHAR(500), 
	schedule_url VARCHAR(500), 
	event_status VARCHAR(50), 
	PRIMARY KEY (event_id), 
	FOREIGN KEY(organizer_id) REFERENCES users (user_id) ON DELETE CASCADE, 
	FOREIGN KEY(category_id) REFERENCES event_categories (category_id) ON DELETE SET NULL
);

CREATE INDEX ix_events_title ON events (title);

CREATE INDEX ix_events_category_id ON events (category_id);

CREATE INDEX ix_events_event_id ON events (event_id);

CREATE INDEX ix_events_organizer_id ON events (organizer_id);

CREATE INDEX ix_events_status ON events (status);


CREATE TABLE organizers (
	organizer_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	designation VARCHAR(255), 
	permissions JSON, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (organizer_id), 
	FOREIGN KEY(user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE INDEX ix_organizers_organizer_id ON organizers (organizer_id);

CREATE UNIQUE INDEX ix_organizers_user_id ON organizers (user_id);


CREATE TABLE teams (
	team_id UUID NOT NULL, 
	event_id UUID NOT NULL, 
	leader_id UUID NOT NULL, 
	team_name VARCHAR(255) NOT NULL, 
	team_members TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (team_id), 
	FOREIGN KEY(event_id) REFERENCES events (event_id) ON DELETE CASCADE, 
	FOREIGN KEY(leader_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE INDEX ix_teams_leader_id ON teams (leader_id);

CREATE INDEX ix_teams_team_id ON teams (team_id);

CREATE INDEX ix_teams_event_id ON teams (event_id);


CREATE TABLE feedback (
	feedback_id UUID NOT NULL, 
	event_id UUID NOT NULL, 
	participant_id UUID NOT NULL, 
	rating INTEGER NOT NULL, 
	review TEXT NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (feedback_id), 
	FOREIGN KEY(event_id) REFERENCES events (event_id) ON DELETE CASCADE, 
	FOREIGN KEY(participant_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE INDEX ix_feedback_event_id ON feedback (event_id);

CREATE INDEX ix_feedback_participant_id ON feedback (participant_id);

CREATE INDEX ix_feedback_feedback_id ON feedback (feedback_id);
--

CREATE TABLE registrations (
	registration_id UUID NOT NULL, 
	event_id UUID NOT NULL, 
	participant_id UUID NOT NULL, 
	registration_status registrationstatus NOT NULL, 
	payment_status paymentstatus NOT NULL, 
	registered_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	registration_type VARCHAR(100), 
	qr_code VARCHAR(500), 
	team_id UUID, 
	PRIMARY KEY (registration_id), 
	CONSTRAINT uq_event_participant_registration UNIQUE (event_id, participant_id), 
	FOREIGN KEY(event_id) REFERENCES events (event_id) ON DELETE CASCADE, 
	FOREIGN KEY(participant_id) REFERENCES users (user_id) ON DELETE CASCADE, 
	FOREIGN KEY(team_id) REFERENCES teams (team_id) ON DELETE SET NULL
);

CREATE INDEX ix_registrations_event_id ON registrations (event_id);

CREATE INDEX ix_registrations_participant_id ON registrations (participant_id);

CREATE INDEX ix_registrations_registration_id ON registrations (registration_id);

CREATE INDEX ix_registrations_team_id ON registrations (team_id);


CREATE TABLE team_members (
	team_member_id UUID NOT NULL, 
	team_id UUID NOT NULL, 
	total_team_members INTEGER, 
	participant_id UUID NOT NULL, 
	PRIMARY KEY (team_member_id), 
	FOREIGN KEY(team_id) REFERENCES teams (team_id) ON DELETE CASCADE, 
	FOREIGN KEY(participant_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE INDEX ix_team_members_participant_id ON team_members (participant_id);

CREATE INDEX ix_team_members_team_member_id ON team_members (team_member_id);

CREATE INDEX ix_team_members_team_id ON team_members (team_id);


CREATE TABLE results (
	result_id UUID NOT NULL, 
	event_id UUID NOT NULL, 
	team_id UUID, 
	participant_id UUID, 
	rank INTEGER, 
	score FLOAT, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (result_id), 
	FOREIGN KEY(event_id) REFERENCES events (event_id) ON DELETE CASCADE, 
	FOREIGN KEY(team_id) REFERENCES teams (team_id) ON DELETE SET NULL, 
	FOREIGN KEY(participant_id) REFERENCES users (user_id) ON DELETE SET NULL
);

CREATE INDEX ix_results_event_id ON results (event_id);

CREATE INDEX ix_results_participant_id ON results (participant_id);

CREATE INDEX ix_results_team_id ON results (team_id);

CREATE INDEX ix_results_result_id ON results (result_id);


CREATE TABLE certificates (
	certificate_id UUID NOT NULL, 
	event_id UUID NOT NULL, 
	registration_id UUID NOT NULL, 
	participant_id UUID NOT NULL, 
	certificate_number VARCHAR(100) NOT NULL, 
	pdf_path VARCHAR(500), 
	certificate_type VARCHAR(100), 
	certificate_url VARCHAR(500), 
	generated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	issue_date TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (certificate_id), 
	FOREIGN KEY(event_id) REFERENCES events (event_id) ON DELETE CASCADE, 
	FOREIGN KEY(registration_id) REFERENCES registrations (registration_id) ON DELETE CASCADE, 
	FOREIGN KEY(participant_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE INDEX ix_certificates_event_id ON certificates (event_id);

CREATE INDEX ix_certificates_participant_id ON certificates (participant_id);

CREATE INDEX ix_certificates_registration_id ON certificates (registration_id);

CREATE UNIQUE INDEX ix_certificates_certificate_number ON certificates (certificate_number);

CREATE INDEX ix_certificates_certificate_id ON certificates (certificate_id);


CREATE TABLE attendance (
	attendance_id UUID NOT NULL, 
	registration_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	event_id UUID NOT NULL, 
	check_in_time TIMESTAMP WITHOUT TIME ZONE, 
	check_out_time TIMESTAMP WITHOUT TIME ZONE, 
	attendance_status attendancestatus NOT NULL, 
	scanned_by UUID, 
	qrcode_url VARCHAR(500), 
	attendance_method VARCHAR(100), 
	PRIMARY KEY (attendance_id), 
	FOREIGN KEY(registration_id) REFERENCES registrations (registration_id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (user_id) ON DELETE CASCADE, 
	FOREIGN KEY(event_id) REFERENCES events (event_id) ON DELETE CASCADE, 
	FOREIGN KEY(scanned_by) REFERENCES users (user_id) ON DELETE SET NULL
);

CREATE INDEX ix_attendance_user_id ON attendance (user_id);

CREATE INDEX ix_attendance_attendance_id ON attendance (attendance_id);

CREATE UNIQUE INDEX ix_attendance_registration_id ON attendance (registration_id);

CREATE INDEX ix_attendance_event_id ON attendance (event_id);


CREATE TABLE payments (
	payment_id UUID NOT NULL, 
	event_id UUID NOT NULL, 
	registration_id UUID NOT NULL, 
	amount NUMERIC(10, 2) NOT NULL, 
	payment_gateway VARCHAR(100), 
	payment_method VARCHAR(100), 
	transaction_id VARCHAR(255), 
	payment_status VARCHAR(50) NOT NULL, 
	payment_date TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (payment_id), 
	FOREIGN KEY(event_id) REFERENCES events (event_id) ON DELETE CASCADE, 
	FOREIGN KEY(registration_id) REFERENCES registrations (registration_id) ON DELETE CASCADE
);

CREATE INDEX ix_payments_registration_id ON payments (registration_id);

CREATE INDEX ix_payments_payment_id ON payments (payment_id);

CREATE INDEX ix_payments_event_id ON payments (event_id);

