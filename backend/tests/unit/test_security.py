import pytest
from src.infrastructure.security import SecurityService, PasswordHasher
from uuid import uuid4

def test_password_hashing():
    """Valida o motor de hash Bcrypt"""
    password = "secret_password"
    hashed = PasswordHasher.hash(password)
    
    assert hashed != password
    assert PasswordHasher.verify(password, hashed)
    assert not PasswordHasher.verify("wrong_password", hashed)

def test_jwt_generation_and_validation():
    """Valida a emissão e decodificação de tokens JWT B2B"""
    user_id = str(uuid4())
    data = {"sub": user_id, "role": "ADMIN"}
    
    token = SecurityService.create_access_token(data)
    assert isinstance(token, str)
    
    payload = SecurityService.decode_access_token(token)
    assert payload["sub"] == user_id
    assert payload["role"] == "ADMIN"

def test_jwt_decode_invalid_token():
    """Garante que tokens malformados retornem None"""
    assert SecurityService.decode_access_token("token_invalido") is None
