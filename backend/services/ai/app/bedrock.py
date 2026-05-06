"""
Thin wrapper around Amazon Bedrock's converse API for Claude 3 Haiku.
"""

import json
import logging
import boto3
from botocore.exceptions import ClientError
from app.config import BEDROCK_MODEL_ID, AWS_REGION

logger = logging.getLogger(__name__)

_bedrock = None


def _get_client():
    global _bedrock
    if _bedrock is None:
        _bedrock = boto3.client("bedrock-runtime", region_name=AWS_REGION)
    return _bedrock


def chat(system_prompt: str, messages: list[dict], max_tokens: int = 1024) -> str:
    """
    Call Claude 3 Haiku via Bedrock's converse API.

    messages: list of {"role": "user"|"assistant", "content": str}
    Returns the assistant's reply as a plain string.
    """
    client = _get_client()

    # Bedrock converse API format
    bedrock_messages = [
        {"role": m["role"], "content": [{"text": m["content"]}]} for m in messages
    ]

    try:
        response = client.converse(
            modelId=BEDROCK_MODEL_ID,
            system=[{"text": system_prompt}],
            messages=bedrock_messages,
            inferenceConfig={
                "maxTokens": max_tokens,
                "temperature": 0.7,
            },
        )
        return response["output"]["message"]["content"][0]["text"]
    except ClientError as e:
        logger.error("Bedrock error: %s", e)
        raise RuntimeError(f"Bedrock call failed: {e}") from e
