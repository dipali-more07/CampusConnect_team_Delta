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
    if data is None:
        data = []

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
