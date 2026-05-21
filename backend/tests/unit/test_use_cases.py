import pytest 
from unittest.mock import AsyncMock, MagicMock 
from uuid import uuid4 
from src.application.use_cases import GetPostDetailUseCase, AddCommentUseCase, UpdatePostStatusUseCase, UploadMediaUseCase
from src.domain.entities import PostEntity, PostStatus
from src.domain.exceptions import PostNotFoundError, InvalidStatusError

# --- CONFIABILIDADE E TESTES ---

@pytest.mark.asyncio
async def test_get_post_detail_success():
    """Garantimos que a lógica de busca funciona mockando a infraestrutura."""
    mock_repo = AsyncMock()
    post_id = uuid4()
    
    # FIX: Ensinamos o Mock a retornar uma Entidade válida usando UUID e DateTime reais
    from src.domain.entities import PostEntity
    from datetime import datetime # Importando para agradar o Pydantic
    
    mock_repo.get_by_id.return_value = PostEntity(
        id=post_id, 
        media_url="mock.mp4", 
        calendar_id=uuid4(), # <--- Corrigido para ser um UUID válido
        created_at=datetime.now() # <--- Adicionado para não dar erro de missing field
    )
    
    use_case = GetPostDetailUseCase(mock_repo)
    result = await use_case.execute(post_id)
    
    assert result.id == post_id

@pytest.mark.asyncio
async def test_update_status_invalid():
    """
    Testes Unitários: Provamos que o sistema lança
    InvalidStatusError se o status do Kanban for inválido.
    """
    mock_repo = AsyncMock()
    # Simula que o post existe no banco
    mock_repo.get_by_id.return_value = MagicMock(status=PostStatus.CRIADO)
    
    use_case = UpdatePostStatusUseCase(mock_repo)
    with pytest.raises(InvalidStatusError):
        await use_case.execute(uuid4(), "STATUS_QUE_NAO_EXISTE")

@pytest.mark.asyncio
async def test_approve_post_success():
    """
    Integridade do Workflow: Testamos se o status muda 
    corretamente após a chancelagem.
    """
    mock_repo = AsyncMock()
    mock_post = MagicMock(status=PostStatus.CRIADO)
    mock_repo.get_by_id.return_value = mock_post
    
    use_case = UpdatePostStatusUseCase(mock_repo)
    result = await use_case.execute(uuid4(), "APROVADO")
    
    assert mock_post.status == PostStatus.APROVADO
    mock_repo.save.assert_called_once_with(mock_post)

@pytest.mark.asyncio
async def test_upload_media_success():
    """Garante que a Inversão de Controle para o File System funciona no upload."""
    mock_storage = AsyncMock()
    # Simulamos que o repositório de infra retornou o URL local
    expected_url = "http://localhost:8000/media/video.mp4"
    mock_storage.save_file.return_value = expected_url
    
    use_case = UploadMediaUseCase(mock_storage)
    mock_stream = MagicMock()
    result = await use_case.execute(mock_stream, "video.mp4")
    
    # Validações estritas
    assert result == expected_url
    mock_storage.save_file.assert_called_once_with(mock_stream, "video.mp4")