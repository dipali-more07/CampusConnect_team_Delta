"""
app/tests/conftest.py
======================
Shared test fixtures and configuration.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.base import Base, get_db
from app.core.constants import UserRole
from app.core.security import hash_password

# Use in-memory SQLite for testing (no PostgreSQL needed for unit/integration tests here)
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


@pytest.fixture(scope="function")
def db():
    """Create a fresh test database for each test function."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db):
    """Create a FastAPI test client that uses the test database."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db):
    """Create an admin user for testing."""
    from app.models.user import User, UserProfile
    user = User(
        email="admin@test.com",
        password_hash=hash_password("Admin@123456"),
        role=UserRole.ADMIN,
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    db.flush()
    profile = UserProfile(user_id=user.user_id, full_name="Test Admin")
    db.add(profile)
    db.commit()
    return user


@pytest.fixture
def participant_user(db):
    """Create a participant user for testing."""
    from app.models.user import User, UserProfile
    user = User(
        email="student@test.com",
        password_hash=hash_password("Student@123456"),
        role=UserRole.PARTICIPANT,
        is_active=True,
        is_email_verified=True,
    )
    db.add(user)
    db.flush()
    profile = UserProfile(user_id=user.user_id, full_name="Test Student")
    db.add(profile)
    db.commit()
    return user


@pytest.fixture
def admin_token(client, admin_user):
    """Get a JWT token for the admin user."""
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@test.com",
        "password": "Admin@123456"
    })
    return response.json()["data"]["access_token"]


@pytest.fixture
def participant_token(client, participant_user):
    """Get a JWT token for the participant user."""
    response = client.post("/api/v1/auth/login", json={
        "email": "student@test.com",
        "password": "Student@123456"
    })
    return response.json()["data"]["access_token"]


def auth_headers(token: str) -> dict:
    """Helper to create auth header."""
    return {"Authorization": f"Bearer {token}"}
