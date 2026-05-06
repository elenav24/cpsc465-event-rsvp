"""
Broadcast utility for the users service — same pattern as events service.
"""

import logging

logger = logging.getLogger(__name__)


def broadcast_event_update(event_id, kind: str, action: str, data: dict) -> None:
    try:
        import sys, os

        chat_path = os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "..", "chat"
        )
        if chat_path not in sys.path:
            sys.path.insert(0, chat_path)
        from app.broadcast import broadcast_event_update as _b  # type: ignore

        _b(event_id, kind, action, data)
    except Exception as e:
        logger.debug("broadcast unavailable: %s", e)
