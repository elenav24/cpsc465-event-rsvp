import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost/dbname",
)
DEBUG = os.getenv("DEBUG", "").lower() in ("true", "1", "yes")
ENV = os.getenv("ENV", "production")
COGNITO_REGION = os.getenv("COGNITO_REGION", "us-east-1")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")

# Cloudflare R2 (S3-compatible)
R2_BUCKET = os.getenv("R2_BUCKET", "")
R2_ENDPOINT_URL = os.getenv("R2_ENDPOINT_URL", "")  # https://<account_id>.r2.cloudflarestorage.com
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "")       # https://pub-<hash>.r2.dev or custom domain
