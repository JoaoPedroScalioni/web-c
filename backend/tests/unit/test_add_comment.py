import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from src.application.use_cases import AddCommentUseCase
from src.domain.entities import CommentEntity
from src.domain.exceptions import DomainException

@pytest.mark.asyncio
async def test_add_comment_success():
    # Arrange
    mock_repo = AsyncMock()
    mock_time = MagicMock()
    # Simulando que o TimeService sempre retorna uma data fixa para o teste não variar
    mock_time.get_now_br.return_value = "2026-04-14T17:00:00-03:00"
    
    use_case = AddCommentUseCase(mock_repo, mock_time)
    
    post_id = uuid4()
    user_id = uuid4()
    content = "Aumentar brilho aqui"
    coord_x = 45.5
    coord_y = 78.2

    # Act
    # O mock_repo.save_comment deve retornar o que recebeu para validarmos a entidade criada
    mock_repo.save_comment.side_effect = lambda x: x
    
    result = await use_case.execute(
        post_id=post_id,
        user_id=user_id,
        content=content,
        coord_x=coord_x,
        coord_y=coord_y
    )

    # Assert
    assert result.post_id == post_id
    assert result.content == content
    assert result.coord_x == coord_x
    assert result.created_at.isoformat() == "2026-04-14T17:00:00-03:00"
    mock_repo.save_comment.assert_called_once()

