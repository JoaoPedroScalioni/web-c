from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID

from src.infrastructure.database import get_db
from src.infrastructure.models import UserModel
from src.domain.entities import UserRole, UserStatus
from src.interfaces.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin - Approval"])

async def require_approved_admin(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    if current_user.role != UserRole.AGENCY or current_user.status != UserStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores aprovados podem acessar esta funcionalidade."
        )
    return current_user

@router.get("/pending-users")
async def list_pending_users(
    db: AsyncSession = Depends(get_db),
    admin: UserModel = Depends(require_approved_admin)
):
    result = await db.execute(
        select(UserModel)
        .where(UserModel.role == UserRole.AGENCY)
        .where(UserModel.status == UserStatus.PENDING)
        .order_by(UserModel.created_at.desc())
    )
    users = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]

@router.post("/approve-user/{user_id}")
async def approve_admin(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: UserModel = Depends(require_approved_admin)
):
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if user.role != UserRole.AGENCY:
        raise HTTPException(status_code=400, detail="Este usuário não é um administrador.")
    if user.status != UserStatus.PENDING:
        raise HTTPException(status_code=400, detail="Este usuário não está pendente de aprovação.")

    user.status = UserStatus.APPROVED
    await db.commit()
    return {"message": f"Administrador {user.name} aprovado com sucesso."}

@router.post("/reject-user/{user_id}")
async def reject_admin(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: UserModel = Depends(require_approved_admin)
):
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    if user.role != UserRole.AGENCY:
        raise HTTPException(status_code=400, detail="Este usuário não é um administrador.")
    if user.status != UserStatus.PENDING:
        raise HTTPException(status_code=400, detail="Este usuário não está pendente de aprovação.")

    user.status = UserStatus.REJECTED
    await db.commit()
    return {"message": f"Administrador {user.name} rejeitado."}
