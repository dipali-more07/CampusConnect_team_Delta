"""
app/middleware/rate_limit_middleware.py
========================================
Rate limiting configuration.

WHY RATE LIMITING:
  Without rate limiting, a bot could:
  - Try 1 million passwords per minute (brute force attack)
  - Flood the server with requests (DoS attack)
  - Scrape all your data

  Rate limiting says: 'Max 60 requests per minute per IP'.
  Beyond that, return 429 Too Many Requests.

HOW SLOWAPI WORKS:
  slowapi uses a 'limiter' object.
  We attach it to the app and mark endpoints with @limiter.limit()
  It tracks requests by IP using an in-memory counter.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

# Create the rate limiter
# get_remote_address = function that extracts client IP from request
limiter = Limiter(key_func=get_remote_address)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Custom error response when rate limit is exceeded.
    Returns 429 with a clear message instead of the default slowapi response.
    """
    return JSONResponse(
        status_code=429,
        content={
            "success": False,
            "message": "Too many requests. Please slow down and try again later.",
            "data": None,
        },
    )
