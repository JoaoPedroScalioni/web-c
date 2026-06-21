from sqlalchemy import Column, String, Float, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.ext.asyncio import AsyncAttrs
import uuid
from src.domain.entities import UserRole, PostStatus, UserStatus

# Clean Architecture: Herança obrigatória da classe AsyncAttrs para compatibilidade Async/Await do FastAPI
Base = declarative_base(cls=AsyncAttrs)

class UserModel(Base):
    __tablename__ = "users"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.APPROVED)
    created_at = Column(DateTime, nullable=True, index=True)

class CalendarModel(Base):
    __tablename__ = "calendars"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    month = Column(String)

class PostModel(Base):
    __tablename__ = "posts"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calendar_id = Column(PGUUID(as_uuid=True), ForeignKey("calendars.id"), index=True)
    media_url = Column(String, nullable=False)
    status = Column(Enum(PostStatus), default=PostStatus.CRIADO)
    created_at = Column(DateTime, nullable=True, index=True)
    
    comments = relationship("CommentModel", back_populates="post", cascade="all, delete-orphan")

class IdeaModel(Base):
    __tablename__ = "ideas"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"))
    title = Column(String)
    description = Column(String)

class CommentModel(Base):
    """Anexo Visual suportando a funcionalidade Core de Pin B2B (X,Y)"""
    __tablename__ = "comments"
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(PGUUID(as_uuid=True), ForeignKey("posts.id"), index=True)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), index=True)
    content = Column(String)
    
    # Restrição Visual no PostgreSQL - Flutuantes
    coord_x = Column(Float, nullable=True)
    coord_y = Column(Float, nullable=True)
    created_at = Column(DateTime, nullable=True, index=True)
    
    post = relationship("PostModel", back_populates="comments")
