import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
from datetime import datetime
from src.infrastructure.repositories_impl import SQLAlchemyPostRepository
from src.infrastructure.storage_impl import LocalStorageRepository
from src.domain.entities import PostEntity, CommentEntity, PostStatus

def _mock_result(first_return):
    scalars = MagicMock()
    scalars.first.return_value = first_return
    result = MagicMock()
    result.scalars.return_value = scalars
    return result

def _mock_result_all(all_return):
    scalars = MagicMock()
    scalars.all.return_value = all_return
    result = MagicMock()
    result.scalars.return_value = scalars
    return result

@pytest.mark.asyncio
async def test_get_by_id_returns_post():
    session = AsyncMock()
    post_id = uuid4()
    mock_post = MagicMock()
    mock_post.id = post_id
    mock_post.calendar_id = uuid4()
    mock_post.media_url = "video.mp4"
    mock_post.status = PostStatus.CRIADO
    mock_post.created_at = datetime.now()
    mock_post.comments = []
    session.execute.return_value = _mock_result(mock_post)

    repo = SQLAlchemyPostRepository(session)
    result = await repo.get_by_id(post_id)

    assert result.id == post_id
    assert result.media_url == "video.mp4"

@pytest.mark.asyncio
async def test_get_by_id_returns_none():
    session = AsyncMock()
    session.execute.return_value = _mock_result(None)

    repo = SQLAlchemyPostRepository(session)
    result = await repo.get_by_id(uuid4())

    assert result is None

@pytest.mark.asyncio
async def test_save_updates_status():
    session = AsyncMock()
    post_id = uuid4()
    entity = MagicMock(id=post_id, status=PostStatus.APROVADO)

    repo = SQLAlchemyPostRepository(session)
    result = await repo.save(entity)

    session.execute.assert_awaited_once()
    session.commit.assert_awaited_once()
    assert result == entity

@pytest.mark.asyncio
async def test_delete_calls_delete():
    session = AsyncMock()
    post_id = uuid4()

    repo = SQLAlchemyPostRepository(session)
    await repo.delete(post_id)

    assert session.execute.await_count == 2
    session.commit.assert_awaited_once()

@pytest.mark.asyncio
async def test_get_calendar_owner_id():
    session = AsyncMock()
    session.execute.return_value = _mock_result(uuid4())

    repo = SQLAlchemyPostRepository(session)
    result = await repo.get_calendar_owner_id(uuid4())

    assert result is not None

@pytest.mark.asyncio
async def test_get_all_returns_list():
    session = AsyncMock()
    mock_post = MagicMock()
    mock_post.id = uuid4()
    mock_post.calendar_id = uuid4()
    mock_post.media_url = "video.mp4"
    mock_post.status = PostStatus.CRIADO
    mock_post.created_at = datetime.now()
    mock_post.comments = []
    session.execute.return_value = _mock_result_all([mock_post])

    repo = SQLAlchemyPostRepository(session)
    result = await repo.get_all()

    assert len(result) == 1

@pytest.mark.asyncio
async def test_save_comment():
    session = AsyncMock()
    comment = CommentEntity(
        id=uuid4(), post_id=uuid4(), user_id=uuid4(),
        content="teste", coord_x=10.0, coord_y=20.0,
        created_at=datetime.now()
    )

    session.add = MagicMock()
    def _refresh(model):
        model.id = uuid4()
    session.refresh.side_effect = _refresh

    repo = SQLAlchemyPostRepository(session)
    result = await repo.save_comment(comment)

    session.add.assert_called_once()
    session.commit.assert_awaited_once()
    assert result.content == "teste"

def test_local_storage_save_file():
    safe_hex = "abcdef1234567890"
    mock_stream = MagicMock()
    mock_stream.read.side_effect = [b"data", b""]

    with patch("src.infrastructure.storage_impl.uuid4") as mock_uuid:
        mock_uuid.return_value.hex = safe_hex
        with patch("builtins.open", MagicMock()) as mock_file:
            repo = LocalStorageRepository()
            result = repo.save_file(mock_stream, "video.mp4")

    assert safe_hex in result
    assert result.endswith(".mp4")

def test_local_storage_creates_upload_dir():
    with patch("os.makedirs") as mock_makedirs:
        LocalStorageRepository()
    mock_makedirs.assert_called_once_with("uploads", exist_ok=True)
