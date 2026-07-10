"""
app/middleware/logging_middleware.py
=====================================
Request/Response logging middleware.

WHAT IS MIDDLEWARE:
  Middleware is code that runs before AND after every request.
  Think of it as a 'wrapper' around all your routes.

  Request comes in -> MIDDLEWARE runs first -> Route handler runs -> MIDDLEWARE runs again -> Response goes out

WHY LOGGING:
  In production, you need to track:
  - Which APIs are being called
  - How long they take (performance monitoring)
  - Which requests failed and why
  - IP addresses for security analysis

  Without logging, debugging production issues is nearly impossible.
"""
import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Set up structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("campusconnect")


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Logs every incoming request and its response.

    Logs format:
      REQUEST:  METHOD /path - IP
      RESPONSE: METHOD /path - STATUS_CODE - TIME_TAKEN
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        """
        This function runs for EVERY request.

        1. Start timer
        2. Log the incoming request
        3. Pass request to the actual route handler
        4. Log the response
        5. Return response to client
        """
        # Record start time for measuring response time
        start_time = time.time()

        # Get client IP (check X-Forwarded-For for proxied requests)
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        # Log incoming request
        logger.info(
            f"REQUEST: {request.method} {request.url.path} "
            f"from {client_ip}"
        )

        # Call the actual route handler
        try:
            response = await call_next(request)
        except Exception as e:
            logger.error(
                f"UNHANDLED ERROR: {request.method} {request.url.path} "
                f"- {type(e).__name__}: {str(e)}"
            )
            raise

        # Calculate how long the request took
        duration = (time.time() - start_time) * 1000  # Convert to milliseconds

        # Log the response
        log_level = logging.WARNING if response.status_code >= 400 else logging.INFO
        logger.log(
            log_level,
            f"RESPONSE: {request.method} {request.url.path} "
            f"- {response.status_code} - {duration:.2f}ms",
        )

        # Add custom headers to response
        response.headers["X-Process-Time"] = f"{duration:.2f}ms"
        return response
