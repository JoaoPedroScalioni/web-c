from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from src.interfaces.schemas import (
    PostCreateRequest, 
    PostResponse, 
    CommentCreateRequest, 
    CommentResponse,
    PostDetailResponse,
    PostStatusUpdateRequest
)
from src.infrastructure.database import get_db, get_storage
from src.infrastructure.models import PostModel, CommentModel, UserModel, CalendarModel
from src.domain.repositories import StorageRepository
from src.domain.entities import PostStatus, UserRole
from src.interfaces.auth import get_current_user
from src.application.use_cases import GetPostDetailUseCase, AddCommentUseCase, UpdatePostStatusUseCase, GetAllPostsUseCase, DeletePostUseCase, UploadMediaUseCase
from src.infrastructure.repositories_impl import SQLAlchemyPostRepository
from src.infrastructure.utils.time_service import TimeService
from typing import List, Any

router = APIRouter(prefix="/posts", tags=["Kanban Posts B2B"])

# --- WORKFLOW E PERFORMANCE ---
MAX_UPLOAD_SIZE = 500 * 1024 * 1024

@router.options("/upload")
async def options_upload():
    return {"message": "Preflight OK"}

@router.post("/upload", response_model=PostResponse, status_code=201)
async def upload_media_local(
    calendar_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    storage: StorageRepository = Depends(get_storage),
    current_user: UserModel = Depends(get_current_user)
) -> PostModel:
    if file.size and file.size > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="Arquivo excede o limite de 500MB")

    # Validação rigorosa de extensões e tipos de arquivo
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "mp4", "mov", "webm"}
    ALLOWED_MIMETYPES = {
        "image/png", "image/jpeg", "image/gif", 
        "video/mp4", "video/quicktime", "video/webm"
    }

    file_ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else ""
    
    if file_ext not in ALLOWED_EXTENSIONS or file.content_type not in ALLOWED_MIMETYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Formato de arquivo inválido. Permitidos: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    upload_use_case = UploadMediaUseCase(storage)
    media_url = await upload_use_case.execute(file.file, file.filename)
        
    # AUTO-SEED: Garante que o calendário base do frontend exista na Neon
    from uuid import UUID
    from sqlalchemy.future import select
    
    cal_uuid = None
    try:
        cal_uuid = UUID(calendar_id)
    except Exception:
        pass # Ignora string inválida
        
    calendar = None
    if cal_uuid:
        calendar = await db.get(CalendarModel, cal_uuid)
        
    # Proteção B2B: Se o calendário for de outro cliente (bug do frontend) ou não existir
    if not calendar or calendar.client_id != current_user.id:
        # Tenta achar o calendário correto do cliente atual
        query = await db.execute(select(CalendarModel).where(CalendarModel.client_id == current_user.id))
        calendar = query.scalars().first()
        
        # Se não tiver nenhum, cria um
        if not calendar:
            calendar = CalendarModel(
                client_id=current_user.id,
                month="Aprovação B2B Elevva"
            )
            # Reaproveita o UUID se for novo e válido
            if cal_uuid and not await db.get(CalendarModel, cal_uuid):
                calendar.id = cal_uuid
            db.add(calendar)
            await db.commit()
            await db.refresh(calendar)

    # Salvar no Banco com o ID real e seguro
    new_post = PostModel(
        calendar_id=calendar.id,
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
) -> PostModel:
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
async def list_posts(db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)) -> list:
    """
    Retorna a lista de compras (Galeria B2B) com todos os posts e seus status.
    Clientes veem apenas seus próprios posts; admins veem todos.
    """
    repo = SQLAlchemyPostRepository(db)
    if current_user.role == UserRole.CLIENT:
        return await repo.get_all_by_client(current_user.id)
    use_case = GetAllPostsUseCase(repo)
    return await use_case.execute()

@router.get("/{post_id}", response_model=PostDetailResponse, responses={404: {"description": "Post não localizado"}})
async def get_post(post_id: UUID, db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)) -> Any:
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
) -> Any:
    """
    Rota para adicionar comentários à mídia. 
    A validação estrutural é garantida pelo Pydantic antes de chegar ao Caso de Uso.
    """
    repo = SQLAlchemyPostRepository(db)
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
    request: PostStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> Any:
    """
    Magic Link Approval: Atualiza o status do Post (ex: APROVADO, REJEITADO) de forma pública/anônima.
    """
    repo = SQLAlchemyPostRepository(db)
    use_case = UpdatePostStatusUseCase(repo)
    
    return await use_case.execute(post_id, request.status, current_user.id, current_user.role.value)

@router.delete("/{post_id}", status_code=204)
async def delete_post(post_id: UUID, db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)) -> None:
    """
    Remove uma publicação permanentemente do sistema (Lixeira).
    """
    repo = SQLAlchemyPostRepository(db)
    use_case = DeletePostUseCase(repo)
    await use_case.execute(post_id, current_user.id, current_user.role.value)