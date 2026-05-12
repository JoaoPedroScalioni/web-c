from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy.future import select 
from sqlalchemy.orm import selectinload 
from uuid import UUID, uuid4
import shutil
import os
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
from src.application.use_cases import GetPostDetailUseCase, AddCommentUseCase, UpdatePostStatusUseCase
from src.infrastructure.repositories_impl import SQLAlchemyPostRepository
from src.infrastructure.utils.time_service import TimeService

router = APIRouter(prefix="/posts", tags=["Kanban Posts B2B"])

# --- WORKFLOW E PERFORMANCE ---
@router.post("/upload", response_model=PostResponse, status_code=201)
async def upload_media_local(
    calendar_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Substituição do S3: Armazena o vídeo localmente (custo zero) no volume /uploads.
    """
    os.makedirs("uploads", exist_ok=True)
    
    # Gerar nome seguro
    ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{uuid4().hex}{ext}"
    file_path = os.path.join("uploads", safe_filename)
    
    # Salvar no disco local
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Salvar no Banco
    new_post = PostModel(
        calendar_id=calendar_id,
        media_url=f"http://localhost:8000/media/{safe_filename}",
        status=PostStatus.AGUARDANDO_APROVACAO,
        created_at=TimeService.get_now()
    )
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)
    
    return new_post

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
    db: AsyncSession = Depends(get_db)
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

@router.patch("/{post_id}/status", response_model=PostResponse, status_code=200)
async def update_post_status(
    post_id: UUID,
    request: __import__('src.interfaces.schemas', fromlist=['PostStatusUpdateRequest']).PostStatusUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Magic Link Approval: Atualiza o status do Post (ex: APROVADO, REJEITADO) de forma pública/anônima.
    """
    repo = SQLAlchemyPostRepository(db)
    use_case = UpdatePostStatusUseCase(repo)
    
    await use_case.execute(post_id, request.status)
    
    # Busca atualizado para retornar
    updated_post = await repo.get_by_id(post_id)
    return updated_post