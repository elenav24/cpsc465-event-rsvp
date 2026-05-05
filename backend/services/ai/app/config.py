import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
COGNITO_REGION = os.getenv("COGNITO_REGION", "us-east-1")
COGNITO_USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
# AWS_REGION is injected automatically by the Lambda runtime — don't set it manually
AWS_REGION = os.getenv("AWS_REGION", os.getenv("COGNITO_REGION", "us-east-1"))
MESSAGES_TABLE = os.getenv("MESSAGES_TABLE", "")

# Claude 3.5 Haiku on Bedrock — can be overridden via BEDROCK_MODEL_ID env var
BEDROCK_MODEL_ID = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-5-haiku-20241022-v1:0")
