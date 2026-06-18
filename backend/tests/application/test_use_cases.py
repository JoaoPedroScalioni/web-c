import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from src.application.use_cases import GetAllPostsUseCase, GetPostDetailUseCase, DeletePostUseCase, UpdatePostStatusUseCase, AddCommentUseCase
from src.domain.entities import PostEntity, PostStatus, CommentEntity
from src.domain.exceptions import PostNotFoundError, InvalidStatusError
from datetime import datetime

@pytest.mark.asyncio
async def test_get_all_posts_use_case():
    mock_repo = AsyncMock()
    mock_repo.get_all.return_value = []
    use_case = GetAllPostsUseCase(mock_repo)
    result = await use_case.execute()
    assert result == []
    mock_repo.get_all.assert_called_once()

@pytest.mark.asyncio
async def test_get_post_detail_found():
    mock_repo = AsyncMock()
    post_id = uuid4()
    expected_post = PostEntity(id=post_id, calendar_id=uuid4(), media_url="video.mp4", status=PostStatus.AGUARDANDO_APROVACAO, created_at=datetime.now())
    mock_repo.get_by_id.return_value = expected_post
    use_case = GetPostDetailUseCase(mock_repo)
    result = await use_case.execute(post_id)
    assert result == expected_post

@pytest.mark.asyncio
async def test_get_post_detail_not_found():
    mock_repo = AsyncMock()
    mock_repo.get_by_id.return_value = None
    use_case = GetPostDetailUseCase(mock_repo)
    with pytest.raises(PostNotFoundError):
        await use_case.execute(uuid4())

@pytest.mark.asyncio
async def test_delete_post_use_case():
    mock_repo = AsyncMock()
    post_id = uuid4()
    mock_repo.get_by_id.return_value = PostEntity(id=post_id, calendar_id=uuid4(), media_url="video.mp4", status=PostStatus.CRIADO, created_at=datetime.now())
    use_case = DeletePostUseCase(mock_repo)
    await use_case.execute(post_id, uuid4(), "AGENCY")
    mock_repo.delete.assert_called_once_with(post_id)

@pytest.mark.asyncio
async def test_delete_post_not_found():
    mock_repo = AsyncMock()
    mock_repo.get_by_id.return_value = None
    use_case = DeletePostUseCase(mock_repo)
    with pytest.raises(PostNotFoundError):
        await use_case.execute(uuid4(), uuid4(), "AGENCY")

@pytest.mark.asyncio
async def test_update_post_status():
    mock_repo = AsyncMock()
    post_id = uuid4()
    mock_post = MagicMock(status=PostStatus.AGUARDANDO_APROVACAO, calendar_id=uuid4())
    mock_repo.get_by_id.return_value = mock_post
    mock_repo.save.return_value = None
    use_case = UpdatePostStatusUseCase(mock_repo)
    result = await use_case.execute(post_id, "APROVADO", uuid4(), "AGENCY")
    assert result is mock_post
    assert mock_post.status == PostStatus.APROVADO
