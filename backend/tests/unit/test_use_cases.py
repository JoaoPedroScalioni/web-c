import pytest 
from unittest.mock import AsyncMock, MagicMock 
from uuid import uuid4 
from datetime import datetime
from src.application.use_cases import GetPostDetailUseCase, AddCommentUseCase, UpdatePostStatusUseCase, UploadMediaUseCase
from src.domain.entities import PostEntity, PostStatus, CommentEntity
from src.domain.exceptions import PostNotFoundError, InvalidStatusError

@pytest.mark.asyncio
async def test_get_post_detail_success():
    mock_repo = AsyncMock()
    post_id = uuid4()
    
    mock_repo.get_by_id.return_value = PostEntity(
        id=post_id, 
        media_url="mock.mp4", 
        calendar_id=uuid4(),
        created_at=datetime.now()
    )
    
    use_case = GetPostDetailUseCase(mock_repo)
    result = await use_case.execute(post_id)
    
    assert result.id == post_id

@pytest.mark.asyncio
async def test_update_status_invalid():
    mock_repo = AsyncMock()
    mock_repo.get_by_id.return_value = MagicMock(status=PostStatus.CRIADO)
    
    use_case = UpdatePostStatusUseCase(mock_repo)
    with pytest.raises(InvalidStatusError):
        await use_case.execute(uuid4(), "STATUS_QUE_NAO_EXISTE", uuid4(), "AGENCY")

@pytest.mark.asyncio
async def test_approve_post_success():
    mock_repo = AsyncMock()
    mock_post = MagicMock(status=PostStatus.AGUARDANDO_APROVACAO, calendar_id=uuid4())
    mock_repo.get_by_id.return_value = mock_post
    
    use_case = UpdatePostStatusUseCase(mock_repo)
    result = await use_case.execute(uuid4(), "APROVADO", uuid4(), "AGENCY")
    
    assert result.status == PostStatus.APROVADO
    assert result is mock_post

@pytest.mark.asyncio
async def test_upload_media_success():
    mock_storage = MagicMock()
    expected_url = "http://localhost:8000/media/video.mp4"
    mock_storage.save_file.return_value = expected_url
    
    use_case = UploadMediaUseCase(mock_storage)
    mock_stream = MagicMock()
    result = await use_case.execute(mock_stream, "video.mp4")
    
    assert result == expected_url
    mock_storage.save_file.assert_called_once_with(mock_stream, "video.mp4")
