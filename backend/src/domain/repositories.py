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
    async def get_all(self) -> list[PostEntity]:
        pass

    @abstractmethod
    async def save(self, post: PostEntity) -> PostEntity:
        pass

    @abstractmethod
    async def get_calendar_owner_id(self, calendar_id: UUID) -> UUID | None:
        """Retorna o ID do cliente dono do calendário, ou None se não existir."""
        pass

    @abstractmethod
    async def save_comment(self, comment: CommentEntity) -> CommentEntity:
        pass

    @abstractmethod
    async def delete(self, post_id: UUID) -> None:
        pass

# --- PERFORMANCE E ESCALA (STORAGE) ---
class StorageRepository(ABC):
    """
    Contrato de armazenamento de mídia. O domínio não sabe se é S3 ou FileSystem.
    """
    @abstractmethod
    def save_file(self, file_stream, filename: str) -> str:
        """
        Recebe um stream de dados, salva na infraestrutura e retorna a URL pública.
        """
        pass