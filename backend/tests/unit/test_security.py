import pytest
from src.infrastructure.security import SecurityService, PasswordHasher
from uuid import uuid4

@pytest.mark.asyncio
async def test_password_hashing():
    password = "secret_password"
    hashed = await PasswordHasher.hash(password)

    assert hashed != password
    assert await PasswordHasher.verify(password, hashed)
    assert not await PasswordHasher.verify("wrong_password", hashed)

@pytest.mark.asyncio
async def test_jwt_generation_and_validation():
    user_id = str(uuid4())
    data = {"sub": user_id, "role": "ADMIN"}

    token = SecurityService.create_access_token(data)
    assert isinstance(token, str)

    payload = await SecurityService.decode_access_token(token)
    assert payload["sub"] == user_id
    assert payload["role"] == "ADMIN"

@pytest.mark.asyncio
async def test_jwt_decode_invalid_token():
    assert await SecurityService.decode_access_token("token_invalido") is None
