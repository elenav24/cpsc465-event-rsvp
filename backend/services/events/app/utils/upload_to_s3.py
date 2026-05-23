import logging
import uuid

import boto3
from fastapi import UploadFile
from app.core.config import R2_BUCKET, R2_ENDPOINT_URL, R2_PUBLIC_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY

_s3_client = None


def _get_r2():
    global _s3_client
    if _s3_client is None:
        # R2 is S3-compatible — pass credentials explicitly so boto3 doesn't
        # fall back to the Lambda IAM role, which has no R2 access.
        _s3_client = boto3.client(
            "s3",
            endpoint_url=R2_ENDPOINT_URL,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            region_name="auto",
        )
    return _s3_client


def upload_file_to_s3(file: UploadFile) -> str:
    """Upload a file to Cloudflare R2. Returns the public URL."""
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"flyers/{uuid.uuid4()}.{file_extension}"

    try:
        _get_r2().upload_fileobj(
            file.file,
            R2_BUCKET,
            unique_filename,
            ExtraArgs={"ContentType": file.content_type},
        )
    except Exception as e:
        logging.error(f"R2 Upload Error: {e}")
        raise e

    return f"{R2_PUBLIC_URL.rstrip('/')}/{unique_filename}"
