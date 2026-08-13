"""
app/utils/pagination.py
========================
Pagination helper utilities.

WHY PAGINATION:
  Never return all records at once - it would be too slow and use too much memory.
  Instead, we split data into pages and let the client request one page at a time.

  Example: 1000 events -> return 10 at a time
  Page 1: skip=0, limit=10 -> events 1-10
  Page 2: skip=10, limit=10 -> events 11-20
  Page 3: skip=20, limit=10 -> events 21-30
"""
from typing import TypeVar, List
from app.schemas.common import PaginationParams

T = TypeVar("T")


def get_skip_limit(page: int, size: int) -> tuple[int, int]:
    """
    Convert page number and size to skip/limit values for SQL queries.

    Example:
        page=1, size=10 -> skip=0, limit=10
        page=2, size=10 -> skip=10, limit=10
        page=3, size=10 -> skip=20, limit=10
    """
    skip = (page - 1) * size  # How many records to skip
    limit = size              # How many records to return
    return skip, limit


def calculate_total_pages(total: int, size: int) -> int:
    """
    Calculate total number of pages.

    Example:
        total=25, size=10 -> 3 pages (10, 10, 5)
        total=30, size=10 -> 3 pages (10, 10, 10)
        total=0, size=10  -> 0 pages
    """
    if size == 0:
        return 0
    # Use ceiling division: 25/10 = 2.5 -> round up to 3
    return (total + size - 1) // size
