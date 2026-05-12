from uuid import UUID
from src.domain.entities import PostEntity, CommentEntity
from src.domain.repositories import PostRepository
from src.infrastructure.utils.time_service import TimeService
from src.domain.exceptions import PostNotFoundError, InvalidCoordinateError

class GetPostDetailUseCase:
    def __init__(self, repo: PostRepository):
        self.repo = repo

    async def execute(self, post_id: UUID) -> PostEntity:
        post = await self.repo.get_by_id(post_id)
        if not post:
            raise PostNotFoundError(str(post_id))
        return post

class GetAllPostsUseCase:
    def __init__(self, repo: PostRepository):
        self.repo = repo

    async def execute(self) -> list[PostEntity]:
        return await self.repo.get_all()

class AddCommentUseCase:
    def __init__(self, repo: PostRepository, time_service: TimeService):
        self.repo = repo
        self.time_service = time_service

    async def execute(self, post_id: UUID, user_id: UUID, content: str, coord_x: float, coord_y: float) -> CommentEntity:
        from uuid import uuid4
        
        # Regra de Negócio Sniper: Não aceitar coordenadas negativas (fora do canvas)
        if coord_x < 0 or coord_y < 0:
            raise InvalidCoordinateError("Regra B2B: As coordenadas do Pin não podem ser negativas.")
        
        comment_entity = CommentEntity(
            id=uuid4(),
            post_id=post_id,
            user_id=user_id,
            content=content,
            coord_x=coord_x,
            coord_y=coord_y,
            created_at=self.time_service.get_now_br()
        )
        return await self.repo.save_comment(comment_entity)

class UpdatePostStatusUseCase:
    """Implementa a mudança de status do Kanban B2B sem conhecer SQLAlchemy"""
    def __init__(self, post_repo: PostRepository):
        self.post_repo = post_repo

    async def execute(self, post_id: UUID, new_status: str) -> bool:
        post = await self.post_repo.get_by_id(post_id)
        if not post:
            raise PostNotFoundError(str(post_id))
        
        from src.domain.entities import PostStatus
        
        try:
            status_enum = PostStatus(new_status)
        except ValueError:
            raise InvalidCoordinateError(f"Status {new_status} não é um status válido.")
            
        post.status = status_enum
        await self.post_repo.save(post)
        return True

class UploadMediaIntentUseCase:
    """Gerencia a emissão blindada de Pre-Signed URLs para barrar vídeos massivos"""
    def __init__(self, storage_repo: PostRepository): # Adaptado para usar o storage repo ou similar
        self.storage_repo = storage_repo
        
    async def execute(self, filename: str, content_type: str) -> dict:
        # Nota: Esta lógica já está sendo feita na rota, mas unificamos aqui para SDD
        return await self.storage_repo.generate_upload_url(filename, content_type)
