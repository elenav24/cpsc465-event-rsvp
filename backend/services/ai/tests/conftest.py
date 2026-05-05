"""
Shared fixtures for the AI service tests.

Strategy:
  - The HTTP endpoint tests use FastAPI's TestClient with dependency overrides
    to bypass JWT auth.
  - context.py and bedrock.py are tested with unittest.mock to avoid real
    DB/DynamoDB/Bedrock calls.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.auth import get_current_user_sub

TEST_USER_SUB = "test-user-ai-sub"

# ── Minimal event context returned by mocked gather_event_context ─────────────
MOCK_EVENT_CONTEXT = {
    "event": {
        "id": 1,
        "uuid": "test-event-uuid",
        "title": "Test Party",
        "description": "A fun test party",
        "location": "123 Test St",
        "start_dt": "2026-06-01T18:00:00",
        "end_dt": "2026-06-01T22:00:00",
        "recurrence_rule": None,
        "recurrence_end_dt": None,
    },
    "members": [
        {"user_id": TEST_USER_SUB, "role": "host", "display_name": "Alice", "joined_at": "2026-01-01T00:00:00"},
        {"user_id": "other-sub", "role": "attendee", "display_name": "Bob", "joined_at": "2026-01-02T00:00:00"},
    ],
    "rsvps": [
        {"user_id": TEST_USER_SUB, "status": "yes", "guest_count": 0, "name": "Alice"},
        {"user_id": "other-sub", "status": "maybe", "guest_count": 1, "name": "Bob"},
    ],
    "polls": [
        {
            "id": 1,
            "question": "What time works?",
            "allow_multi_select": False,
            "is_anonymous": False,
            "is_closed": False,
            "closes_at": None,
            "options": [
                {"id": 1, "text": "6pm", "display_order": 0, "vote_count": 2},
                {"id": 2, "text": "7pm", "display_order": 1, "vote_count": 1},
            ],
        }
    ],
    "potluck": [
        {"id": 1, "name": "Chips", "description": None, "quantity_needed": 2, "claims": [TEST_USER_SUB]},
    ],
    "tasks": [
        {
            "title": "Buy ice",
            "description": None,
            "assigned_to": TEST_USER_SUB,
            "assigned_to_name": "Alice",
            "due_date": None,
            "is_completed": False,
        }
    ],
    "announcements": [
        {"body": "Bring your own drinks!", "created_at": "2026-05-01T10:00:00"},
    ],
    "chat_messages": [
        {"sender": "Alice", "message": "Can't wait!", "time": "2026-05-01T11:00:00"},
        {"sender": "Bob", "message": "Me too!", "time": "2026-05-01T11:01:00"},
    ],
    "name_map": {TEST_USER_SUB: "Alice", "other-sub": "Bob"},
}


@pytest.fixture()
def client():
    """TestClient with auth bypassed."""
    app.dependency_overrides[get_current_user_sub] = lambda: TEST_USER_SUB
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()
