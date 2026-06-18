import asyncio
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from src.infrastructure.models import Base
from src.infrastructure.database import get_db
from src.interfaces.main import app

import os
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql+asyncpg://elevva_su:elevva_secure_password@db:5432/elevva_test")

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()

@pytest.fixture
async def db_session(test_engine):
    connection = await test_engine.connect()
    trans = await connection.begin()
    SessionTest = sessionmaker(connection, expire_on_commit=False, class_=AsyncSession)
    session = SessionTest()
    yield session
    await session.close()
    await trans.rollback()
    await connection.close()

@pytest.fixture
async def client_with_db(db_session):
    async def override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = override_get_db
    yield db_session
    app.dependency_overrides.clear()
