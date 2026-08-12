"""
app/middleware/payload_obfuscation_middleware.py
==================================================
Global Payload Obfuscation & Encryption Middleware.

PURPOSE:
  Intercepts incoming HTTP requests (POST, PUT, PATCH, DELETE) and automatically
  de-obfuscates/decrypts payload bodies sent by frontend before reaching FastAPI
  route handlers and Pydantic schemas.

HOW IT WORKS:
  Frontend sends payload in obfuscated format:
  { "payload": "<base64_encoded_json_string>" }
  OR { "encrypted_data": "<base64_encoded_json_string>" }
  OR a raw Base64 string.

  In Network DevTools, request bodies (Events CRUD, Auth, Registrations, etc.) 
  are NOT readable as plain text.

  Middleware automatically decodes the payload into original JSON bytes and
  replaces request._body so route handlers receive regular JSON seamlessly.
"""

import json
import base64
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("campusconnect.obfuscation")


def decode_payload_str(encoded_str: str) -> bytes:
    """Decodes a base64 / urlsafe base64 encoded payload string to raw bytes."""
    clean_str = encoded_str.strip()
    padding_needed = (4 - len(clean_str) % 4) % 4
    padded = clean_str + ("=" * padding_needed)

    for decoder in (base64.b64decode, base64.urlsafe_b64decode):
        try:
            decoded_bytes = decoder(padded)
            # Verify valid UTF-8 and valid JSON
            decoded_json = json.loads(decoded_bytes.decode("utf-8"))
            if isinstance(decoded_json, (dict, list)):
                return decoded_bytes
        except Exception:
            pass

    raise ValueError("Invalid obfuscated payload format")


class PayloadObfuscationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            content_type = request.headers.get("content-type", "")
            if "application/json" in content_type.lower():
                try:
                    body_bytes = await request.body()
                    if body_bytes:
                        try:
                            body_json = json.loads(body_bytes.decode("utf-8"))
                            
                            encoded_target = None
                            if isinstance(body_json, dict):
                                if "payload" in body_json and isinstance(body_json["payload"], str):
                                    encoded_target = body_json["payload"]
                                elif "encrypted_data" in body_json and isinstance(body_json["encrypted_data"], str):
                                    encoded_target = body_json["encrypted_data"]
                            elif isinstance(body_json, str):
                                encoded_target = body_json

                            if encoded_target:
                                decoded_bytes = decode_payload_str(encoded_target)
                                
                                # Replace request._body with decoded bytes for FastAPI route handlers
                                async def receive():
                                    return {"type": "http.request", "body": decoded_bytes, "more_body": False}
                                
                                request._receive = receive
                                request._body = decoded_bytes
                        except Exception:
                            # Not an obfuscated payload or plain JSON, pass through as-is
                            pass
                except Exception as e:
                    logger.debug(f"Payload de-obfuscation skipped/failed: {e}")

        response = await call_next(request)
        return response
