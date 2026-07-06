"""
app/repositories/base.py
=========================
Generic base repository with common CRUD operations.

WHY A BASE REPOSITORY:
  Every table needs the same basic operations:
    - Create a record
    - Get by ID
    - Get all (with pagination)
    - Update
    - Delete

  Instead of writing these 5 functions for every table (User, Event, College...),
  we write them ONCE in this base class.
  Then every repository inherits from this and gets all 5 functions for free.

  This is the DRY principle: Don't Repeat Yourself.

GENERICS (T):
  T is a placeholder for the actual model type.
  When UserRepository inherits Base[User], T becomes User.
  This gives us type safety and IDE autocomplete.
"""

from typing import Generic, TypeVar, Type, Optional, List, Any, Dict
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.database.base import Base

# T = any SQLAlchemy model class (User, Event, College, etc.)
T = TypeVar("T", bound=Base)


class BaseRepository(Generic[T]):
    """
    Generic CRUD repository.
    Inherit from this and pass your model class.

    Example:
        class UserRepository(BaseRepository[User]):
            def __init__(self, db: Session):
                super().__init__(User, db)
    """

    def __init__(self, model: Type[T], db: Session):
        """
        Initialize with the model class and database session.

        Args:
            model: The SQLAlchemy model class (e.g., User, Event)
            db: The database session (created fresh for each request)
        """
        self.model = model
        self.db = db

    def get_by_id(self, record_id: str) -> Optional[T]:
        """
        Get a single record by its primary key (ID).

        Returns the record or None if not found.

        SQL equivalent: SELECT * FROM table WHERE id = :id LIMIT 1
        """
        return self.db.execute(
            select(self.model).where(
                self.model.__table__.c[list(self.model.__table__.primary_key.columns.keys())[0]] == record_id
            )
        ).scalar_one_or_none()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 10,
        filters: Optional[List] = None
    ) -> List[T]:
        """
        Get a list of records with optional pagination and filters.

        Args:
            skip: How many records to skip (for pagination)
            limit: Maximum records to return
            filters: SQLAlchemy filter conditions

        SQL equivalent: SELECT * FROM table WHERE ... LIMIT :limit OFFSET :skip
        """
        query = select(self.model)

        # Apply any additional filters
        if filters:
            for f in filters:
                query = query.where(f)

        # Apply pagination
        query = query.offset(skip).limit(limit)

        return list(self.db.execute(query).scalars().all())

    def count(self, filters: Optional[List] = None) -> int:
        """
        Count total records (used for pagination metadata).

        SQL equivalent: SELECT COUNT(*) FROM table WHERE ...
        """
        query = select(func.count()).select_from(self.model)

        if filters:
            for f in filters:
                query = query.where(f)

        return self.db.execute(query).scalar() or 0

    def create(self, obj: T) -> T:
        """
        Add a new record to the database.

        NOTE: We only ADD to the session here.
            We do NOT commit. The service layer commits.
            This is important for transactions.

        Why: If a service creates a User AND a Profile and the profile
             fails, we need to rollback both. If we committed the user
             already, we can't roll it back.
        """
        self.db.add(obj)
        self.db.flush()   # flush sends SQL to DB but doesn't commit yet
                          # This assigns the ID to the object
        self.db.refresh(obj)  # Reload from DB to get computed fields
        return obj

    def update(self, obj: T, update_data: Dict[str, Any]) -> T:
        """
        Update an existing record with new data.

        Args:
            obj: The SQLAlchemy model instance to update
            update_data: Dict of field names → new values
                         Only fields present in the dict are updated.
        """
        for field, value in update_data.items():
            # Only set the field if it exists on the model
            if hasattr(obj, field) and value is not None:
                setattr(obj, field, value)

        self.db.flush()
        self.db.refresh(obj)
        return obj

    def delete(self, obj: T) -> None:
        """
        Delete a record from the database.

        NOTE: Same as create - we don't commit here.
              The service layer commits.
        """
        self.db.delete(obj)
        self.db.flush()

    def save(self) -> None:
        """
        Flush pending changes to the database (without committing).
        The service layer is responsible for committing.
        """
        self.db.flush()
