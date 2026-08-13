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
    message: Optional[str] = Field(None, description="User's query or prompt for AI assistant")
    prompt: Optional[str] = Field(None, description="Alternative field for user query")
    query: Optional[str] = Field(None, description="Alternative field for user query")
    text: Optional[str] = Field(None, description="Alternative field for user query")
    content: Optional[str] = Field(None, description="Alternative field for user query")
    conversation_history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation turns")

    def get_query(self) -> str:
        for val in [self.message, self.prompt, self.query, self.text, self.content]:
            if val and isinstance(val, str) and val.strip():
                return val.strip()
        return "Hello"


class QuickActionChip(BaseModel):
    id: str
    label: str
    prompt: str
    category: str


class AIChatResponseData(BaseModel):
    reply: str
    speech_text: Optional[str] = Field("", description="Clean plain-text version for Web SpeechSynthesis audio reading")
    role: str
    action_chips: List[QuickActionChip] = []
    recommended_events: List[Dict[str, Any]] = []
    user_context: Dict[str, Any] = {}
