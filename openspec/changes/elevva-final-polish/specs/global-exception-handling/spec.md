## ADDED Requirements

### Requirement: Mapeamento Global de Exceções de Domínio
O sistema SHALL capturar automaticamente as exceções lançadas na camada de aplicação (Use Cases) e convertê-las em respostas HTTP padronizadas.

#### Scenario: Captura de Post não encontrado
- **WHEN** um Caso de Uso lança a exceção `PostNotFoundError`
- **THEN** o sistema SHALL responder com status HTTP 404 e um JSON contendo `{"detail": "Post não localizado na Elevva"}`.

### Requirement: Resposta Padronizada de Coordenadas
O sistema SHALL tratar erros de validação de regra de negócio (como coordenadas negativas) com status 400 Bad Request.

#### Scenario: Erro de coordenada negativa
- **WHEN** o `AddCommentUseCase` lança um `ValueError` de coordenadas
- **THEN** o sistema SHALL responder com status HTTP 400 e a mensagem de erro original da lógica de negócio.
