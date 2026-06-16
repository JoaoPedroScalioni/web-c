from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker 
from sqlalchemy.orm import DeclarativeBase 
from sqlalchemy.pool import NullPool
from src.infrastructure.config import settings 
from src.infrastructure.storage_impl import MinioStorageRepository, LocalStorageRepository

# --- PERFORMANCE E ESCALA ---

# Aqui está o motor do sistema. O create_async_engine garante que
# o banco de dados nunca bloqueie as threads do servidor FastAPI.
engine = create_async_engine(
    settings.DATABASE_URL, 
    echo=False,
    poolclass=NullPool,  # <-- Mata o problema de conexões ociosas presas no pool em produção
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
    Adaptador Concreto: Bypass AWS S3 ativado.
    Usa o disco local para salvar arquivos e não derrubar a aplicação por falta de credenciais do S3.
    """
    return LocalStorageRepository()