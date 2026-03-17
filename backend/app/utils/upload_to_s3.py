import logging

import boto3
from botocore.exceptions import NoCredentialsError
from fastapi import UploadFile
import uuid
from app.core.config import S3_BUCKET, S3_REGION


s3_client = boto3.client('s3')

def upload_file_to_s3(file: UploadFile) -> str:

    file_extension = file.filename.split(".")[-1]
    unique_filename = f"flyers/{uuid.uuid4()}.{file_extension}"
    
    try:
        s3_client.upload_fileobj(
            file.file,
            S3_BUCKET,
            unique_filename,
            ExtraArgs={"ContentType": file.content_type}
        )
    except Exception as e:
        print(f"S3 Upload Error: {str(e)}") 
        logging.error(f"Full Error: {e}")
        raise e
        
    return f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{unique_filename}"

