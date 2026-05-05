"""
Unit tests for app/context.py.

All DB and DynamoDB calls are mocked — no real infrastructure needed.
"""
from unittest.mock import patch, MagicMock, call
from datetime import datetime

from app.context import build_system_prompt
from tests.conftest import MOCK_EVENT_CONTEXT, TEST_USER_SUB


# ── build_system_prompt ───────────────────────────────────────────────────────

class TestBuildSystemPrompt:
    def test_contains_event_title(self):
        prompt = build_system_prompt(MOCK_EVENT_CONTEXT)
        assert "Test Party" in prompt

    def test_contains_location(self):
        prompt = build_system_prompt(MOCK_EVENT_CONTEXT)
        assert "123 Test St" in prompt

    def test_contains_description(self):
        prompt = build_system_prompt(MOCK_EVENT_CONTEXT)
        assert "A fun test party" in prompt

    def test_contains_start_dt(self):
        prompt = build_system_prompt(MOCK_EVENT_CONTEXT)
        assert "2026-06-01" in prompt

    def test_attendance_section(self):
        prompt = build_system_prompt(MOCK_EVENT_CONTEXT)
        assert "Going" in prompt
        assert "Alice" in prompt
        assert "Maybe" in prompt
        assert "Bob" in prompt

    def test_polls_section(self):
        prompt = build_system_prompt(MOCK_EVENT_CONTEXT)
        assert "What time works?" in prompt
        assert "6pm" in prompt
        assert "7pm" in prompt
        # Vote counts
        assert "2" in prompt
        assert "1" in prompt

    def test_potluck_section(self):
        prompt = build_system_prompt(MOCK_EVENT_CONTEXT)
        assert "Chips" in prompt
        assert "Alice" in prompt  # claimer name

    def test_tasks_section(self):
        prompt = build_system_prompt(MOCK_EVENT_CONTEXT)
        assert "Buy ice" in prompt
        assert "Alice" in prompt

    def test_announcements_section(self):
        prompt = build_system_prompt(MOCK_EVENT_CONTEXT)
        assert "Bring your own drinks!" in prompt

    def test_chat_messages_section(self):
        prompt = build_system_prompt(MOCK_EVENT_CONTEXT)
        assert "Can't wait!" in prompt
        assert "Me too!" in prompt

    def test_no_polls_skips_section(self):
        ctx = {**MOCK_EVENT_CONTEXT, "polls": []}
        prompt = build_system_prompt(ctx)
        assert "## Polls" not in prompt

    def test_no_potluck_skips_section(self):
        ctx = {**MOCK_EVENT_CONTEXT, "potluck": []}
        prompt = build_system_prompt(ctx)
        assert "## Potluck" not in prompt

    def test_no_tasks_skips_section(self):
        ctx = {**MOCK_EVENT_CONTEXT, "tasks": []}
        prompt = build_system_prompt(ctx)
        assert "## Tasks" not in prompt

    def test_no_chat_skips_section(self):
        ctx = {**MOCK_EVENT_CONTEXT, "chat_messages": []}
        prompt = build_system_prompt(ctx)
        assert "## Recent Chat Messages" not in prompt

    def test_closed_poll_shows_status(self):
        ctx = {
            **MOCK_EVENT_CONTEXT,
            "polls": [{**MOCK_EVENT_CONTEXT["polls"][0], "is_closed": True}],
        }
        prompt = build_system_prompt(ctx)
        assert "Closed" in prompt

    def test_open_poll_shows_status(self):
        prompt = build_system_prompt(MOCK_EVENT_CONTEXT)
        assert "Open" in prompt

    def test_completed_task_shows_checkmark(self):
        ctx = {
            **MOCK_EVENT_CONTEXT,
            "tasks": [{**MOCK_EVENT_CONTEXT["tasks"][0], "is_completed": True}],
        }
        prompt = build_system_prompt(ctx)
        assert "✓" in prompt

    def test_incomplete_task_shows_circle(self):
        prompt = build_system_prompt(MOCK_EVENT_CONTEXT)
        assert "○" in prompt

    def test_system_role_instruction_present(self):
        prompt = build_system_prompt(MOCK_EVENT_CONTEXT)
        assert "AI assistant" in prompt.lower() or "assistant" in prompt.lower()


# ── gather_event_context ──────────────────────────────────────────────────────

