from abc import ABC, abstractmethod
from uuid import UUID
from src.domain.entities import PostEntity, CommentEntity

# --- CONTRATOS E INFRAESTRUTURA ---
class PostRepository(ABC):
    """
    Este é o Contrato de Interface. O Domínio exige um banco, 
    mas não sabe qual. Isso torna a infraestrutura descartável.
    """
    @abstractmethod
    async def get_by_id(self, post_id: UUID) -> PostEntity:
        pass

    @abstractmethod
    async def save(self, post: PostEntity) -> PostEntity:
        pass

    @abstractmethod
    async def save_comment(self, comment: CommentEntity) -> CommentEntity:
        pass

# --- PERFORMANCE E ESCALA (S3) ---
class StorageRepository(ABC):
    """
    Aqui definimos a lógica do Bypass do Servidor. 
    A implementação real será na AWS, mas o Domínio só enxerga o contrato.
    """
    @abstractmethod
    def generate_upload_url(self, file_name: str, file_type: str) -> dict:
        """Geração de Pre-signed URL para performance cloud-first"""
        pass