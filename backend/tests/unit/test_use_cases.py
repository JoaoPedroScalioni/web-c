import pytest 
from unittest.mock import AsyncMock, MagicMock 
from uuid import uuid4 
from src.application.use_cases import GetPostDetailUseCase, AddCommentUseCase, UpdatePostStatusUseCase, UploadMediaIntentUseCase
from src.domain.entities import PostEntity, PostStatus
from src.domain.exceptions import PostNotFoundError, InvalidStatusError

# --- CONFIABILIDADE E TESTES ---

@pytest.mark.asyncio
async def test_get_post_detail_success():
    """
    Testes Unitários: Usamos AsyncMock para simular o banco. 
    Garantimos que a lógica de busca funciona sem precisar de infra real.
    """
    mock_repo = AsyncMock()
    post_id = uuid4()
    # ... setup do mock ...
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
async def test_upload_media_intent_success():
    
    mock_storage = AsyncMock()
    # ... setup do mock ...
    use_case = UploadMediaIntentUseCase(mock_storage)
    result = await use_case.execute("video.mp4", "video/mp4")
    assert result == expected_data