class TestGatherEventContext:
    """
    Tests for gather_event_context. We mock the SQLAlchemy engine and
    DynamoDB table so no real infrastructure is needed.
    """

    def _make_mock_db(self, event_id=1, event_uuid="test-uuid"):
        """Build a mock Session that returns sensible rows for each query."""
        session = MagicMock()

        def execute_side_effect(stmt, params=None):
            sql = str(stmt)
            mapping = MagicMock()

            if "events" in sql and "uuid" in sql:
                row = MagicMock()
                row.items.return_value = [
                    ("id", event_id), ("uuid", event_uuid), ("title", "Test"),
                    ("description", None), ("location", None),
                    ("start_dt", None), ("end_dt", None),
                    ("recurrence_rule", None), ("recurrence_end_dt", None),
                ]
                mapping.first.return_value = row
            elif "event_members" in sql:
                mapping.return_value = iter([])
            elif "rsvps" in sql:
                mapping.return_value = iter([])
            elif "polls" in sql and "poll_options" not in sql and "poll_votes" not in sql:
                mapping.return_value = iter([])
            elif "poll_options" in sql:
                mapping.return_value = iter([])
            elif "poll_votes" in sql:
                mapping.return_value = iter([])
            elif "potluck_items" in sql:
                mapping.return_value = iter([])
            elif "potluck_claims" in sql:
                mapping.return_value = iter([])
            elif "tasks" in sql:
                mapping.return_value = iter([])
            elif "announcements" in sql:
                mapping.return_value = iter([])
            else:
                mapping.return_value = iter([])

            result = MagicMock()
            result.mappings.return_value = mapping
            return result

        session.execute.side_effect = execute_side_effect
        return session

    def test_raises_value_error_for_missing_event(self):
        from app.context import gather_event_context

        with patch("app.context._get_engine") as mock_engine:
            mock_conn = MagicMock()
            mock_engine.return_value = mock_conn

            mock_session = MagicMock()
            mock_result = MagicMock()
            mock_result.mappings.return_value.first.return_value = None
            mock_session.execute.return_value = mock_result
            mock_session.__enter__ = lambda s: mock_session
            mock_session.__exit__ = MagicMock(return_value=False)

            with patch("app.context.Session", return_value=mock_session):
                import pytest
                with pytest.raises(ValueError, match="not found"):
                    gather_event_context("nonexistent-uuid")

    def test_returns_expected_keys(self):
        from app.context import gather_event_context

        with patch("app.context._get_engine"), \
             patch("app.context.Session") as MockSession, \
             patch("app.context.MESSAGES_TABLE", ""), \
             patch("app.context._get_msg_table"):

            mock_session = MagicMock()
            mock_session.__enter__ = lambda s: mock_session
            mock_session.__exit__ = MagicMock(return_value=False)
            MockSession.return_value = mock_session

            # Event row
            event_row = MagicMock()
            event_row.items.return_value = [
                ("id", 1), ("uuid", "test-uuid"), ("title", "T"),
                ("description", None), ("location", None),
                ("start_dt", None), ("end_dt", None),
                ("recurrence_rule", None), ("recurrence_end_dt", None),
            ]

            def execute_side_effect(stmt, params=None):
                result = MagicMock()
                mappings = MagicMock()
                sql = str(stmt)
                if "events" in sql and "uuid" in sql:
                    mappings.first.return_value = event_row
                else:
                    mappings.__iter__ = lambda s: iter([])
                result.mappings.return_value = mappings
                return result

            mock_session.execute.side_effect = execute_side_effect

            ctx = gather_event_context("test-uuid")

        expected_keys = {"event", "members", "rsvps", "polls", "potluck", "tasks", "announcements", "chat_messages", "name_map"}
        assert expected_keys.issubset(ctx.keys())

    def test_chat_messages_empty_when_no_table(self):
        from app.context import gather_event_context

        with patch("app.context._get_engine"), \
             patch("app.context.Session") as MockSession, \
             patch("app.context.MESSAGES_TABLE", ""):

            mock_session = MagicMock()
            mock_session.__enter__ = lambda s: mock_session
            mock_session.__exit__ = MagicMock(return_value=False)
            MockSession.return_value = mock_session

            event_row = MagicMock()
            event_row.items.return_value = [
                ("id", 1), ("uuid", "u"), ("title", "T"),
                ("description", None), ("location", None),
                ("start_dt", None), ("end_dt", None),
                ("recurrence_rule", None), ("recurrence_end_dt", None),
            ]

            def execute_side_effect(stmt, params=None):
                result = MagicMock()
                mappings = MagicMock()
                if "events" in str(stmt) and "uuid" in str(stmt):
                    mappings.first.return_value = event_row
                else:
                    mappings.__iter__ = lambda s: iter([])
                result.mappings.return_value = mappings
                return result

            mock_session.execute.side_effect = execute_side_effect

            ctx = gather_event_context("u")

        assert ctx["chat_messages"] == []
