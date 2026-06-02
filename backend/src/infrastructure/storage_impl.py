import os
import boto3
import botocore.exceptions
from uuid import uuid4
from src.domain.repositories import StorageRepository
from fastapi import HTTPException

class MinioStorageRepository(StorageRepository):
    """
    Implementação concreta do contrato de Storage usando o MinIO (S3 API).
    """
    def __init__(self):
        self.endpoint = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
        self.access_key = os.environ.get("MINIO_ACCESS_KEY") or os.environ.get("MINIO_ROOT_USER") or "minioadmin"
        self.secret_key = os.environ.get("MINIO_SECRET_KEY") or os.environ.get("MINIO_ROOT_PASSWORD") or "minioadminpassword"
        self.bucket_name = os.getenv("MINIO_BUCKET_NAME", "elevva-midias")
        
        self.client = boto3.client(
            "s3",
            endpoint_url=self.endpoint,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key
        )
        
        # Verifica se o bucket existe, se não, cria
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
        except Exception:
            self.client.create_bucket(Bucket=self.bucket_name)

    def save_file(self, file_stream, filename: str) -> str:
        ext = os.path.splitext(filename)[1]
        safe_filename = f"{uuid4().hex}{ext}"
        
        try:
            self.client.upload_fileobj(
                file_stream,
                self.bucket_name,
                safe_filename
            )
        except botocore.exceptions.ClientError as e:
            raise HTTPException(status_code=502, detail=f"Falha de rede ao enviar mídia para o storage: {e}")
        
        public_url = os.getenv("MINIO_PUBLIC_URL", f"{self.endpoint}/{self.bucket_name}")
        return f"{public_url}/{safe_filename}"
