from sqlalchemy.ext.asyncio import AsyncSession # Gerenciamento de sessões assíncronas com o PostgreSQL
from sqlalchemy.future import select # Para realizar queries SQL modernas e rápidas
from sqlalchemy.orm import selectinload # Carregamento otimizado de relacionamentos
from uuid import UUID # Manipulação de identificadores únicos
from src.domain.repositories import PostRepository # Interface definida no Domínio
from src.infrastructure.models import PostModel, CommentModel # Modelos de banco de dados
from src.domain.entities import PostEntity, CommentEntity # Entidades de negócio

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

    async def get_all(self) -> list[PostEntity]:
        query = await self.session.execute(
            select(PostModel)
            .options(selectinload(PostModel.comments))
            .order_by(PostModel.created_at.desc())
        )
        post_models = query.scalars().all()
        return [PostEntity.model_validate(p, from_attributes=True) for p in post_models]

    async def save(self, post: PostEntity) -> PostEntity:
        # Placeholder for later implementation of saving
        pass

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
