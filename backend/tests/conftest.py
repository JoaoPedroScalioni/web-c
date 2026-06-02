import asyncio
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Correções de importação baseadas na estrutura atual do Elevva
from src.infrastructure.models import Base
from src.infrastructure.database import get_db
from src.interfaces.main import app

# URL do banco de teste isolado (criado agora para segurança)
TEST_DATABASE_URL = "postgresql+asyncpg://elevva_su:elevva_secure_password@db:5432/elevva_test"

@pytest.fixture(scope="session")
def event_loop():
    """
    Override do event_loop do pytest-asyncio para garantir que
    mesmo as fixtures com scope="session" usem um loop próprio e não o congelem.
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_engine():
    # Motor assíncrono isolado para os testes
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    # Cria o schema inteiro: DDL
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    yield engine
    
    # Teardown: Destrói o schema isolado de testes
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        
    await engine.dispose()

@pytest.fixture
async def db_session(test_engine):
    # Em cada Teste (Unitário/Integração) nós abrimos e fechamos
    # uma transação para que os testes não interfiram uns nos outros.
    connection = await test_engine.connect()
    trans = await connection.begin()
    SessionTest = sessionmaker(connection, expire_on_commit=False, class_=AsyncSession)
    session = SessionTest()

    yield session

    await trans.rollback()
    await session.close()
    await connection.close()

@pytest.fixture
async def client_with_db(db_session):
    """Fixture para testes de integração que sobrepõe o banco de dados da API"""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    yield db_session
    app.dependency_overrides.clear()
