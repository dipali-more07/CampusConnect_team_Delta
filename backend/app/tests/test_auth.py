"""
app/tests/test_auth.py
Authentication tests.
"""
# pyrefly: ignore [missing-import]
import pytest
from app.tests.conftest import auth_headers


class TestRegister:
    def test_register_success(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "newuser@test.com",
            "password": "NewUser@123",
            "confirm_password": "NewUser@123",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert "user_id" in data["data"]
        assert data["data"]["email"] == "newuser@test.com"
        assert data["data"]["role"] == "participant"

    def test_register_duplicate_email_returns_409(self, client):
        client.post("/api/v1/auth/register", json={
            "email": "dup@test.com",
            "password": "Test@123456",
            "confirm_password": "Test@123456",
        })
        response = client.post("/api/v1/auth/register", json={
            "email": "dup@test.com",
            "password": "Test@123456",
            "confirm_password": "Test@123456",
        })
        assert response.status_code == 409

    def test_register_invalid_email_returns_422(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "Test@123456",
            "confirm_password": "Test@123456",
        })
        assert response.status_code == 422


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

    def test_get_me_without_token_returns_401(self, client):
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_admin_endpoint_with_participant_token_returns_403(self, client, participant_token):
        response = client.get(
            "/api/v1/users/",
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 403
