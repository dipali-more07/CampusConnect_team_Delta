CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
	full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mobile VARCHAR(15) UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'organizer', 'participant')),
    college_name VARCHAR(150),
    department VARCHAR(100),
    course VARCHAR(100),
    profile_image TEXT,
    gender VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE event_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
	category_id int ,
	organizer_id int,
	title VARCHAR(150) NOT NULL,
    description TEXT,
    venue VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT NOT NULL,
    registered_fee int default 0,
    qr_code TEXT,
	registration_deadline DATE NOT NULL,
    poster_url VARCHAR(255),
    rulebook_url VARCHAR(255),
    schedule_url VARCHAR(255),
	event_type VARCHAR(20) CHECK (event_type IN ('INDIVIDUAL','TEAM')),
    event_status VARCHAR(20) DEFAULT 'Upcoming'CHECK ( event_status IN ('Upcoming','Ongoing', 'Completed','Cancelled' )),
    status VARCHAR(20) DEFAULT 'Pending'CHECK (status IN ('Pending','Approved', 'Rejected' )),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	unique(category_id  ,organizer_id ),
        FOREIGN KEY (category_id)
        REFERENCES event_categories(category_id),
        FOREIGN KEY (organizer_id)
        REFERENCES users(user_id)     
);


CREATE TABLE registrations (
    registration_id SERIAL PRIMARY KEY,
    participant_id INT NOT NULL,
    event_id INT NOT NULL,
    registration_type VARCHAR(20) CHECK (registration_type IN ('individual','team')),
    qr_code TEXT,
    registration_status VARCHAR(20) DEFAULT 'pending' CHECK (registration_status IN ('pending','confirmed','cancelled')),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (participant_id, event_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (participant_id) REFERENCES users(user_id)
);


CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    registration_id INT NOT NULL,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    attendance_status VARCHAR(20) NOT NULL CHECK (attendance_status IN ('Present', 'Absent')),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
	qrcode_url text,
    attendance_method VARCHAR(20) CHECK (attendance_method IN ('QR Code','upicode')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id)REFERENCES registrations(registration_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
        UNIQUE(user_id, event_id)
);


CREATE TABLE teams (
    team_id SERIAL PRIMARY KEY,
    event_id INT,
    leader_id INT NOT NULL,
    team_name VARCHAR(150),
    team_members int,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at timestamp default current_timestamp,
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (leader_id) REFERENCES users(user_id)
);

CREATE TABLE team_members (
    team_member_id SERIAL PRIMARY KEY,
    team_id int,
	total_team_members int,
    participant_id INT,
    FOREIGN KEY (team_id) REFERENCES teams(team_id),
    FOREIGN KEY (participant_id) REFERENCES users(user_id)
);


CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL,
    registration_id INT NOT NULL UNIQUE,
    amount NUMERIC(10,2) NOT NULL,
    payment_gateway VARCHAR(50) ,
    payment_method Varchar(100) check (payment_method in('free registration','netbanking')),
    transaction_id VARCHAR(150) UNIQUE,
    payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('PENDING','SUCCESS','FAILED','REFUNDED')),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES registrations(registration_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);


CREATE TABLE results (
    result_id SERIAL PRIMARY KEY,
    event_id INT,
    team_id INT,
    participant_id INT,
    rank INT,
    score NUMERIC(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (participant_id) REFERENCES users(user_id)
);


CREATE TABLE certificates (
    certificate_id SERIAL PRIMARY KEY,
    registration_id INT NOT NULL,
    event_id INT,
    participant_id INT,
    certificate_type VARCHAR(30) CHECK (certificate_type IN ('participation','winner')),
    certificate_url TEXT,
    generated_at TIMESTAMP,
	issue_date DATE,
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (participant_id) REFERENCES users(user_id),
    FOREIGN KEY (registration_id) REFERENCES registrations(registration_id)
);


CREATE TABLE feedback (
    feedback_id SERIAL PRIMARY KEY,
    event_id INT,
    participant_id INT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (participant_id) REFERENCES users(user_id)
);


CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT,
    title VARCHAR(150),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);




























