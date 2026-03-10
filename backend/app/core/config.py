import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost/dbname",
)
DEBUG = os.getenv("DEBUG", "").lower() in ("true", "1", "yes")
ENV = os.getenv("ENV", "production")
