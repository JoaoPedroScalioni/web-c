from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from src.domain.entities import PostStatus
from typing import Optional, List

# ===============================================
# Kanban Posts Schemas
# ===============================================
class PostCreateRequest(BaseModel):
    calendar_id: UUID = Field(..., description="ID B2B do calendário associado ao Cliente/Agência")
    media_url: str = Field(..., description="Link Pre-signed S3 da mídia blindando a RAM do servidor")

class PostResponse(BaseModel):
    id: UUID = Field(..., description="Identificador universal rígido do Post Kanban")
    calendar_id: UUID = Field(..., description="UUID do calendário proprietário")
    media_url: str = Field(..., description="URL de acesso à mídia no S3", example="https://bucket.s3.amazonaws.com/uuid.mp4")
    status: PostStatus = Field(..., description="Motor de estado restrito (CRIADO, APROVADO, etc)")
    
    model_config = ConfigDict(from_attributes=True)

# ===============================================
# Pins Visuais (Comments) Schemas 
# ===============================================
class CommentCreateRequest(BaseModel):
    user_id: UUID = Field(..., description="UUID do colaborador que está criando o Pin")
    content: str = Field(..., description="Texto do feedback visual", example="Ajustar saturação nesta área")
    coord_x: float = Field(..., ge=0.0, le=100.0, description="Posição X em %", example=45.5)
    coord_y: float = Field(..., ge=0.0, le=100.0, description="Posição Y em %", example=78.2)

class CommentResponse(BaseModel):
    id: UUID = Field(..., description="ID Identificador do Pin")
    post_id: UUID = Field(..., description="Post vinculado")
    user_id: UUID = Field(..., description="Autor do feedback")
    content: str = Field(..., description="Texto do comentário")
    coord_x: float = Field(..., description="Coordenada X em %")
    coord_y: float = Field(..., description="Coordenada Y em %")

    model_config = ConfigDict(from_attributes=True)

# ===============================================
# Upload Intent Schemas (AWS S3 Bypass)
# ===============================================
class UploadIntentRequest(BaseModel):
    filename: str = Field(..., description="Nome original do arquivo", example="campanha_outono.mp4")
    content_type: str = Field(..., description="MIME type do arquivo", example="video/mp4", pattern=r"^(video/|image/).+")
    file_size_bytes: int = Field(..., description="Tamanho do arquivo em bytes", le=524288000)
    calendar_id: UUID = Field(..., description="ID do calendário para vincular o novo Post")

class UploadIntentResponse(BaseModel):
    upload_url: str = Field(..., description="URL assinada para upload direto ao S3")
    file_key: str = Field(..., description="Chave única gerada para o arquivo no storage")

# ===============================================
# Aggregate/Detail Schemas
# ===============================================
class PostDetailResponse(PostResponse):
    """Resposta completa com todos os feedbacks visuais (Eager Loading)"""
    comments: List[CommentResponse] = Field(default=[], description="Lista de feedbacks (Pins) do vídeo")

class ApprovePostRequest(BaseModel):
    client_id: UUID = Field(..., description="ID do cliente que está realizando a aprovação")
