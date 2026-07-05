"""
app/database/base.py
=====================
Database setup: engine, session, and base model class.

WHY THIS FILE:
  Before we can talk to the database, we need:
  1. An ENGINE - the actual connection to PostgreSQL
  2. A SESSION - a "conversation" with the database (like a transaction)
  3. A BASE - the parent class for all our database models (tables)

HOW SQLALCHEMY WORKS (Simple Explanation):
  Without SQLAlchemy:  cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
  With SQLAlchemy:     session.execute(select(User).where(User.user_id == user_id))

  SQLAlchemy translates your Python code to SQL automatically.
  This means:
    - No raw SQL strings (safer, no SQL injection)
    - Works with multiple databases (PostgreSQL, MySQL, SQLite)
    - Python objects = database rows (much more Pythonic)

CONNECTION POOLING:
  Opening a new DB connection for every request is expensive (~100ms).
  Connection pooling keeps connections open and reuses them.
  pool_size=10 means we keep 10 connections open at all times.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from sqlalchemy.pool import QueuePool
from typing import Generator

from app.core.config import settings


# ---------------------------------------------------------------
# DATABASE ENGINE
# ---------------------------------------------------------------
# The engine is the entry point to the database.
# It handles the physical connection to PostgreSQL.
engine = create_engine(
    settings.DATABASE_URL,

    # Connection Pool Settings:
    poolclass=QueuePool,      # Standard pool that queues requests

    # Keep 10 connections open and ready to use
    pool_size=10,

    # Allow up to 20 extra connections during traffic spikes
    max_overflow=20,

    # Recycle connections every 30 minutes (prevents stale connections)
    pool_recycle=1800,

    # If a connection is stuck, wait max 30 seconds before error
    pool_timeout=30,

    # Check if connection is still alive before using it
    pool_pre_ping=True,

    # Show SQL queries in logs (only in debug mode for security)
    echo=settings.DEBUG,
)

# ---------------------------------------------------------------
# SESSION FACTORY
# ---------------------------------------------------------------
# SessionLocal is a factory - calling it creates a new DB session.
# Think of a session as a "unit of work":
#   - All changes in a session form one transaction
#   - Either all succeed (commit) or all fail (rollback)
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,   # We manually control when to commit
    autoflush=False,    # We manually control when to flush to DB
    expire_on_commit=False,  # Keep objects accessible after commit
)


# ---------------------------------------------------------------
# BASE CLASS FOR ALL MODELS
# ---------------------------------------------------------------
class Base(DeclarativeBase):
    """
    Parent class for all database models (tables).

    Every model (User, Event, College, etc.) will inherit from this.
    SQLAlchemy uses this to track all tables and their structure.

    Example:
        class User(Base):  # User table inherits from Base
            __tablename__ = "users"
            user_id = Column(UUID, primary_key=True)
            ...
    """
    pass


# ---------------------------------------------------------------
# DATABASE DEPENDENCY
# ---------------------------------------------------------------
def get_db() -> Generator[Session, None, None]:
    """
    Dependency function that provides a database session to routes.

    WHY A GENERATOR (yield):
      Using 'yield' instead of 'return' ensures the session is ALWAYS
      closed after the request, even if an error occurs.

      This is like Python's 'with open(file) as f:' pattern.

    HOW FASTAPI USES IT:
      FastAPI sees 'Depends(get_db)' in a route and automatically:
        1. Calls this function to create a session
        2. Passes the session to your route handler
        3. After the route finishes, runs the 'finally' block
        4. The session is closed no matter what

    Example in a router:
        @router.get("/users")
        def get_users(db: Session = Depends(get_db)):
            # db is your active database session
            users = db.execute(select(User)).scalars().all()
            return users
    """
    db = SessionLocal()
    try:
        yield db          # Give the session to the route
    finally:
        db.close()        # ALWAYS close after request, even on error
