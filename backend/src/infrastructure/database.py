from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker 
from sqlalchemy.orm import DeclarativeBase 
from src.infrastructure.config import settings 
from src.infrastructure.storage_impl import LocalFileSystemStorageRepository

# --- PERFORMANCE E ESCALA ---

# Aqui está o motor do sistema. O create_async_engine garante que
# o banco de dados nunca bloqueie as threads do servidor FastAPI.
engine = create_async_engine(settings.DATABASE_URL, echo=False)

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
    Adaptador Concreto: Aqui injetamos a implementação real do FileSystem Local.
    O sistema permanece leve pois o storage é externo e desacoplado.
    """
    return LocalFileSystemStorageRepository()