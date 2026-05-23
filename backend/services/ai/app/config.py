import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
COGNITO_REGION = os.getenv("COGNITO_REGION", "us-east-1")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
AWS_REGION = os.getenv("AWS_REGION", os.getenv("COGNITO_REGION", "us-east-1"))
MESSAGES_TABLE = os.getenv("MESSAGES_TABLE", "")

# OpenRouter — free models available (e.g. meta-llama/llama-3.1-8b-instruct:free)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free"
)
