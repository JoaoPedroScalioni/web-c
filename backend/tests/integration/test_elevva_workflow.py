import pytest
from httpx import AsyncClient, ASGITransport
from src.interfaces.main import app
from uuid import uuid4

@pytest.mark.asyncio
async def test_elevva_full_workflow(client_with_db):
    """
    Validando o fluxo crítico da Elevva:
    1. Criar um Post via intenção de upload
    2. Adicionar um comentário (Pin Visual) no canvas
    3. Recuperar os detalhes e validar se o comentário está lá
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Intenção de Upload
        calendar_id = str(uuid4())
        upload_intent = {
            "calendar_id": calendar_id,
            "filename": "campanha_abril.mp4",
            "content_type": "video/mp4"
        }
        resp = await ac.post("/posts/upload-intent", json=upload_intent)
        assert resp.status_code == 201
        post_id = resp.json()["file_key"].split(".")[0] # Assumindo UUID.ext

        # 2. Adicionar Comentário Visual
        comment_data = {
            "user_id": str(uuid4()),
            "content": "Ajustar contraste no logo",
            "coord_x": 10.5,
            "coord_y": 20.0
        }
        
        resp_comment = await ac.post(f"/posts/{post_id}/comments", json=comment_data)
        assert resp_comment.status_code == 201
        assert resp_comment.json()["content"] == "Ajustar contraste no logo"

        # 3. Validar Detalhes
        resp_detail = await ac.get(f"/posts/{post_id}")
        assert resp_detail.status_code == 200
        data = resp_detail.json()
        assert len(data["comments"]) >= 1
        assert data["comments"][0]["content"] == "Ajustar contraste no logo"
        assert data["comments"][0]["coord_x"] == 10.5
