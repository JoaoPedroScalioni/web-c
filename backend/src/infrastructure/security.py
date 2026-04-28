from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError
from src.infrastructure.config import settings

# Configuração de Hashing exigida na Seguraça de Camada Zero
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class PasswordHasher:
    """Implementação Concreta de Segurança B2B"""
    
    @staticmethod
    def hash(password: str) -> str:
        """Gera o Hash Iterativo Dinâmico (Salted) usando a engine Bcrypt"""
        return pwd_context.hash(password)

    @staticmethod
    def verify(plain_password: str, hashed_password: str) -> bool:
        """Compara uma senha string nua contra a hash do banco PostgreSQL"""
        return pwd_context.verify(plain_password, hashed_password)

class SecurityService:
    @staticmethod
    def create_access_token(data: dict) -> str:
        """Emite o Token JWT (RFC 7519) de Camada Zero da Elevva API"""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    @staticmethod
    def decode_access_token(token: str) -> dict:
        """Aplica a decodificação cirúrgica, abortando se falsificado."""
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError:
            return None
