import logging
import uuid

import boto3
from fastapi import UploadFile
from app.core.config import S3_BUCKET, S3_REGION

_s3_client = None


def _get_s3():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client("s3")
    return _s3_client


def upload_file_to_s3(file: UploadFile) -> str:
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"flyers/{uuid.uuid4()}.{file_extension}"

    try:
        _get_s3().upload_fileobj(
            file.file,
            S3_BUCKET,
            unique_filename,
            ExtraArgs={"ContentType": file.content_type},
        )
    except Exception as e:
        logging.error(f"S3 Upload Error: {e}")
        raise e

    return f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{unique_filename}"
