import pytest
from httpx import AsyncClient, ASGITransport
from src.interfaces.main import app
from src.infrastructure.models import UserModel, CalendarModel, PostModel
from src.domain.entities import UserRole, PostStatus
from src.interfaces.auth import get_current_user
from uuid import uuid4

@pytest.mark.asyncio
async def test_create_and_get_post_integration(client_with_db, db_session):
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

@pytest.mark.asyncio
async def test_options_upload(client_with_db):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.options("/posts/upload")
    assert resp.status_code == 200

@pytest.mark.asyncio
async def test_create_post_success(client_with_db, db_session):
    user = UserModel(
        id=uuid4(), name="Test User", email="create@test.com",
        password_hash="fake", role=UserRole.AGENCY
    )
    db_session.add(user)
    await db_session.commit()

    calendar = CalendarModel(id=uuid4(), client_id=user.id, month="Teste")
    db_session.add(calendar)
    await db_session.commit()

    async def override_get_current_user():
        return user
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/posts", json={
            "calendar_id": str(calendar.id),
            "media_url": "https://s3.com/video.mp4"
        })
    assert resp.status_code == 201
    data = resp.json()
    assert data["media_url"] == "https://s3.com/video.mp4"

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_list_posts_success(client_with_db, db_session):
    user = UserModel(
        id=uuid4(), name="Test User", email="list@test.com",
        password_hash="fake", role=UserRole.AGENCY
    )
    db_session.add(user)
    await db_session.commit()

    calendar = CalendarModel(id=uuid4(), client_id=user.id, month="Listagem")
    db_session.add(calendar)
    await db_session.commit()

    post = PostModel(
        id=uuid4(), calendar_id=calendar.id, media_url="https://s3.com/video.mp4",
        status=PostStatus.AGUARDANDO_APROVACAO
    )
    db_session.add(post)
    await db_session.commit()

    async def override_get_current_user():
        return user
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/posts")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert any(p["id"] == str(post.id) for p in data)

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_update_post_status_success(client_with_db, db_session):
    user = UserModel(
        id=uuid4(), name="Test User", email="status@test.com",
        password_hash="fake", role=UserRole.AGENCY
    )
    db_session.add(user)
    await db_session.commit()

    calendar = CalendarModel(id=uuid4(), client_id=user.id, month="Status")
    db_session.add(calendar)
    await db_session.commit()

    post = PostModel(
        id=uuid4(), calendar_id=calendar.id, media_url="https://s3.com/video.mp4",
        status=PostStatus.AGUARDANDO_APROVACAO
    )
    db_session.add(post)
    await db_session.commit()

    async def override_get_current_user():
        return user
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.patch(f"/posts/{post.id}/status", json={"status": "APROVADO"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "APROVADO"

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_delete_post_success(client_with_db, db_session):
    user = UserModel(
        id=uuid4(), name="Test User", email="delete@test.com",
        password_hash="fake", role=UserRole.AGENCY
    )
    db_session.add(user)
    await db_session.commit()

    calendar = CalendarModel(id=uuid4(), client_id=user.id, month="Delete")
    db_session.add(calendar)
    await db_session.commit()

    post = PostModel(
        id=uuid4(), calendar_id=calendar.id, media_url="https://s3.com/video.mp4",
        status=PostStatus.CRIADO
    )
    db_session.add(post)
    await db_session.commit()

    async def override_get_current_user():
        return user
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.delete(f"/posts/{post.id}")
    assert resp.status_code == 204

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_add_comment_post_not_found(client_with_db, db_session):
    user = UserModel(
        id=uuid4(), name="Test User", email="comment404@test.com",
        password_hash="fake", role=UserRole.AGENCY
    )
    db_session.add(user)
    await db_session.commit()

    async def override_get_current_user():
        return user
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post(f"/posts/{uuid4()}/comments", json={
            "user_id": str(user.id),
            "content": "Comentário em post inexistente",
            "coord_x": 50.0,
            "coord_y": 50.0
        })
    assert resp.status_code == 404
    assert "não localizado" in resp.json()["detail"]

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_upload_invalid_extension(client_with_db, db_session):
    user = UserModel(
        id=uuid4(), name="Test User", email="upload@test.com",
        password_hash="fake", role=UserRole.AGENCY
    )
    db_session.add(user)
    await db_session.commit()

    async def override_get_current_user():
        return user
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post(
            "/posts/upload",
            data={"calendar_id": str(uuid4())},
            files={"file": ("virus.exe", b"fake content", "application/x-msdownload")},
        )
    assert resp.status_code == 400

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] in ("ok", "degraded")
