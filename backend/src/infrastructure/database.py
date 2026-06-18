from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker 
from sqlalchemy.orm import DeclarativeBase 
from src.infrastructure.config import settings
from src.infrastructure.storage_impl import MinioStorageRepository, LocalStorageRepository
import os

# --- PERFORMANCE E ESCALA ---

# Pool de conexões reutilizáveis: cada request reusa uma conexão do pool em vez de
# abrir uma nova do zero (que exige TCP + SSL + auth). Isso reduz latência de ~300ms
# para <5ms por request.
engine = create_async_engine(
    settings.DATABASE_URL, 
    echo=False,
    pool_size=5,
    max_overflow=5,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# O expire_on_commit=False é crucial para performance assíncrona,
# permitindo acessar objetos após o commit sem novas viagens ao banco.
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    """
    Injeção de Dependência: Cada requisição HTTP recebe sua própria sessão isolada.
    Isso garante isolamento total entre diferentes clientes na mesma infraestrutura.
    """
    async with AsyncSessionLocal() as session:
        yield session

def get_storage():
    """
    Adaptador Concreto: Usa disco local por padrão (bypass AWS S3).
    Para usar MinIO/S3, configure STORAGE_BACKEND=minio.
    """
    storage_backend = os.getenv("STORAGE_BACKEND", "local").lower()
    if storage_backend == "minio":
        return MinioStorageRepository()
    return LocalStorageRepository()