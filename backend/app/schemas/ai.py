"""
app/schemas/ai.py
===================
Pydantic request and response schemas for AI Chatbot and RAG Assistant.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the speaker: 'user' or 'assistant'")
    content: str = Field(..., description="Text content of the message")


class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User's query or prompt for AI assistant")
    conversation_history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation turns")


class QuickActionChip(BaseModel):
    id: str
    label: str
    prompt: str
    category: str


class AIChatResponseData(BaseModel):
    reply: str
    role: str
    action_chips: List[QuickActionChip] = []
    recommended_events: List[Dict[str, Any]] = []
    user_context: Dict[str, Any] = {}
