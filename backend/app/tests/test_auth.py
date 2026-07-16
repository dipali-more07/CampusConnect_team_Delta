"""
app/tests/test_auth.py
Authentication tests.
"""
# pyrefly: ignore [missing-import]
import pytest
from app.tests.conftest import auth_headers


class TestRegister:
    def test_register_success(self, client, test_college, db):
        response = client.post("/api/v1/auth/register", json={
            "email": "newuser@test.com",
            "password": "NewUser@123",
            "confirm_password": "NewUser@123",
            "full_name": "New User",
            "phone": "+919876543210",
            "course": "B.Tech Computer Science",
            "college_id": test_college.college_id,
            "gender": "male",
            "year_of_study": 3,
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert "user_id" in data["data"]
        assert data["data"]["email"] == "newuser@test.com"
        assert data["data"]["role"] == "participant"

        # Check DB values directly
        from app.models.user import User, UserProfile
        user = db.query(User).filter(User.email == "newuser@test.com").first()
        assert user is not None
        assert user.gender == "male"

        profile = db.query(UserProfile).filter(UserProfile.user_id == user.user_id).first()
        assert profile is not None
        assert profile.gender.value == "male" if hasattr(profile.gender, "value") else profile.gender == "male"
        assert profile.year_of_study == 3

    def test_register_duplicate_email_returns_409(self, client, test_college):
        payload = {
            "email": "dup@test.com",
            "password": "Test@123456",
            "confirm_password": "Test@123456",
            "full_name": "Duplicate User",
            "phone": "+919876543211",
            "course": "B.Tech",
            "college_id": test_college.college_id,
        }
        client.post("/api/v1/auth/register", json=payload)
        response = client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 409

    def test_register_invalid_email_returns_422(self, client, test_college):
        response = client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "Test@123456",
            "confirm_password": "Test@123456",
            "full_name": "Invalid Email User",
            "phone": "+919876543212",
            "course": "B.Tech",
            "college_id": test_college.college_id,
        })
        assert response.status_code == 422

    def test_register_with_existing_college_name(self, client, test_college):
        response = client.post("/api/v1/auth/register", json={
            "email": "nameuser@test.com",
            "password": "NameUser@123",
            "confirm_password": "NameUser@123",
            "full_name": "Name User",
            "phone": "+919876543213",
            "course": "B.Tech Computer Science",
            "college_id": test_college.college_name,
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True

    def test_register_with_new_college_name(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "newcollegeuser@test.com",
            "password": "NewCollegeUser@123",
            "confirm_password": "NewCollegeUser@123",
            "full_name": "New College User",
            "phone": "+919876543214",
            "course": "B.Tech Computer Science",
            "college_id": "Completely New College Name",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True


class TestLogin:
    def test_login_success(self, client, participant_user):
        response = client.post("/api/v1/auth/login", json={
            "email": "student@test.com",
            "password": "Student@123456",
        })
        assert response.status_code == 200
        data = response.json()["data"]
        assert "access_token" in data
        assert "refresh_token" in data


class TestProtectedRoutes:
    def test_get_me_with_valid_token(self, client, participant_user, participant_token):
        response = client.get(
            "/api/v1/auth/me",
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["email"] == "student@test.com"
        assert "full_name" in data
        assert "mobile" in data
        assert "gender" in data
        assert "year_of_study" in data
        assert "profile" in data

    def test_get_me_without_token_returns_401(self, client):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_admin_endpoint_with_participant_token_returns_403(self, client, participant_token):
        response = client.get(
            "/api/v1/users/",
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 403


class TestEmailVerification:
    def test_registration_and_verification_flow(self, client, test_college, db):
        # 1. Register a new user
        reg_resp = client.post("/api/v1/auth/register", json={
            "email": "verifyuser@test.com",
            "password": "VerifyUser@123",
            "confirm_password": "VerifyUser@123",
            "full_name": "Verify User",
            "phone": "+919876543215",
            "course": "B.Tech Computer Science",
            "college_id": test_college.college_id,
        })
        assert reg_resp.status_code == 201

        # 2. Try to login (should fail because email is not verified)
        login_resp = client.post("/api/v1/auth/login", json={
            "email": "verifyuser@test.com",
            "password": "VerifyUser@123"
        })
        assert login_resp.status_code == 401
        assert "verify your email" in login_resp.json()["message"].lower()

        # 3. Retrieve code from DB
        from app.models.user import User
        user = db.query(User).filter(User.email == "verifyuser@test.com").first()
        assert user.verification_code is not None

        # 4. Verify with invalid code (should fail)
        verify_resp = client.post("/api/v1/auth/verify-email", json={
            "email": "verifyuser@test.com",
            "code": "000000"
        })
        assert verify_resp.status_code == 400

        # 5. Verify with correct code
        verify_resp = client.post("/api/v1/auth/verify-email", json={
            "email": "verifyuser@test.com",
            "code": user.verification_code
        })
        assert verify_resp.status_code == 200
        assert verify_resp.json()["success"] is True

        # 6. Now try to login (should succeed)
        login_resp = client.post("/api/v1/auth/login", json={
            "email": "verifyuser@test.com",
            "password": "VerifyUser@123"
        })
        assert login_resp.status_code == 200
        assert "access_token" in login_resp.json()["data"]

    def test_resend_verification_code(self, client, test_college, db):
        # Register a new user
        client.post("/api/v1/auth/register", json={
            "email": "resenduser@test.com",
            "password": "ResendUser@123",
            "confirm_password": "ResendUser@123",
            "full_name": "Resend User",
            "phone": "+919876543216",
            "course": "B.Tech",
            "college_id": test_college.college_id,
        })

        from app.models.user import User
        user = db.query(User).filter(User.email == "resenduser@test.com").first()
        old_code = user.verification_code
        assert old_code is not None

        # Resend code
        resend_resp = client.post("/api/v1/auth/resend-code", json={
            "email": "resenduser@test.com"
        })
        assert resend_resp.status_code == 200
        
        # Refresh user and check code changed
        db.refresh(user)
        assert user.verification_code != old_code

