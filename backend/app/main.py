from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.routers import users, events
from dotenv import load_dotenv
from mangum import Mangum
from app.deps.db import engine
from starlette.middleware.base import BaseHTTPMiddleware

load_dotenv()


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

handler = Mangum(app)



@app.get("/health/db")
def test_db_connection():
    try:
        # We use 'with' to ensure the connection closes immediately
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
