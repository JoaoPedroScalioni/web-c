import pytest
from httpx import AsyncClient, ASGITransport
from src.interfaces.main import app
from src.infrastructure.models import UserModel
from src.domain.entities import UserRole
from src.infrastructure.security import SecurityService
from src.interfaces.auth import get_current_user
from uuid import uuid4

@pytest.mark.asyncio
async def test_create_and_get_post_integration(client_with_db, db_session):
    # Create a user and override auth
    user = UserModel(
        id=uuid4(),
        name="Test User",
        email="test@email.com",
        password_hash="fakehash",
        role=UserRole.CLIENT
    )
    db_session.add(user)
    await db_session.commit()

    async def override_get_current_user():
        return user
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        random_id = uuid4()
        response = await ac.get(f"/posts/{random_id}")
        assert response.status_code == 404

    app.dependency_overrides.clear()
