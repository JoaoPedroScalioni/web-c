import asyncio
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError
from src.infrastructure.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class PasswordHasher:
    @staticmethod
    async def hash(password: str) -> str:
        return await asyncio.to_thread(pwd_context.hash, password)

    @staticmethod
    async def verify(plain_password: str, hashed_password: str) -> bool:
        return await asyncio.to_thread(pwd_context.verify, plain_password, hashed_password)

class SecurityService:
    @staticmethod
    def create_access_token(data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    async def decode_access_token(token: str) -> dict:
        try:
            payload = await asyncio.to_thread(
                jwt.decode, token, settings.JWT_SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            return payload
        except JWTError:
            return None
