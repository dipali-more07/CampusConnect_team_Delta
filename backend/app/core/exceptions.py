"""
app/core/exceptions.py
=======================
Custom exceptions for the application.

WHY CUSTOM EXCEPTIONS:
  Python has built-in exceptions like ValueError, TypeError, etc.
  But we need exceptions that carry:
    - HTTP status codes (404, 403, 409...)
    - Meaningful messages for the API response
    - Consistency across the entire codebase

HOW IT WORKS:
  Instead of: raise Exception("User not found")
  We raise:   raise NotFoundException("User not found")

  FastAPI then knows to return a 404 HTTP response with that message.
  This is much cleaner than manually building error responses everywhere.
"""

from fastapi import HTTPException, status


class AppException(HTTPException):
    """
    Base exception for all custom app exceptions.
    All other custom exceptions inherit from this.
    """
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(AppException):
    """
    Raised when a resource doesn't exist.
    HTTP 404 - Not Found

    Example: User with ID xyz doesn't exist in the database
    """
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class UnauthorizedException(AppException):
    """
    Raised when user is not authenticated (not logged in).
    HTTP 401 - Unauthorized

    Example: Request has no JWT token, or token is expired
    """
    def __init__(self, detail: str = "Not authenticated. Please login."):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class ForbiddenException(AppException):
    """
    Raised when user is authenticated but doesn't have permission.
    HTTP 403 - Forbidden

    Example: A participant trying to access admin-only endpoint
    """
    def __init__(self, detail: str = "You don't have permission to perform this action"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class ConflictException(AppException):
    """
    Raised when an action conflicts with existing data.
    HTTP 409 - Conflict

    Example: Trying to register for an event you already registered for
    """
    def __init__(self, detail: str = "Conflict with existing resource"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class BadRequestException(AppException):
    """
    Raised when request data is invalid or cannot be processed.
    HTTP 400 - Bad Request

    Example: Event registration deadline has passed
    """
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class UnprocessableException(AppException):
    """
    Raised when request is syntactically correct but semantically wrong.
    HTTP 422 - Unprocessable Entity

    Example: End date is before start date for an event
    """
    def __init__(self, detail: str = "Unprocessable entity"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


class InternalServerException(AppException):
    """
    Raised when something unexpected goes wrong on the server.
    HTTP 500 - Internal Server Error

    Example: PDF generation failed, QR code couldn't be created
    """
    def __init__(self, detail: str = "Internal server error. Please try again later."):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)
