from uuid import UUID, uuid4
from src.domain.entities import PostEntity, CommentEntity, PostStatus, UserRole
from src.domain.repositories import PostRepository, StorageRepository
from src.infrastructure.utils.time_service import TimeService
from src.domain.exceptions import PostNotFoundError, InvalidStatusError, UnauthorizedDomainError

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

    async def execute(self, post_id: UUID, user_id: UUID, content: str, coord_x: float | None = None, coord_y: float | None = None) -> CommentEntity:
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

class DeletePostUseCase:
    def __init__(self, repo: PostRepository):
        self.repo = repo

    async def execute(self, post_id: UUID, current_user_id: UUID, current_user_role: str) -> None:
        post = await self.repo.get_by_id(post_id)
        if not post:
            raise PostNotFoundError(str(post_id))
            
        if current_user_role != UserRole.AGENCY.value:
            owner_id = await self.repo.get_calendar_owner_id(post.calendar_id)
            if owner_id != current_user_id:
                raise UnauthorizedDomainError("Acesso negado. Você não é o dono desta postagem.")
                
        await self.repo.delete(post_id)

class UpdatePostStatusUseCase:
    """Implementa a mudança de status do Kanban B2B sem conhecer SQLAlchemy"""
    def __init__(self, post_repo: PostRepository):
        self.post_repo = post_repo

    async def execute(self, post_id: UUID, new_status: str, current_user_id: UUID, current_user_role: str) -> bool:
        post = await self.post_repo.get_by_id(post_id)
        if not post:
            raise PostNotFoundError(str(post_id))
            
        from src.domain.entities import UserRole
        from src.domain.exceptions import UnauthorizedDomainError
        
        if current_user_role != UserRole.AGENCY.value:
            owner_id = await self.post_repo.get_calendar_owner_id(post.calendar_id)
            if owner_id != current_user_id:
                raise UnauthorizedDomainError("Acesso negado. Você não é o dono desta postagem.")
        
        try:
            status_enum = PostStatus(new_status)
        except ValueError:
            raise InvalidStatusError(f"Status '{new_status}' não é um status válido.")

        if not post.status.can_transition_to(status_enum):
            raise InvalidStatusError(
                f"Transição inválida: {post.status.value} → {status_enum.value}."
            )

        post.status = status_enum
        await self.post_repo.save(post)
        return post

class UploadMediaUseCase:
    """Caso de uso para processar o upload físico usando a infraestrutura injetada."""
    def __init__(self, storage_repo: StorageRepository): 
        self.storage_repo = storage_repo
        
    async def execute(self, file_stream, filename: str) -> str:
        # A responsabilidade do disco local ou cloud é totalmente isolada da regra de negócio
        return self.storage_repo.save_file(file_stream, filename)
