"""
AI assistant service — FastAPI Lambda.

POST /ai/{event_uuid}/chat
  Body: { "messages": [{"role": "user"|"assistant", "content": str}, ...] }
  Returns: { "reply": str }

The service fetches full event context (DB + DynamoDB chat) on every request
and injects it as a system prompt so Claude always has up-to-date information.
"""
import logging
from typing import Annotated

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.auth import get_current_user_sub
from app.context import gather_event_context, build_system_prompt
from app.bedrock import chat as bedrock_chat

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class UnifiedSlashMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path != "/" and path.endswith("/"):
            request.scope["path"] = path.rstrip("/")
        request.scope["scheme"] = "https"
        return await call_next(request)


app = FastAPI(title="cohosted-ai", redirect_slashes=False)
app.add_middleware(UnifiedSlashMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    reply: str


@app.post("/ai/{event_uuid}/chat", response_model=ChatResponse)
def event_chat(
    event_uuid: str,
    body: ChatRequest,
    user_id: Annotated[str, Depends(get_current_user_sub)],
):
    if not body.messages:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="messages cannot be empty")

    # Validate roles
    for msg in body.messages:
        if msg.role not in ("user", "assistant"):
            raise HTTPException(status_code=400, detail=f"Invalid role: {msg.role}")

    # Fetch fresh event context on every request
    try:
        ctx = gather_event_context(event_uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Failed to gather event context: %s", e)
        raise HTTPException(status_code=500, detail="Failed to load event context")

    system_prompt = build_system_prompt(ctx)

    try:
        reply = bedrock_chat(
            system_prompt=system_prompt,
            messages=[{"role": m.role, "content": m.content} for m in body.messages],
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return ChatResponse(reply=reply)


@app.get("/ai/health")
def health():
    return {"status": "ok"}


_mangum_handler = Mangum(app)


def handler(event, context):
    return _mangum_handler(event, context)
