import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from uuid import uuid4
from src.infrastructure.config import settings

class S3CloudService:
    """Implementa o Adaptador concreto para Boto3 de emissões S3 Seguras."""
    
    def __init__(self):
        # Acesso estrito por credenciais carregadas via .env Pydantic Settings
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            config=Config(signature_version='s3v4')
        )
        self.bucket = settings.S3_BUCKET_NAME

    def generate_upload_url(self, file_name: str, file_type: str) -> dict:
        """
        Gera uma Pre-Signed URL para Upload Cloud-First (500MB)
        Regra RFC 2119: MUST expirar em rigorosos 5 MINUTOS (300s).
        Gera identificador Universal UUID v4 ocultando arquivos B2B do original.
        """
        extension = file_name.split('.')[-1] if '.' in file_name else 'bin'
        secure_b2b_uuid = str(uuid4())
        object_key = f"elevva-uploads/{secure_b2b_uuid}.{extension}"
        
        try:
            # Geração Criptográfica Simétrica (Matemática instantânea em CPU, 0 latência i/o HTTP real)
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
            # Encapsula log de erros da C-Suite AWS
            raise ValueError(f"Recusa do Gerenciador S3 Bucket: {e}")
            
        return {
            "upload_url": response,
            "file_key": object_key
        }
