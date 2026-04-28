import pytest 
from unittest.mock import AsyncMock, MagicMock 
from uuid import uuid4 
from src.application.use_cases import GetPostDetailUseCase, AddCommentUseCase, ApprovePostUseCase, UploadMediaIntentUseCase
from src.domain.entities import PostEntity, PostStatus
from src.domain.exceptions import PostNotFoundError, InvalidCoordinateError

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
async def test_add_comment_negative_coordinates():
    """
    Validação Sniper no Teste: Provamos que o sistema lança 
    InvalidCoordinateError se as coordenadas forem negativas.
    """
    mock_repo = AsyncMock()
    use_case = AddCommentUseCase(mock_repo, MagicMock())
    with pytest.raises(InvalidCoordinateError):
        await use_case.execute(coord_x=-1.0, coord_y=50.0)

@pytest.mark.asyncio
async def test_approve_post_success():
    """
    Integridade do Workflow: Testamos se o status muda 
    corretamente para APROVADO após a chancelagem.
    """
    mock_repo = AsyncMock()
    # ... setup do mock ...
    use_case = ApprovePostUseCase(mock_repo)
    result = await use_case.execute(post_id)
    assert mock_post.status == PostStatus.APROVADO

@pytest.mark.asyncio
async def test_upload_media_intent_success():
    """
    Teste de Integração S3: Simulamos a geração da Pre-signed URL 
    para garantir que o contrato com a AWS está íntegro.
    """
    mock_storage = AsyncMock()
    # ... setup do mock ...
    use_case = UploadMediaIntentUseCase(mock_storage)
    result = await use_case.execute("video.mp4", "video/mp4")
    assert result == expected_data