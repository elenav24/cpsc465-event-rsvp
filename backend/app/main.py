from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.routers import users, events
from dotenv import load_dotenv
from mangum import Mangum
from app.deps.db import engine
from starlette.middleware.base import BaseHTTPMiddleware
from alembic.config import Config
from alembic import command
import os

load_dotenv()


def run_migrations():
    alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    alembic_cfg.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "..", "alembic"))
    command.upgrade(alembic_cfg, "head")


class UnifiedSlashMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path != "/" and path.endswith("/"):
            new_path = path.rstrip("/")
            request.scope["path"] = new_path
            
        request.scope["scheme"] = "https"
        
        return await call_next(request)

app = FastAPI(redirect_slashes=False)
app.add_middleware(UnifiedSlashMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Change this later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(events.router, prefix="/events", tags=["events"])

_mangum_handler = Mangum(app)

def handler(event, context):
    if event.get("action") == "migrate":
        run_migrations()
        return {"statusCode": 200, "body": "Migrations complete"}
    return _mangum_handler(event, context)
