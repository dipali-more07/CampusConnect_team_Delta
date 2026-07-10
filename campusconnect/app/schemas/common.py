"""
app/schemas/common.py
Shared Pydantic schemas used across multiple modules.

WHY SCHEMAS:
  Schemas define the shape of data coming IN and going OUT of the API.
  Pydantic v2 validates every field automatically.
  If validation fails, FastAPI returns 422 with clear error messages.
"""
from pydantic import BaseModel, Field
from typing import Optional


class PaginationParams(BaseModel):
    """Standard pagination parameters. Every listing API uses these."""
    page: int = Field(default=1, ge=1, description="Page number (starts from 1)")
    size: int = Field(default=10, ge=1, le=100, description="Items per page (max 100)")
    search: Optional[str] = Field(default=None, description="Search keyword")
    sort_by: Optional[str] = Field(default="created_at", description="Field to sort by")
    sort_order: Optional[str] = Field(default="desc", pattern="^(asc|desc)$")


class Pagination(BaseModel):
    total: int
    page: int
    size: int
    total_pages: int
    has_next: bool
    has_previous: bool
