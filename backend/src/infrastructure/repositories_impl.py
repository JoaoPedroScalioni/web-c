from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update, delete
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from src.domain.repositories import PostRepository
from src.infrastructure.models import PostModel, CommentModel, CalendarModel
from src.domain.entities import PostEntity, CommentEntity

# [TIRE PRINT DAQUI - SLIDE: INVERSÃO DE DEPENDÊNCIA (IMPLEMENTAÇÃO)]
# COMO EXPLICAR: "Esta é a implementação real do repositório usando SQLAlchemy. Perceba que ela 'herda' 
# de PostRepository. Se quisermos mudar o banco de dados no futuro, mudamos apenas este arquivo. 
# A regra de negócio lá em cima não sofre nenhum impacto."
class SQLAlchemyPostRepository(PostRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, post_id: UUID) -> PostEntity:
        query = await self.session.execute(
            select(PostModel)
            .options(selectinload(PostModel.comments))
            .filter(PostModel.id == post_id)
        )
        post_model = query.scalars().first()
        if not post_model:
            return None
        return PostEntity.model_validate(post_model, from_attributes=True)

    async def get_calendar_owner_id(self, calendar_id: UUID) -> UUID | None:
        query = await self.session.execute(
            select(CalendarModel.client_id).filter(CalendarModel.id == calendar_id)
        )
        return query.scalars().first()

    async def get_all(self) -> list[PostEntity]:
        query = await self.session.execute(
            select(PostModel)
            .options(selectinload(PostModel.comments))
            .order_by(PostModel.created_at.desc())
        )
        post_models = query.scalars().all()
        return [PostEntity.model_validate(p, from_attributes=True) for p in post_models]

    async def get_all_by_client(self, client_id: UUID) -> list[PostEntity]:
        query = await self.session.execute(
            select(PostModel)
            .join(CalendarModel, PostModel.calendar_id == CalendarModel.id)
            .options(selectinload(PostModel.comments))
            .filter(CalendarModel.client_id == client_id)
            .order_by(PostModel.created_at.desc())
        )
        post_models = query.scalars().all()
        return [PostEntity.model_validate(p, from_attributes=True) for p in post_models]

    async def save(self, post_entity: PostEntity) -> PostEntity:
        stmt = update(PostModel).where(PostModel.id == post_entity.id).values(status=post_entity.status)
        await self.session.execute(stmt)
        await self.session.commit()
        return post_entity

    async def save_comment(self, comment: CommentEntity) -> CommentEntity:
        new_comment = CommentModel(
            post_id=comment.post_id,
            user_id=comment.user_id,
            content=comment.content,
            coord_x=comment.coord_x,
            coord_y=comment.coord_y,
            created_at=comment.created_at
        )
        self.session.add(new_comment)
        await self.session.commit()
        await self.session.refresh(new_comment)
        
        return CommentEntity.model_validate(new_comment, from_attributes=True)

    async def delete(self, post_id: UUID) -> None:
        await self.session.execute(
            delete(CommentModel).where(CommentModel.post_id == post_id)
        )
        await self.session.execute(
            delete(PostModel).where(PostModel.id == post_id)
        )
        await self.session.commit()
