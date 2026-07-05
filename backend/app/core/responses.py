"""
app/core/responses.py
======================
Standardized JSON response format for every API endpoint.

WHY CONSISTENT RESPONSES:
  Without this, different endpoints might return:
    {"user": {...}}
    {"data": [...], "count": 10}
    {"result": "ok"}

  This makes the frontend code complicated and inconsistent.

  With a standard response, EVERY endpoint returns:
    {
      "success": true,
      "message": "User fetched successfully",
      "data": {...}
    }

  OR for errors:
    {
      "success": false,
      "message": "User not found",
      "data": null
    }

  The frontend always knows what to expect.
"""

from typing import Any, Optional
from fastapi.responses import JSONResponse


def success_response(
    message: str = "Success",
    data: Any = None,
    status_code: int = 200
) -> JSONResponse:
    """
    Return a successful API response.

    Args:
        message: Human-readable success message
        data: The actual response data (dict, list, etc.)
        status_code: HTTP status code (200, 201, etc.)

    Example:
        return success_response(
            message="User created successfully",
            data={"user_id": "abc-123", "email": "john@example.com"},
            status_code=201
        )

    Returns:
        {
            "success": true,
            "message": "User created successfully",
            "data": {"user_id": "abc-123", "email": "john@example.com"}
        }
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "message": message,
            "data": data
        }
    )


def error_response(
    message: str = "An error occurred",
    status_code: int = 400,
    errors: Optional[Any] = None
) -> JSONResponse:
    """
    Return an error API response.

    Args:
        message: Human-readable error message
        status_code: HTTP error status code (400, 404, 403, etc.)
        errors: Optional detailed error information

    Example:
        return error_response(
            message="Invalid email format",
            status_code=400
        )

    Returns:
        {
            "success": false,
            "message": "Invalid email format",
            "data": null
        }
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
            "data": errors
        }
    )


def paginated_response(
    message: str = "Success",
    data: Any = None,
    total: int = 0,
    page: int = 1,
    size: int = 10,
    status_code: int = 200
) -> JSONResponse:
    """
    Return a paginated list response.

    WHY PAGINATION:
      Returning all 10,000 events at once would be very slow.
      Pagination breaks the list into pages (e.g., 10 items per page).
      The frontend loads one page at a time.

    Returns:
        {
            "success": true,
            "message": "Events fetched successfully",
            "data": [...],
            "pagination": {
                "total": 150,
                "page": 1,
                "size": 10,
                "total_pages": 15,
                "has_next": true,
                "has_previous": false
            }
        }
    """
    total_pages = (total + size - 1) // size if size > 0 else 0

    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "message": message,
            "data": data,
            "pagination": {
                "total": total,
                "page": page,
                "size": size,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1
            }
        }
    )
