"""
Thin shim — re-exports broadcast_event_update from the chat service module.
The events service Lambda shares the same deployment package as the chat
service, so we can import directly. If the chat module is unavailable
(e.g. local dev without DynamoDB), the call is silently swallowed.
"""

import logging

logger = logging.getLogger(__name__)


def broadcast_event_update(event_id, kind: str, action: str, data: dict) -> None:
    try:
        from app.broadcast import broadcast_event_update as _broadcast  # type: ignore
        _broadcast(event_id, kind, action, data)
    except ImportError:
        # Chat module not available in this environment — try direct import
        try:
            import sys, os
            chat_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "chat")
            if chat_path not in sys.path:
                sys.path.insert(0, chat_path)
            from app.broadcast import broadcast_event_update as _b  # type: ignore
            _b(event_id, kind, action, data)
        except Exception as e:
            logger.debug("broadcast unavailable: %s", e)
    except Exception as e:
        logger.warning("broadcast_event_update failed: %s", e)
