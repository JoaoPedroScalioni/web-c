from fastapi import APIRouter, HTTPException, Depends 
from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy.future import select 
from sqlalchemy.orm import selectinload 
from uuid import UUID 

from src.interfaces.schemas import (
    PostCreateRequest, 
    PostResponse, 
    CommentCreateRequest, 
    CommentResponse,
    PostDetailResponse,
    UploadIntentRequest,
    UploadIntentResponse
)
from src.infrastructure.database import get_db, get_storage
from src.infrastructure.models import PostModel, CommentModel, UserModel
from src.domain.repositories import StorageRepository
from src.domain.entities import PostStatus
from src.interfaces.auth import get_current_user
from src.application.use_cases import GetPostDetailUseCase, AddCommentUseCase
from src.infrastructure.repositories_impl import SQLAlchemyPostRepository
from src.infrastructure.utils.time_service import TimeService

router = APIRouter(prefix="/posts", tags=["Kanban Posts B2B"])

# --- WORKFLOW E PERFORMANCE ---
@router.post("/upload-intent", response_model=UploadIntentResponse, status_code=201)
async def create_upload_intent(
    request: UploadIntentRequest, 
    db: AsyncSession = Depends(get_db),
    storage: StorageRepository = Depends(get_storage)
):
    """
    Início do ciclo: status PENDING_UPLOAD. O upload é direto pro S3 (Bypass), 
    mantendo o servidor leve e performático.
    """
    presigned = storage.generate_upload_url(
        file_name=request.filename, 
        file_type=request.content_type
    )
    
    new_post = PostModel(
        calendar_id=request.calendar_id,
        media_url=presigned["file_key"],
        status=PostStatus.PENDING_UPLOAD, # <--- CONTROLE DE ESTADO
        created_at=TimeService.get_now()  # <--- PADRONIZAÇÃO GMT-3
    )
    db.add(new_post)
    await db.commit() # <--- ASYNC: SEM BLOQUEIO DE THREADS
    
    return UploadIntentResponse(
        upload_url=presigned["upload_url"],
        file_key=presigned["file_key"]
    )

@router.post("", response_model=PostResponse, status_code=201)
async def create_post(
    request: PostCreateRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user) # <--- SEGURANÇA JWT
):
    """
    Segurança Stateless via JWT: apenas usuários autenticados criam posts
    """
    new_post = PostModel(
        calendar_id=request.calendar_id,
        media_url=request.media_url,
        created_at=TimeService.get_now()
    )
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)
    return new_post

@router.get("/{post_id}", response_model=PostDetailResponse, responses={404: {"description": "Post não localizado"}})
async def get_post(post_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Inversão de Dependência: o controlador delega a lógica para o Caso de Uso.
    """
    repo = SQLAlchemyPostRepository(db) 
    use_case = GetPostDetailUseCase(repo) 
    return await use_case.execute(post_id)

# --- VALIDAÇÃO SNIPER E SWAGGER ---
@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=201, 
             responses={404: {"description": "Post não localizado"}, 400: {"description": "Coordenadas inválidas"}})
async def add_visual_pin_comment(
    post_id: UUID, 
    request: CommentCreateRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Validação Sniper: o Pydantic garante x/y entre 0 e 100. 
    Se falhar, o Swagger já expõe o erro 400 automaticamente.
    """
    repo = SQLAlchemyPostRepository(db)
    use_case_detail = GetPostDetailUseCase(repo)
    await use_case_detail.execute(post_id) 
        
    use_case = AddCommentUseCase(repo, TimeService())
    return await use_case.execute(
        post_id=post_id,
        user_id=request.user_id,
        content=request.content,
        coord_x=request.coord_x, # <--- REGRA DE NEGÓCIO PROTEGIDA
        coord_y=request.coord_y
    )