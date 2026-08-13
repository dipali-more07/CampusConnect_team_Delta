"""
app/api/v1/ai.py
==================
AI Chatbot & RAG Assistant API endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.base import get_db
from app.database.deps import get_current_user_optional
from app.models.user import User
from app.services.ai_service import AIService
from app.schemas.ai import AIChatRequest
from app.core.responses import success_response

router = APIRouter()


@router.post("/chat", summary="Interact with CampusConnect AI Chatbot (Role-Personalized RAG & Action Execution)")
async def chat_with_ai(
    data: AIChatRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Sends user query to RAG AI Engine.
    Personalizes response based on user role (Student vs Organizer vs Admin), course, department, and live DB events.
    Supports anonymous guest inquiries as well as logged-in user actions.
    """
    service = AIService(db)
    result = await service.chat(data, current_user)
    return success_response(
        message="AI assistant response generated successfully",
        data=result
    )


@router.get("/quick-actions", summary="Get 1-click Quick Action prompt chips based on user role")
def get_quick_actions(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    Returns role-personalized 1-click prompt chips for the chatbot UI.
    """
    service = AIService(db)
    chips = service.get_quick_action_chips(current_user)
    return success_response(
        message="Quick action chips fetched successfully",
        data=[chip.model_dump() for chip in chips]
    )
