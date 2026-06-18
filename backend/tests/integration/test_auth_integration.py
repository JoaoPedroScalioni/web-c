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
        response_post = await ac.post("/posts", json={
            "calendar_id": str(uuid4()),
            "media_url": "https://s3.com/video.mp4"
        })
        assert response_post.status_code == 401
        assert response_post.json()["detail"] == "Not authenticated"

        response_comment = await ac.post(f"/posts/{uuid4()}/comments", json={
            "user_id": str(uuid4()),
            "content": "Teste",
            "coord_x": 50,
            "coord_y": 50
        })
        assert response_comment.status_code == 401
        assert response_comment.json()["detail"] == "Not authenticated"

@pytest.mark.asyncio
async def test_signup_success(client_with_db):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/auth/signup", json={
            "name": "Novo Cliente",
            "email": "novo@cliente.com",
            "password": "senha123"
        })
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Novo Cliente"
    assert data["email"] == "novo@cliente.com"
    assert data["role"] == "CLIENT"

@pytest.mark.asyncio
async def test_signup_agency_email(client_with_db):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/auth/signup", json={
            "name": "Agency User",
            "email": "admin@elevva.com",
            "password": "senha123"
        })
    assert resp.status_code == 201
    assert resp.json()["role"] == "AGENCY"

@pytest.mark.asyncio
async def test_signup_duplicate_email(client_with_db):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp1 = await ac.post("/auth/signup", json={
            "name": "First",
            "email": "dup@email.com",
            "password": "senha123"
        })
        assert resp1.status_code == 201
        resp2 = await ac.post("/auth/signup", json={
            "name": "Second",
            "email": "dup@email.com",
            "password": "senha123"
        })
    assert resp2.status_code == 400

@pytest.mark.asyncio
async def test_login_success(client_with_db, db_session):
    from src.infrastructure.security import PasswordHasher
    from src.infrastructure.models import UserModel
    from src.domain.entities import UserRole
    pw_hash = await PasswordHasher.hash("senha123")
    user = UserModel(
        id=uuid4(), name="Login Test", email="login@test.com",
        password_hash=pw_hash, role=UserRole.CLIENT
    )
    db_session.add(user)
    await db_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/auth/login", data={
            "username": "login@test.com",
            "password": "senha123"
        })
    assert resp.status_code == 200
    assert "access_token" in resp.json()

@pytest.mark.asyncio
async def test_login_invalid_credentials(client_with_db, db_session):
    from src.infrastructure.security import PasswordHasher
    from src.infrastructure.models import UserModel
    from src.domain.entities import UserRole
    pw_hash = await PasswordHasher.hash("senha123")
    user = UserModel(
        id=uuid4(), name="Login Test", email="login@test.com",
        password_hash=pw_hash, role=UserRole.CLIENT
    )
    db_session.add(user)
    await db_session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/auth/login", data={
            "username": "login@test.com",
            "password": "wrong_password"
        })
    assert resp.status_code == 401

@pytest.mark.asyncio
async def test_get_current_user_invalid_token(client_with_db):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/posts", headers={"Authorization": "Bearer invalid_token"})
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Assinatura JWT Inválida ou Expirada"

@pytest.mark.asyncio
async def test_get_current_user_user_not_found(client_with_db):
    from src.infrastructure.security import SecurityService
    token = SecurityService.create_access_token({"sub": str(uuid4()), "role": "AGENCY"})
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/posts", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
    assert "Usuário B2B revogado" in resp.json()["detail"]

@pytest.mark.asyncio
async def test_get_current_user_corrupted_token(client_with_db):
    from src.infrastructure.security import SecurityService
    token = SecurityService.create_access_token({"role": "AGENCY"})
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/posts", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401
    assert "Payload do JWT corrompido" in resp.json()["detail"]
