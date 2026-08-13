"""
app/tests/test_ai.py
====================
Unit tests for AI Chatbot and RAG Assistant endpoints.
"""

import pytest
from app.tests.conftest import auth_headers


class TestAIChatbot:
    def test_get_quick_actions_student(self, client, participant_token):
        response = client.get("/api/v1/ai/quick-actions", headers=auth_headers(participant_token))
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
        assert len(data["data"]) >= 1
        assert any(chip["category"] == "student" for chip in data["data"])

    def test_get_quick_actions_organizer(self, client, organizer_token):
        response = client.get("/api/v1/ai/quick-actions", headers=auth_headers(organizer_token))
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert any(chip["category"] == "organizer" for chip in data["data"])

    def test_ai_chat_student_event_recommendation(self, client, participant_token):
        response = client.post(
            "/api/v1/ai/chat",
            json={"message": "Recommend top hackathons for my course"},
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "reply" in data["data"]
        assert data["data"]["role"] == "assistant"
        assert "action_chips" in data["data"]

    def test_ai_chat_student_certificates_inquiry(self, client, participant_token):
        response = client.post(
            "/api/v1/ai/chat",
            json={"message": "How do I download and verify my certificates?"},
            headers=auth_headers(participant_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Certificate" in data["data"]["reply"] or "badge" in data["data"]["reply"].lower()

    def test_ai_chat_organizer_draft_description(self, client, organizer_token):
        response = client.post(
            "/api/v1/ai/chat",
            json={"message": "Help me write a draft event description for AI Hackathon"},
            headers=auth_headers(organizer_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "description" in data["data"]["reply"].lower() or "hackathon" in data["data"]["reply"].lower()
