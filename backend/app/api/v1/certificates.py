 
from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os

from app.database.base import get_db
from app.database.deps import get_current_user, require_organizer
from app.services.certificate_service import CertificateService
from app.schemas.certificate import GenerateCertificateRequest, BulkCertificateRequest
from app.core.responses import success_response, paginated_response
from app.core.exceptions import NotFoundException
from app.models.user import User

router = APIRouter()


def _cert_to_dict(cert) -> dict:
    return {
        "certificate_id": cert.certificate_id,
        "event_id": cert.event_id,
        "user_id": cert.user_id,
        "certificate_number": cert.certificate_number,
        "pdf_path": cert.pdf_path,
        "generated_at": cert.generated_at.isoformat(),
        "event_name": cert.event.title if cert.event else None,
        "title": cert.event.title if cert.event else None,
        "event_date": cert.event.event_date.isoformat() if cert.event and cert.event.event_date else (cert.event.start_datetime.date().isoformat() if cert.event else None),
        "certificate_url": cert.certificate_url,
    }


@router.post("/generate", status_code=201, summary="Generate certificate for one user")
async def generate_certificate(
    data: GenerateCertificateRequest,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = CertificateService(db)
    cert = await service.generate_certificate(data.event_id, data.user_id)
    return success_response(message="Certificate generated", data=_cert_to_dict(cert), status_code=201)


@router.post("/generate-bulk", status_code=201, summary="Generate certificates for all attendees")
async def generate_bulk_certificates(
    data: BulkCertificateRequest,
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    service = CertificateService(db)
    certs = await service.generate_bulk_certificates(data.event_id)
    return success_response(
        message=f"{len(certs)} certificates generated successfully",
        data=[_cert_to_dict(c) for c in certs],
        status_code=201
    )


@router.get("/my", summary="My certificates")
def my_certificates(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CertificateService(db)
    certs, total = service.get_user_certificates(current_user.user_id, page=page, size=size)
    return paginated_response(
        message="Your certificates",
        data=[_cert_to_dict(c) for c in certs],
        total=total, page=page, size=size
    )


@router.get("/verify/{certificate_number}", summary="Verify a certificate (public)")
def verify_certificate(
    certificate_number: str,
    db: Session = Depends(get_db),
):
    """
    Anyone can verify a certificate using its number.
    Returns certificate details if valid, or indicates it's fake.
    Used for HR verification, institution verification, etc.
    """
    service = CertificateService(db)
    cert = service.verify_certificate(certificate_number)

    if not cert:
        return success_response(
            message="Certificate NOT found. This certificate may be invalid.",
            data={"is_valid": False, "certificate_number": certificate_number}
        )

    return success_response(
        message="Certificate is valid",
        data={
            "is_valid": True,
            "certificate_number": cert.certificate_number,
            "event_id": cert.event_id,
            "user_id": cert.user_id,
            "generated_at": cert.generated_at.isoformat(),
        }
    )


@router.get("/download/{certificate_number}", summary="Download certificate PDF")
def download_certificate(
    certificate_number: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CertificateService(db)
    cert = service.verify_certificate(certificate_number)

    if not cert:
        raise NotFoundException(f"Certificate {certificate_number} not found")

    if not cert.pdf_path or not os.path.exists(cert.pdf_path):
        raise NotFoundException("Certificate PDF file not found on server")

    # Return the actual PDF file as a download
    return FileResponse(
        path=cert.pdf_path,
        media_type="application/pdf",
        filename=f"certificate_{certificate_number}.pdf",
    )


import json

def _get_templates_file_path() -> str:
    os.makedirs("uploads", exist_ok=True)
    return "uploads/certificate_templates.json"

def _read_templates() -> list:
    path = _get_templates_file_path()
    if not os.path.exists(path):
        default_templates = [
            {
                "template_id": "template_classic",
                "name": "Classic Navy",
                "background_image": "/assets/templates/classic.png",
                "font_color": "#1a237e",
                "title_font_size": 36,
                "body_font_size": 14,
                "is_active": True,
                "organisation_name": "State University",
                "certificate_title": "Certificate of Participation",
                "background_gradient_from": "#0f172a",
                "background_gradient_mid": "#1e1b4b",
                "background_gradient_to": "#311042",
                "accent_color": "#6366f1",
                "border_style": "none",
                "font_family": "Manrope",
                "show_logo": True,
                "show_signatures": True
            }
        ]
        with open(path, "w") as f:
            json.dump(default_templates, f, indent=4)
        return default_templates
    try:
        with open(path, "r") as f:
            return json.load(f)
    except Exception:
        return []

def _write_templates(templates: list) -> None:
    path = _get_templates_file_path()
    with open(path, "w") as f:
        json.dump(templates, f, indent=4)


@router.get("/", summary="List all certificates (Admin/Organizer only)")
def list_all_certificates(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(require_organizer),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * size
    from sqlalchemy import select, func
    from app.models.certificate import Certificate
    certs = db.execute(select(Certificate).offset(skip).limit(size)).scalars().all()
    total = db.execute(select(func.count()).select_from(Certificate)).scalar() or 0
    return paginated_response(
        message="All certificates",
        data=[_cert_to_dict(c) for c in certs],
        total=total, page=page, size=size
    )


@router.get("/templates", summary="Get certificate design templates (Admin/Organizer only)")
def get_templates(
    current_user: User = Depends(require_organizer),
):
    templates = _read_templates()
    return success_response(message="Certificate templates fetched", data=templates)


from pydantic import BaseModel, Field
from typing import Optional

class DesignTemplateRequest(BaseModel):
    template_id: Optional[str] = None
    name: str
    background_image: Optional[str] = None
    font_color: Optional[str] = "#1e293b"
    title_font_size: Optional[int] = 36
    body_font_size: Optional[int] = 14
    is_active: Optional[bool] = False
    
    # Custom design template fields from UI mockup
    organisation_name: Optional[str] = "State University"
    certificate_title: Optional[str] = "Certificate of Participation"
    background_gradient_from: Optional[str] = "#0f172a"
    background_gradient_mid: Optional[str] = "#1e1b4b"
    background_gradient_to: Optional[str] = "#311042"
    accent_color: Optional[str] = "#6366f1"
    border_style: Optional[str] = "none" # none, thin, thick, double
    font_family: Optional[str] = "Manrope"
    show_logo: Optional[bool] = True
    show_signatures: Optional[bool] = True


@router.post("/templates", summary="Create or update certificate design template (Admin/Organizer only)")
def design_template(
    data: DesignTemplateRequest,
    current_user: User = Depends(require_organizer),
):
    templates = _read_templates()
    
    import uuid
    t_id = data.template_id or f"template_{uuid.uuid4().hex[:12]}"
    
    if data.is_active:
        for t in templates:
            t["is_active"] = False
            
    existing = next((t for t in templates if t["template_id"] == t_id), None)
    
    template_dict = {
        "template_id": t_id,
        "name": data.name,
        "background_image": data.background_image or "",
        "font_color": data.font_color,
        "title_font_size": data.title_font_size,
        "body_font_size": data.body_font_size,
        "is_active": data.is_active or False,
        "organisation_name": data.organisation_name,
        "certificate_title": data.certificate_title,
        "background_gradient_from": data.background_gradient_from,
        "background_gradient_mid": data.background_gradient_mid,
        "background_gradient_to": data.background_gradient_to,
        "accent_color": data.accent_color,
        "border_style": data.border_style,
        "font_family": data.font_family,
        "show_logo": data.show_logo if data.show_logo is not None else True,
        "show_signatures": data.show_signatures if data.show_signatures is not None else True,
    }

    if existing:
        existing.update(template_dict)
    else:
        templates.append(template_dict)
        
    _write_templates(templates)
    return success_response(message="Template designed/saved successfully", data={"template_id": t_id})

