"""
app/api/v1/certificates.py
Certificate endpoints.
"""
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
