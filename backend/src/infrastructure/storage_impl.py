import os
import shutil
from uuid import uuid4
from src.domain.repositories import StorageRepository

class LocalFileSystemStorageRepository(StorageRepository):
    """
    Implementação concreta do contrato de Storage usando o disco local.
    Salva os dados em blocos (chunks) usando shutil para evitar sobrecarga de RAM.
    """
    def __init__(self, upload_dir: str = "uploads", base_url: str = "http://localhost:8000/media/"):
        self.upload_dir = upload_dir
        self.base_url = base_url
        os.makedirs(self.upload_dir, exist_ok=True)

    def save_file(self, file_stream, filename: str) -> str:
        ext = os.path.splitext(filename)[1]
        safe_filename = f"{uuid4().hex}{ext}"
        file_path = os.path.join(self.upload_dir, safe_filename)
        
        # Salva no disco local em chunks assíncronos geridos pelo FastAPI
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file_stream, buffer)
            
        return f"{self.base_url}{safe_filename}"
