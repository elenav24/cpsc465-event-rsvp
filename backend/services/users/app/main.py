import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from mangum import Mangum
from alembic.config import Config
from alembic import command
from dotenv import load_dotenv
from app.routers import users

load_dotenv()


def run_migrations():
    alembic_cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    alembic_cfg.set_main_option(
        "script_location", os.path.join(os.path.dirname(__file__), "..", "alembic")
    )
    command.upgrade(alembic_cfg, "head")


class UnifiedSlashMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if path != "/" and path.endswith("/"):
            request.scope["path"] = path.rstrip("/")
        request.scope["scheme"] = "https"
        return await call_next(request)


app = FastAPI(redirect_slashes=False, root_path="/users")
app.add_middleware(UnifiedSlashMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/users", tags=["users"])

_mangum_handler = Mangum(app, api_gateway_base_path="/users")


def handler(event, context):
    if event.get("action") == "migrate":
        run_migrations()
        return {"statusCode": 200, "body": "Migrations complete"}
    return _mangum_handler(event, context)
