import pytest
from httpx import AsyncClient, ASGITransport
from src.interfaces.main import app
from uuid import uuid4

@pytest.mark.asyncio
async def test_create_and_get_post_integration(client_with_db):
    # Usamos o AsyncClient para simular o frontend do Next.js
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Tentamos buscar um post que não existe (deve dar 404)
        random_id = uuid4()
        response = await ac.get(f"/posts/{random_id}")
        assert response.status_code == 404
