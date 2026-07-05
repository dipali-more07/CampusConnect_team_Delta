"""
app/api/v1/router.py
=====================
Aggregates all routers into one APIRouter.
This is imported in main.py and mounted at /api/v1/
"""
from fastapi import APIRouter

from app.api.v1 import auth, users, colleges, clubs, organizers, events, registrations, attendance, certificates, notifications, analytics, search

# Create the main v1 router
api_router = APIRouter()

# Include each module's router with its prefix and tag
# prefix: URL path prefix for all routes in that router
# tags: Groups routes in Swagger documentation
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(colleges.router, prefix="/colleges", tags=["Colleges"])
api_router.include_router(clubs.router, prefix="/clubs", tags=["Clubs"])
api_router.include_router(organizers.router, prefix="/organizers", tags=["Organizers"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(registrations.router, prefix="/registrations", tags=["Registrations"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["Certificates"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
