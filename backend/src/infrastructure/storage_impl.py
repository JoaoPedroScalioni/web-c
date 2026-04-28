import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from uuid import uuid4
from src.infrastructure.config import settings
from src.domain.repositories import StorageRepository

class S3StorageRepository(StorageRepository):
    """Implementação concreta de armazenamento na AWS S3"""
    
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            config=Config(signature_version='s3v4')
        )
        self.bucket = settings.S3_BUCKET_NAME

    def generate_upload_url(self, file_name: str, file_type: str) -> dict:
        extension = file_name.split('.')[-1] if '.' in file_name else 'bin'
        secure_b2b_uuid = str(uuid4())
        object_key = f"elevva-uploads/{secure_b2b_uuid}.{extension}"
        
        try:
            response = self.s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.bucket, 
                    'Key': object_key,
                    'ContentType': file_type
                },
                ExpiresIn=300  
            )
        except ClientError as e:
            raise ValueError(f"Recusa do Gerenciador S3 Bucket: {e}")
            
        return {
            "upload_url": response,
            "file_key": object_key
        }
