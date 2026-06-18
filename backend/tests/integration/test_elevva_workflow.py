import pytest
from httpx import AsyncClient, ASGITransport
from src.interfaces.main import app
from src.infrastructure.models import UserModel
from src.domain.entities import UserRole
from src.infrastructure.security import SecurityService
from src.interfaces.auth import get_current_user
from uuid import uuid4

@pytest.mark.asyncio
async def test_elevva_full_workflow(client_with_db, db_session):
    user = UserModel(
        id=uuid4(),
        name="Test User",
        email="test@elevva.com",
        password_hash="fakehash",
        role=UserRole.AGENCY
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    async def override_get_current_user():
        return user

    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        calendar_id = str(uuid4())
        file_content = b"fake video content"
        resp = await ac.post(
            "/posts/upload",
            data={"calendar_id": calendar_id},
            files={"file": ("campanha_abril.mp4", file_content, "video/mp4")},
        )
        assert resp.status_code == 201
        post_id = resp.json()["id"]

        comment_data = {
            "user_id": str(user.id),
            "content": "Ajustar contraste no logo",
            "coord_x": 10.5,
            "coord_y": 20.0
        }

        resp_comment = await ac.post(
            f"/posts/{post_id}/comments",
            json=comment_data,
        )
        assert resp_comment.status_code == 201
        assert resp_comment.json()["content"] == "Ajustar contraste no logo"

        resp_detail = await ac.get(f"/posts/{post_id}")
        assert resp_detail.status_code == 200
        data = resp_detail.json()
        assert len(data["comments"]) >= 1
        assert data["comments"][0]["content"] == "Ajustar contraste no logo"
        assert data["comments"][0]["coord_x"] == 10.5

    app.dependency_overrides.clear()
