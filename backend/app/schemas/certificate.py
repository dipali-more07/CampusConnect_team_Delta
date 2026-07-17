"""
app/schemas/certificate.py
Certificate Pydantic schemas.
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class GenerateCertificateRequest(BaseModel):
    event_id: str
    user_id: str


class BulkCertificateRequest(BaseModel):
    event_id: str


class CertificateResponse(BaseModel):
    certificate_id: str
    event_id: str
    user_id: str
    certificate_number: str
    pdf_path: Optional[str] = None
    generated_at: datetime
    event_name: Optional[str] = None
    title: Optional[str] = None
    event_date: Optional[str] = None
    certificate_url: Optional[str] = None
    model_config = {"from_attributes": True}


class VerifyCertificateResponse(BaseModel):
    is_valid: bool
    certificate_number: str
    holder_name: Optional[str] = None
    event_title: Optional[str] = None
    event_date: Optional[datetime] = None
    generated_at: Optional[datetime] = None
