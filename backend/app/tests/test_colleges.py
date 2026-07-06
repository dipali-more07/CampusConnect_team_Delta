"""
app/tests/test_colleges.py
College endpoints tests.
"""
import pytest
from app.tests.conftest import auth_headers


class TestColleges:
    def test_list_colleges_public(self, client):
        response = client.get("/api/v1/colleges/")
        assert response.status_code == 200

    def test_create_college_requires_admin(self, client, participant_token):
        response = client.post(
            "/api/v1/colleges/",
            json={"college_name": "Test College", "city": "Mumbai", "state": "Maharashtra"},
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 403

    def test_admin_can_create_college(self, client, admin_token):
        response = client.post(
            "/api/v1/colleges/",
            json={"college_name": "IIT Bombay", "city": "Mumbai", "state": "Maharashtra"},
            headers=auth_headers(admin_token)
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["college_name"] == "IIT Bombay"

    def test_create_duplicate_college_returns_409(self, client, admin_token):
        payload = {"college_name": "Unique College", "city": "Delhi"}
        client.post("/api/v1/colleges/", json=payload, headers=auth_headers(admin_token))
        response = client.post("/api/v1/colleges/", json=payload, headers=auth_headers(admin_token))
        assert response.status_code == 409

    def test_get_college_by_id(self, client, admin_token):
        create_response = client.post(
            "/api/v1/colleges/",
            json={"college_name": "NIT Warangal"},
            headers=auth_headers(admin_token)
        )
        college_id = create_response.json()["data"]["college_id"]
        response = client.get(f"/api/v1/colleges/{college_id}")
        assert response.status_code == 200
        assert response.json()["data"]["college_id"] == college_id

    def test_get_nonexistent_college_returns_404(self, client):
        response = client.get("/api/v1/colleges/nonexistent-id")
        assert response.status_code == 404
