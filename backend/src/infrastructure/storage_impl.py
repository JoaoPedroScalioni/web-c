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
        
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
        except botocore.exceptions.ClientError as e:
            if e.response["Error"]["Code"] == "404":
                self.client.create_bucket(Bucket=self.bucket_name)
            else:
                raise

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


class R2StorageRepository(StorageRepository):
    """
    Implementação do Storage usando Cloudflare R2 (S3-compatible).
    """
    def __init__(self):
        self.account_id = os.getenv("R2_ACCOUNT_ID")
        self.access_key = os.getenv("R2_ACCESS_KEY_ID")
        self.secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        self.bucket_name = os.getenv("R2_BUCKET_NAME", "elevva-midias")

        if not self.account_id or not self.access_key or not self.secret_key:
            raise HTTPException(
                status_code=500,
                detail="Credenciais do Cloudflare R2 não configuradas. Defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY."
            )

        self.endpoint = f"https://{self.account_id}.r2.cloudflarestorage.com"
        self.public_url = os.getenv("R2_PUBLIC_URL", "")

        self.client = boto3.client(
            "s3",
            endpoint_url=self.endpoint,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key
        )

        try:
            self.client.head_bucket(Bucket=self.bucket_name)
        except botocore.exceptions.ClientError as e:
            if e.response["Error"]["Code"] == "404":
                self.client.create_bucket(Bucket=self.bucket_name)
            else:
                raise

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
            raise HTTPException(status_code=502, detail=f"Falha de rede ao enviar mídia para o Cloudflare R2: {e}")

        if self.public_url:
            return f"{self.public_url}/{safe_filename}"
        return f"{self.endpoint}/{self.bucket_name}/{safe_filename}"

# --- APRESENTAÇÃO: Tirar print daqui até a linha 60 ---
# Explicação: Padrão arquitetural para simular Storage em nuvem. A classe LocalStorageRepository 
# atua como um Bypass para o AWS S3/MinIO, permitindo que a aplicação faça upload de objetos massivos 
# mesmo rodando localmente, sem gerar custos de nuvem durante o desenvolvimento.
class LocalStorageRepository(StorageRepository):
    """
    Bypass AWS S3: Armazena arquivos localmente no diretório 'uploads'.
    """
    def __init__(self):
        self.upload_dir = "uploads"
        os.makedirs(self.upload_dir, exist_ok=True)
        # O backend vai montar /media para ler dessa pasta (configurado no main.py)
        # Na Vercel/Frontend, o src da imagem vai ser https://elevva-apicerto.onrender.com/media/arquivo.mp4
        self.base_url = os.getenv("PUBLIC_API_URL", "https://elevva-apicerto.onrender.com")
        # PUBLIC_API_URL deve ser configurada no Render para o domínio correto

    def save_file(self, file_stream, filename: str) -> str:
        import shutil
        ext = os.path.splitext(filename)[1]
        safe_filename = f"{uuid4().hex}{ext}"
        file_path = os.path.join(self.upload_dir, safe_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file_stream, buffer)
            
        return f"{self.base_url}/media/{safe_filename}"
