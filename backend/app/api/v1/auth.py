 
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import get_current_user
from app.services.auth_service import AuthService
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse,
    RefreshTokenRequest, ForgotPasswordRequest,
    ResetPasswordRequest, ChangePasswordRequest,
    VerifyEmailRequest, ResendCodeRequest
)
from app.schemas.user import UserWithProfileResponse
from app.core.responses import success_response
from app.models.user import User

router = APIRouter()


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account. Returns user info (no password). Default role is 'participant'.",
)
async def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    
    service = AuthService(db)
    user = await service.register(data)
    return success_response(
        message="Registration successful. Please check your email to verify your account.",
        data={"user_id": user.user_id, "email": user.email, "role": user.role},
        status_code=201,
    )


@router.post(
    "/login",
    summary="Login and get tokens",
    description="Login with email and password. Returns JWT access and refresh tokens.",
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    tokens = service.login(data)
    return success_response(
        message="Login successful",
        data=tokens,
    )


@router.post(
    "/logout",
    summary="Logout (revoke refresh token)",
    description="Revoke the refresh token. Access token will expire naturally.",
)
def logout(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    service.logout(data.refresh_token)
    return success_response(message="Logged out successfully")


@router.post(
    "/refresh",
    summary="Get new access token",
    description="Use refresh token to get a new access token without logging in again.",
)
def refresh_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    tokens = service.refresh_access_token(data.refresh_token)
    return success_response(
        message="Token refreshed successfully",
        data=tokens,
    )


@router.post(
    "/forgot-password",
    summary="Request password reset",
    description="Send a password reset link to the user's email.",
)
async def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    base_url = str(request.base_url)
    await service.forgot_password(data.email, base_url)
    # Always return success (don't reveal if email exists)
    return success_response(
        message="If an account with this email exists, a reset link has been sent."
    )


@router.post(
    "/reset-password",
    summary="Reset password using token",
    description="Set a new password using the reset token received in email.",
)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    service.reset_password(data.token, data.new_password)
    return success_response(message="Password reset successfully. Please login with your new password.")


@router.post(
    "/change-password",
    summary="Change password (logged in)",
    description="Change password for the currently logged in user.",
)
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    service.change_password(current_user, data.current_password, data.new_password)
    return success_response(message="Password changed successfully. Please login again.")


@router.get(
    "/me",
    summary="Get current user info",
    description="Returns the profile of the currently logged in user.",
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    Returns the current user's info.
    No DB query needed - user is already loaded by get_current_user dependency.
    """
    profile_data = None
    if current_user.profile:
        profile_data = {
            "profile_id": current_user.profile.profile_id,
            "full_name": current_user.profile.full_name,
            "phone": current_user.profile.phone,
            "department": current_user.profile.department,
            "course": current_user.profile.course,
            "year_of_study": current_user.profile.year_of_study,
            "bio": current_user.profile.bio,
            "profile_picture": current_user.profile.profile_picture,
            "college_id": current_user.profile.college_id,
            "gender": current_user.profile.gender.value if hasattr(current_user.profile.gender, "value") else current_user.profile.gender,
        }
    return success_response(
        message="User profile fetched successfully",
        data={
            "user_id": current_user.user_id,
            "email": current_user.email,
            "role": current_user.role,
            "is_active": current_user.is_active,
            "is_email_verified": current_user.is_email_verified,
            "created_at": current_user.created_at.isoformat(),
            "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
            "full_name": current_user.full_name,
            "mobile": current_user.mobile,
            "phone": current_user.mobile,
            "college_name": current_user.college_name,
            "department": current_user.department,
            "course": current_user.course,
            "gender": current_user.gender,
            "profile_image": current_user.profile_image,
            "profile_picture": current_user.profile_image,
            "year_of_study": current_user.profile.year_of_study if current_user.profile else None,
            "bio": current_user.profile.bio if current_user.profile else None,
            "college_id": current_user.profile.college_id if current_user.profile else None,
            "profile": profile_data,
        },
    )


@router.post(
    "/verify-email",
    summary="Verify email using code",
    description="Verify a newly registered user's email using the 6-digit OTP code sent to their email.",
)
def verify_email(
    data: VerifyEmailRequest,
    db: Session = Depends(get_db)
):
    service = AuthService(db)
    service.verify_email(data.email, data.code)
    return success_response(message="Email verified successfully. You can now login.")


@router.post(
    "/resend-code",
    summary="Resend verification code",
    description="Resend a new 6-digit OTP code to the user's email.",
)
async def resend_code(
    data: ResendCodeRequest,
    db: Session = Depends(get_db)
):
    service = AuthService(db)
    await service.resend_verification_code(data.email)
    return success_response(message="Verification code resent successfully. Please check your email.")
