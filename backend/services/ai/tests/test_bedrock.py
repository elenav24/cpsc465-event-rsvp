"""
Unit tests for app/bedrock.py.

Mocks the boto3 bedrock-runtime client — no real AWS calls.
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from botocore.exceptions import ClientError

from app.bedrock import chat


SYSTEM_PROMPT = "You are a helpful assistant."
MESSAGES = [{"role": "user", "content": "What time is the party?"}]


def _make_bedrock_response(text: str) -> dict:
    """Build a minimal Bedrock converse API response."""
    return {
        "output": {
            "message": {
                "content": [{"text": text}]
            }
        }
    }


class TestBedrockChat:
    def test_returns_reply_text(self):
        with patch("app.bedrock._get_client") as mock_get:
            client = MagicMock()
            client.converse.return_value = _make_bedrock_response("The party is at 7pm!")
            mock_get.return_value = client

            result = chat(SYSTEM_PROMPT, MESSAGES)

        assert result == "The party is at 7pm!"

    def test_passes_system_prompt(self):
        with patch("app.bedrock._get_client") as mock_get:
            client = MagicMock()
            client.converse.return_value = _make_bedrock_response("ok")
            mock_get.return_value = client

            chat(SYSTEM_PROMPT, MESSAGES)

            call_kwargs = client.converse.call_args.kwargs
            assert call_kwargs["system"] == [{"text": SYSTEM_PROMPT}]

    def test_passes_messages_in_correct_format(self):
        with patch("app.bedrock._get_client") as mock_get:
            client = MagicMock()
            client.converse.return_value = _make_bedrock_response("ok")
            mock_get.return_value = client

            chat(SYSTEM_PROMPT, MESSAGES)

            call_kwargs = client.converse.call_args.kwargs
            assert call_kwargs["messages"] == [
                {"role": "user", "content": [{"text": "What time is the party?"}]}
            ]

    def test_passes_correct_model_id(self):
        from app.config import BEDROCK_MODEL_ID
        assert "claude-haiku-4-5" in BEDROCK_MODEL_ID
        with patch("app.bedrock._get_client") as mock_get:
            client = MagicMock()
            client.converse.return_value = _make_bedrock_response("ok")
            mock_get.return_value = client

            chat(SYSTEM_PROMPT, MESSAGES)

            call_kwargs = client.converse.call_args.kwargs
            assert call_kwargs["modelId"] == BEDROCK_MODEL_ID

    def test_respects_max_tokens(self):
        with patch("app.bedrock._get_client") as mock_get:
            client = MagicMock()
            client.converse.return_value = _make_bedrock_response("ok")
            mock_get.return_value = client

            chat(SYSTEM_PROMPT, MESSAGES, max_tokens=512)

            call_kwargs = client.converse.call_args.kwargs
            assert call_kwargs["inferenceConfig"]["maxTokens"] == 512

    def test_multi_turn_conversation(self):
        messages = [
            {"role": "user", "content": "Who is coming?"},
            {"role": "assistant", "content": "Alice and Bob."},
            {"role": "user", "content": "What about Charlie?"},
        ]
        with patch("app.bedrock._get_client") as mock_get:
            client = MagicMock()
            client.converse.return_value = _make_bedrock_response("Charlie hasn't RSVPed yet.")
            mock_get.return_value = client

            result = chat(SYSTEM_PROMPT, messages)

        assert "Charlie" in result

    def test_raises_runtime_error_on_client_error(self):
        with patch("app.bedrock._get_client") as mock_get:
            client = MagicMock()
            client.converse.side_effect = ClientError(
                {"Error": {"Code": "AccessDeniedException", "Message": "Not authorized"}},
                "Converse",
            )
            mock_get.return_value = client

            with pytest.raises(RuntimeError, match="Bedrock call failed"):
                chat(SYSTEM_PROMPT, MESSAGES)

    def test_client_is_reused_across_calls(self):
        """The boto3 client should be cached (lazy singleton)."""
        with patch("app.bedrock._bedrock", None), \
             patch("boto3.client") as mock_boto:
            mock_boto_client = MagicMock()
            mock_boto_client.converse.return_value = _make_bedrock_response("ok")
            mock_boto.return_value = mock_boto_client

            chat(SYSTEM_PROMPT, MESSAGES)
            chat(SYSTEM_PROMPT, MESSAGES)

            # boto3.client should only be called once
            assert mock_boto.call_count == 1
