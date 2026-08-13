"""
app/utils/validators.py
========================
Custom validation functions used across the project.
"""
import re
from typing import Optional


def is_valid_phone(phone: str) -> bool:
    """
    Validate phone number format.
    Accepts: +91-9876543210, 9876543210, +1-202-555-0100
    """
    # Remove spaces, dashes, and parentheses
    cleaned = re.sub(r"[\s\-()]", "", phone)
    # Must be digits, optionally starting with +
    pattern = r"^\+?[1-9]\d{6,14}$"
    return bool(re.match(pattern, cleaned))


def is_valid_file_extension(
    filename: str, allowed_extensions: list[str]
) -> bool:
    """
    Validate file extension against an allowed list.

    Example:
        is_valid_file_extension("photo.jpg", ["jpg", "png"]) -> True
        is_valid_file_extension("script.exe", ["jpg", "png"]) -> False
    """
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[-1].lower()
    return ext in [e.lower() for e in allowed_extensions]


def sanitize_filename(filename: str) -> str:
    """
    Remove dangerous characters from a filename.
    Prevents path traversal attacks like '../../../etc/passwd'
    """
    # Keep only alphanumeric, dots, underscores, and hyphens
    name = re.sub(r"[^\w.\-]", "_", filename)
    # Remove multiple dots (prevents 'file..exe' tricks)
    name = re.sub(r"\.{2,}", ".", name)
    return name


def validate_and_sanitize_frontend_url(url: Optional[str], default_fallback: str = "https://campusconnectdelta.zapto.org") -> str:
    """
    Validates and sanitizes a URL against host header / URL injection attacks.
    Ensures that the URL host matches an allowed origin in system configuration.
    If invalid or untrusted, falls back to default_fallback.
    """
    from urllib.parse import urlparse
    from app.core.config import settings

    if not url:
        return default_fallback.rstrip("/")

    # Strip dangerous whitespace / control characters
    cleaned_url = url.strip().split("\r")[0].split("\n")[0]

    try:
        parsed = urlparse(cleaned_url)
        if not parsed.scheme or not parsed.netloc:
            return default_fallback.rstrip("/")

        # Allowed hostnames / origins check
        allowed_list = settings.get_allowed_origins_list()
        allowed_hosts = set()
        for allowed in allowed_list:
            p = urlparse(allowed)
            if p.netloc:
                allowed_hosts.add(p.netloc.lower())

        # Add server domain explicitly
        allowed_hosts.add("campusconnectdelta.zapto.org")
        allowed_hosts.add("localhost")
        allowed_hosts.add("127.0.0.1")

        host_without_port = parsed.netloc.split(":")[0].lower()
        if parsed.netloc.lower() not in allowed_hosts and host_without_port not in allowed_hosts:
            # Untrusted host! Fallback to default to prevent URL / Host Header Injection
            return default_fallback.rstrip("/")

        scheme = "https" if ("zapto.org" in host_without_port and "localhost" not in host_without_port and "127.0.0.1" not in host_without_port) else parsed.scheme
        return f"{scheme}://{parsed.netloc}".rstrip("/")
    except Exception:
        return default_fallback.rstrip("/")
