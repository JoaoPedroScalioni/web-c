from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker 
from sqlalchemy.orm import DeclarativeBase 
from src.infrastructure.config import settings
from src.infrastructure.storage_impl import MinioStorageRepository, LocalStorageRepository, R2StorageRepository
from functools import lru_cache
import os

# --- PERFORMANCE E ESCALA ---

# Pool de conexões reutilizáveis: cada request reusa uma conexão do pool em vez de
# abrir uma nova do zero (que exige TCP + SSL + auth). Isso reduz latência de ~300ms
# para <5ms por request.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"timeout": 10},
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

@lru_cache(maxsize=2)
def _get_storage_instance():
    """
    Singleton cacheado: cria o repositório de storage uma única vez.
    Evita criar boto3 client e head_bucket em todo request de upload.
    """
    storage_backend = os.getenv("STORAGE_BACKEND", "local").lower()
    if storage_backend == "minio":
        return MinioStorageRepository()
    if storage_backend == "r2":
        return R2StorageRepository()
    return LocalStorageRepository()

def get_storage():
    return _get_storage_instance()