"""
Thin wrapper around OpenRouter's chat completions API (OpenAI-compatible).
"""

import logging
import httpx
from app.config import OPENROUTER_API_KEY, OPENROUTER_MODEL

logger = logging.getLogger(__name__)

_client = None


def _get_client() -> httpx.Client:
    global _client
    if _client is None:
        _client = httpx.Client(
            base_url="https://openrouter.ai/api/v1",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "HTTP-Referer": "https://cohosted.cloud",
                "X-Title": "Cohosted",
            },
            timeout=30.0,
        )
    return _client


def chat(system_prompt: str, messages: list[dict], max_tokens: int = 1024) -> str:
    """
    Call an LLM via OpenRouter's chat completions API.

    messages: list of {"role": "user"|"assistant", "content": str}
    Returns the assistant's reply as a plain string.
    """
    client = _get_client()

    openrouter_messages = [{"role": "system", "content": system_prompt}] + [
        {"role": m["role"], "content": m["content"]} for m in messages
    ]

    try:
        response = client.post(
            "/chat/completions",
            json={
                "model": OPENROUTER_MODEL,
                "messages": openrouter_messages,
                "max_tokens": max_tokens,
                "temperature": 0.7,
            },
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as e:
        logger.error("OpenRouter HTTP error: %s — %s", e.response.status_code, e.response.text)
        raise RuntimeError(f"OpenRouter call failed: {e}") from e
    except Exception as e:
        logger.error("OpenRouter error: %s", e)
        raise RuntimeError(f"OpenRouter call failed: {e}") from e
