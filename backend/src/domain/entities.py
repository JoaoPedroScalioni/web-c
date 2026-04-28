from enum import Enum # Opções fixas de estado e papéis
from datetime import datetime 
from pydantic import BaseModel, Field # Pydantic: O coração da validação
from uuid import UUID 
from typing import List, Optional 

class UserRole(Enum):
    AGENCY = "AGENCY"
    CLIENT = "CLIENT"

# --- CONTROLE DE ESTADO ---
class PostStatus(Enum):
    """
    O status controla o ciclo de vida no Kanban. 
    O sistema é uma máquina de estados que protege o fluxo do post.
    """
    PENDING_UPLOAD = "PENDING_UPLOAD"
    CRIADO = "CRIADO"
    AGUARDANDO_APROVACAO = "AGUARDANDO_APROVACAO"
    APROVADO = "APROVADO"
    REJEITADO = "REJEITADO"

# --- VALIDAÇÃO SNIPER ---
class Coordinate(BaseModel):
    """
    Aqui nasce a Validação Sniper. ge=0.0 e le=100.0 garantem 
    matematicamente que o Pin nunca caia fora da tela.
    """
    x: float = Field(..., ge=0.0, le=100.0)
    y: float = Field(..., ge=0.0, le=100.0)

class User(BaseModel):
    id: UUID 
    name: str 
    email: str 
    password_hash: str # <--- DADO CRIPTOGRAFADO (SEGURANÇA)
    role: UserRole 

class CommentEntity(BaseModel):
    """
    A Entidade de Comentário carrega a regra de ouro: 
    Integridade total dos dados antes de qualquer persistência.
    """
    id: UUID 
    post_id: UUID 
    user_id: UUID 
    content: str 
    coord_x: float = Field(..., ge=0.0, le=100.0) # <--- SNIPER X
    coord_y: float = Field(..., ge=0.0, le=100.0) # <--- SNIPER Y
    created_at: Optional[datetime] 

class PostEntity(BaseModel):
    """
    Nesta camada de Domínio, o código não sabe o que é SQL ou AWS. 
    É puro negócio, o que torna a infraestrutura descartável.
    """
    id: UUID 
    calendar_id: UUID 
    media_url: str # <--- APENAS A REFERÊNCIA DO S3
    status: PostStatus = Field(PostStatus.CRIADO)
    comments: List[CommentEntity] = Field([])
    created_at: Optional[datetime] 

class Post(PostEntity):
    pass

class Comment(CommentEntity):
    @property
    def coord(self):
        return Coordinate(x=self.coord_x, y=self.coord_y)