"""
Unit tests for app/bedrock.py (OpenRouter backend).

Mocks httpx.Client — no real network calls.
"""

import pytest
from unittest.mock import patch, MagicMock

from app.bedrock import chat

SYSTEM_PROMPT = "You are a helpful assistant."
MESSAGES = [{"role": "user", "content": "What time is the party?"}]


def _make_openrouter_response(text: str) -> MagicMock:
    """Build a minimal OpenRouter chat completions response mock."""
    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": text}}]
    }
    mock_resp.raise_for_status = MagicMock()
    return mock_resp


class TestOpenRouterChat:
    def test_returns_reply_text(self):
        with patch("app.bedrock._get_client") as mock_get:
            client = MagicMock()
            client.post.return_value = _make_openrouter_response("The party is at 7pm!")
            mock_get.return_value = client

            result = chat(SYSTEM_PROMPT, MESSAGES)

        assert result == "The party is at 7pm!"

    def test_passes_system_prompt_as_first_message(self):
        with patch("app.bedrock._get_client") as mock_get:
            client = MagicMock()
            client.post.return_value = _make_openrouter_response("ok")
            mock_get.return_value = client

            chat(SYSTEM_PROMPT, MESSAGES)

            call_kwargs = client.post.call_args.kwargs
            messages = call_kwargs["json"]["messages"]
            assert messages[0] == {"role": "system", "content": SYSTEM_PROMPT}

    def test_passes_user_messages_after_system(self):
        with patch("app.bedrock._get_client") as mock_get:
            client = MagicMock()
            client.post.return_value = _make_openrouter_response("ok")
            mock_get.return_value = client

            chat(SYSTEM_PROMPT, MESSAGES)

            call_kwargs = client.post.call_args.kwargs
            messages = call_kwargs["json"]["messages"]
            assert messages[1] == {"role": "user", "content": "What time is the party?"}

    def test_respects_max_tokens(self):
        with patch("app.bedrock._get_client") as mock_get:
            client = MagicMock()
            client.post.return_value = _make_openrouter_response("ok")
            mock_get.return_value = client

            chat(SYSTEM_PROMPT, MESSAGES, max_tokens=512)

            call_kwargs = client.post.call_args.kwargs
            assert call_kwargs["json"]["max_tokens"] == 512

    def test_multi_turn_conversation(self):
        messages = [
            {"role": "user", "content": "Who is coming?"},
            {"role": "assistant", "content": "Alice and Bob."},
            {"role": "user", "content": "What about Charlie?"},
        ]
        with patch("app.bedrock._get_client") as mock_get:
            client = MagicMock()
            client.post.return_value = _make_openrouter_response(
                "Charlie hasn't RSVPed yet."
            )
            mock_get.return_value = client

            result = chat(SYSTEM_PROMPT, messages)

        assert "Charlie" in result

    def test_raises_runtime_error_on_http_error(self):
        import httpx

        with patch("app.bedrock._get_client") as mock_get:
            client = MagicMock()
            mock_resp = MagicMock()
            mock_resp.status_code = 429
            mock_resp.text = "Rate limited"
            client.post.return_value.raise_for_status.side_effect = (
                httpx.HTTPStatusError("Rate limited", request=MagicMock(), response=mock_resp)
            )
            mock_get.return_value = client

            with pytest.raises(RuntimeError, match="OpenRouter call failed"):
                chat(SYSTEM_PROMPT, MESSAGES)

    def test_client_is_reused_across_calls(self):
        """The httpx client should be cached (lazy singleton)."""
        with patch("app.bedrock._client", None), patch("httpx.Client") as mock_cls:
            mock_instance = MagicMock()
            mock_instance.post.return_value = _make_openrouter_response("ok")
            mock_cls.return_value = mock_instance

            chat(SYSTEM_PROMPT, MESSAGES)
            chat(SYSTEM_PROMPT, MESSAGES)

            # httpx.Client should only be instantiated once
            assert mock_cls.call_count == 1
