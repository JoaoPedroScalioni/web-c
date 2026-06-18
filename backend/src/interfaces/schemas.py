from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime
from src.domain.entities import PostStatus
from typing import Optional, List

class ClientSignupRequest(BaseModel):
    name: str = Field(..., description="Nome do novo cliente", min_length=2)
    email: str = Field(..., description="E-mail corporativo do cliente", pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    password: str = Field(..., description="Senha escolhida pelo cliente", min_length=6)

class ClientSignupResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: str

class PostCreateRequest(BaseModel):
    calendar_id: UUID = Field(..., description="ID B2B do calendário associado ao Cliente/Agência")
    media_url: str = Field(..., description="Link Pre-signed S3 da mídia blindando a RAM do servidor")

class PostResponse(BaseModel):
    id: UUID = Field(..., description="Identificador universal rígido do Post Kanban")
    calendar_id: UUID = Field(..., description="UUID do calendário proprietário")
    media_url: str = Field(..., description="URL de acesso à mídia no S3", json_schema_extra={"example": "https://bucket.s3.amazonaws.com/uuid.mp4"})
    status: PostStatus = Field(..., description="Motor de estado restrito (CRIADO, APROVADO, etc)")
    created_at: Optional[datetime] = Field(None, description="Data de criação do post")
    
    model_config = ConfigDict(from_attributes=True)

class CommentCreateRequest(BaseModel):
    user_id: UUID = Field(..., description="UUID do colaborador que está criando o Pin")
    content: str = Field(..., description="Texto do feedback visual", json_schema_extra={"example": "Ajustar saturação nesta área"})
    coord_x: Optional[float] = Field(None, description="Posição X em %", json_schema_extra={"example": 45.5})
    coord_y: Optional[float] = Field(None, description="Posição Y em %", json_schema_extra={"example": 78.2})

class CommentResponse(BaseModel):
    id: UUID = Field(..., description="ID Identificador do Pin")
    post_id: UUID = Field(..., description="Post vinculado")
    user_id: UUID = Field(..., description="Autor do feedback")
    content: str = Field(..., description="Texto do comentário")
    coord_x: Optional[float] = Field(None, description="Coordenada X em %")
    coord_y: Optional[float] = Field(None, description="Coordenada Y em %")
    created_at: Optional[datetime] = Field(None, description="Data de criação do comentário")

    model_config = ConfigDict(from_attributes=True)

class UploadIntentRequest(BaseModel):
    filename: str = Field(..., description="Nome original do arquivo", json_schema_extra={"example": "campanha_outono.mp4"})
    content_type: str = Field(..., description="MIME type do arquivo", json_schema_extra={"example": "video/mp4"}, pattern=r"^(video/|image/).+")
    file_size_bytes: int = Field(..., description="Tamanho do arquivo em bytes", le=524288000)
    calendar_id: UUID = Field(..., description="ID do calendário para vincular o novo Post")

class UploadIntentResponse(BaseModel):
    upload_url: str = Field(..., description="URL assinada para upload direto ao S3")
    file_key: str = Field(..., description="Chave única gerada para o arquivo no storage")

class PostDetailResponse(PostResponse):
    """Resposta completa com todos os feedbacks visuais (Eager Loading)"""
    comments: List[CommentResponse] = Field(default=[], description="Lista de feedbacks (Pins) do vídeo")

class ApprovePostRequest(BaseModel):
    client_id: UUID = Field(..., description="ID do cliente que está realizando a aprovação")

class PostStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Novo status do Post (ex: APROVADO, REJEITADO)")
    client_id: Optional[UUID] = Field(None, description="Opcional: ID do cliente fazendo a alteração")
