import pytest
from unittest.mock import AsyncMock
from uuid import UUID, uuid4
from src.application.use_cases import GetAllPostsUseCase, GetPostDetailUseCase, DeletePostUseCase, UpdatePostStatusUseCase
from src.domain.entities import Post, PostStatus
from src.domain.exceptions import PostNotFoundError

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
    expected_post = Post(id=post_id, calendar_id=uuid4(), media_url="video.mp4", status=PostStatus.AGUARDANDO_APROVACAO)
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
    mock_repo.get_by_id.return_value = AsyncMock()
    mock_repo.delete.return_value = None
    use_case = DeletePostUseCase(mock_repo)
    post_id = uuid4()
    await use_case.execute(post_id)
    mock_repo.delete.assert_called_once_with(post_id)

@pytest.mark.asyncio
async def test_delete_post_not_found():
    mock_repo = AsyncMock()
    mock_repo.get_by_id.return_value = None
    use_case = DeletePostUseCase(mock_repo)
    with pytest.raises(PostNotFoundError):
        await use_case.execute(uuid4())

@pytest.mark.asyncio
async def test_update_post_status():
    mock_repo = AsyncMock()
    post_id = uuid4()
    expected_post = Post(id=post_id, calendar_id=uuid4(), media_url="img.png", status=PostStatus.APROVADO)
    mock_repo.update_status.return_value = expected_post
    use_case = UpdatePostStatusUseCase(mock_repo)
    result = await use_case.execute(post_id, PostStatus.APROVADO)
    assert result.status == PostStatus.APROVADO
