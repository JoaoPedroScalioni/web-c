import pytest
from httpx import AsyncClient, ASGITransport
from src.interfaces.main import app
from uuid import uuid4

@pytest.mark.asyncio
async def test_protected_routes_require_authentication():
    """
    RFC 2119: Garantir que rotas críticas do Canva/Kanban barrem acesso sem Token
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        
        # Teste 1: Criar Post sem Token
        response_post = await ac.post("/posts", json={
            "calendar_id": str(uuid4()),
            "media_url": "https://s3.com/video.mp4"
        })
        assert response_post.status_code == 401
        assert response_post.json()["detail"] == "Not authenticated"

        # Teste 2: Adicionar Comentário sem Token
        response_comment = await ac.post(f"/posts/{uuid4()}/comments", json={
            "user_id": str(uuid4()),
            "content": "Teste",
            "coord_x": 50,
            "coord_y": 50
        })
        assert response_comment.status_code == 401
        assert response_comment.json()["detail"] == "Not authenticated"
