from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from src.infrastructure.database import get_db
from src.infrastructure.models import UserModel
from src.infrastructure.security import PasswordHasher, SecurityService
from src.domain.entities import UserRole
from src.interfaces.schemas import ClientSignupRequest, ClientSignupResponse

router = APIRouter(prefix="/auth", tags=["Security B2B - Auth Login"])

# Habilta Swagger UI Authorization lock (Botão 'Authorize' mágico)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/signup", response_model=ClientSignupResponse, status_code=status.HTTP_201_CREATED)
async def signup_client(
    request: ClientSignupRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Onboarding Self-Service: Cria uma conta nova engessada como CLIENT.
    """
    # Verifica se e-mail já existe
    result = await db.execute(select(UserModel).where(UserModel.email == request.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Este e-mail já está em uso.")
    
    hashed_password = PasswordHasher.hash(request.password)
    
    new_user = UserModel(
        name=request.name,
        email=request.email,
        password_hash=hashed_password,
        role=UserRole.CLIENT
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return ClientSignupResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role.value
    )

@router.post("/login")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Motor de Login B2B (Segurança Camada Zero).
    Retorna o Payload JWT estrito para o Next.js colocar em LocalStorage/Cookies.
    """
    result = await db.execute(select(UserModel).where(UserModel.email == form_data.username))
    user = result.scalars().first()
    
    if not user or not PasswordHasher.verify(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais Incorretas B2B",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = SecurityService.create_access_token(data={"sub": str(user.id), "role": user.role.value})
    
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> UserModel:
    """
    Dependency Injection (Middleware). 
    Todas as rotas que usarem "Depends(get_current_user)" estarão blindadas pelo JWT.
    """
    payload = SecurityService.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Assinatura JWT Inválida ou Expirada")
        
    user_id: str = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Payload do JWT corrompido")
        
    result = await db.execute(select(UserModel).where(UserModel.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário B2B revogado, deletado, ou tenant inválido")
        
    return user
