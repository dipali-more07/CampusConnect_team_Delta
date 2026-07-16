"""
app/tests/test_users.py
Tests for User and profile management APIs.
"""
import pytest
from app.tests.conftest import auth_headers
from app.core.constants import UserRole
from app.models.user import User

class TestUserManagement:
    def test_admin_can_create_organizer_success(self, client, admin_token, test_college, db):
        response = client.post(
            "/api/v1/users/organizer",
            json={
                "email": "neworg@test.com",
                "password": "OrganizerPassword@123",
                "full_name": "New Organizer",
                "phone": "+919876543219",
                "department": "CSE",
                "college_id": test_college.college_id
            },
            headers=auth_headers(admin_token)
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["email"] == "neworg@test.com"
        assert data["data"]["role"] == UserRole.ORGANIZER
        assert data["data"]["is_email_verified"] is True

        # Verify in DB and check profile is created
        user = db.query(User).filter(User.email == "neworg@test.com").first()
        assert user is not None
        assert user.profile is not None
        assert user.profile.full_name == "New Organizer"
        assert user.profile.phone == "+919876543219"
        assert user.profile.department == "CSE"
        assert user.profile.college_id == test_college.college_id

    def test_participant_cannot_create_organizer_returns_403(self, client, participant_token, test_college):
        response = client.post(
            "/api/v1/users/organizer",
            json={
                "email": "neworg2@test.com",
                "password": "OrganizerPassword@123",
                "full_name": "New Organizer 2",
                "phone": "+919876543220",
                "college_id": test_college.college_id
            },
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 403

    def test_create_duplicate_organizer_returns_409(self, client, admin_token, participant_user, test_college):
        # participant_user email already exists
        response = client.post(
            "/api/v1/users/organizer",
            json={
                "email": participant_user.email,
                "password": "OrganizerPassword@123",
                "full_name": "Duplicate Organizer",
                "phone": "+919876543221",
                "college_id": test_college.college_id
            },
            headers=auth_headers(admin_token)
        )
        assert response.status_code == 409

    def test_list_organizers_success(self, client, participant_token, organizer_user):
        response = client.get(
            "/api/v1/users/organizers",
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) >= 1
        
        organizer = data["data"][0]
        assert "user_id" in organizer
        assert "email" in organizer
        assert "full_name" in organizer
        assert "mobile" in organizer
        assert "college_name" in organizer
        assert "department" in organizer

    def test_list_participants_success(self, client, participant_token, participant_user):
        response = client.get(
            "/api/v1/users/participants",
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) >= 1
        
        participant = data["data"][0]
        assert "user_id" in participant
        assert "email" in participant
        assert "full_name" in participant

    def test_admin_can_create_student_success(self, client, admin_token, test_college, db):
        response = client.post(
            "/api/v1/users/students",
            json={
                "email": "newstudent@test.com",
                "password": "StudentPassword@123",
                "full_name": "New Student",
                "phone": "+919876543229",
                "department": "IT",
                "course": "BTech",
                "college_id": test_college.college_id
            },
            headers=auth_headers(admin_token)
        )
        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        assert data["data"]["email"] == "newstudent@test.com"
        assert data["data"]["role"] == UserRole.PARTICIPANT

    def test_list_students_success(self, client, participant_token, participant_user):
        response = client.get(
            "/api/v1/users/students",
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) >= 1


class TestUserProfileUpdate:
    def test_update_profile_success(self, client, participant_user, participant_token, db):
        response = client.patch(
            "/api/v1/users/profile",
            json={
                "full_name": "Updated Name",
                "phone": "+919999999999",
                "gender": "female",
                "department": "Mechanical Engineering",
                "course": "B.Tech",
                "year_of_study": 4,
                "bio": "Hello World"
            },
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["full_name"] == "Updated Name"

        # Check DB to verify sync to User table
        from app.models.user import User, UserProfile
        user = db.query(User).filter(User.user_id == participant_user.user_id).first()
        assert user is not None
        assert user.full_name == "Updated Name"
        assert user.mobile == "+919999999999"
        assert user.gender == "female"
        assert user.department == "Mechanical Engineering"
        assert user.course == "B.Tech"

        profile = db.query(UserProfile).filter(UserProfile.user_id == participant_user.user_id).first()
        assert profile is not None
        assert profile.gender.value == "female" if hasattr(profile.gender, "value") else profile.gender == "female"
        assert profile.year_of_study == 4
        assert profile.bio == "Hello World"
