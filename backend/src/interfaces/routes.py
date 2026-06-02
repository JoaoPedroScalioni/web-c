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
from src.application.use_cases import GetPostDetailUseCase, AddCommentUseCase, UpdatePostStatusUseCase, GetAllPostsUseCase, DeletePostUseCase, UploadMediaUseCase
from src.infrastructure.repositories_impl import SQLAlchemyPostRepository
from src.infrastructure.utils.time_service import TimeService
from typing import List

router = APIRouter(prefix="/posts", tags=["Kanban Posts B2B"])

# --- WORKFLOW E PERFORMANCE ---
@router.post("/upload", response_model=PostResponse, status_code=201)
async def upload_media_local(
    calendar_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    storage: StorageRepository = Depends(get_storage),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Substituição do S3: Delega a stream pesada para a camada de Domínio/Infraestrutura.
    Isolamento total da regra de persistência física.
    """
    upload_use_case = UploadMediaUseCase(storage)
    media_url = await upload_use_case.execute(file.file, file.filename)
        
    # Salvar no Banco
    new_post = PostModel(
        calendar_id=calendar_id,
        media_url=media_url,
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

@router.get("", response_model=List[PostDetailResponse])
async def list_posts(db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    """
    Retorna a lista de compras (Galeria B2B) com todos os posts e seus status.
    """
    repo = SQLAlchemyPostRepository(db)
    use_case = GetAllPostsUseCase(repo)
    return await use_case.execute()

@router.get("/{post_id}", response_model=PostDetailResponse, responses={404: {"description": "Post não localizado"}})
async def get_post(post_id: UUID, db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    """
    Inversão de Dependência: o controlador delega a lógica para o Caso de Uso.
    """
    repo = SQLAlchemyPostRepository(db) 
    use_case = GetPostDetailUseCase(repo) 
    return await use_case.execute(post_id)

# --- VALIDAÇÃO SNIPER E SWAGGER ---
@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=201, 
             responses={404: {"description": "Post não localizado"}})
async def add_comment(
    post_id: UUID, 
    request: CommentCreateRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Rota para adicionar comentários à mídia. 
    A validação estrutural é garantida pelo Pydantic antes de chegar ao Caso de Uso.
    """
    repo = SQLAlchemyPostRepository(db)
    use_case_detail = GetPostDetailUseCase(repo)
    await use_case_detail.execute(post_id) 
        
    use_case = AddCommentUseCase(repo, TimeService())
    return await use_case.execute(
        post_id=post_id,
        user_id=request.user_id,
        content=request.content,
        coord_x=request.coord_x,
        coord_y=request.coord_y
    )

@router.patch("/{post_id}/status", response_model=PostResponse, status_code=200)
async def update_post_status(
    post_id: UUID,
    request: __import__('src.interfaces.schemas', fromlist=['PostStatusUpdateRequest']).PostStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
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

@router.delete("/{post_id}", status_code=204)
async def delete_post(post_id: UUID, db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    """
    Remove uma publicação permanentemente do sistema (Lixeira).
    """
    repo = SQLAlchemyPostRepository(db)
    use_case = DeletePostUseCase(repo)
    await use_case.execute(post_id)