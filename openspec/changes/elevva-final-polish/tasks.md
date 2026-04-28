## 1. Global Exception Handling (Resiliência)

- [ ] 1.1 Criar base `DomainException` em `src/domain/exceptions.py`
- [ ] 1.2 Criar exceções específicas: `PostNotFoundError`, `InvalidCoordinateError`
- [ ] 1.3 Implementar `global_exception_handler` em `backend/src/interfaces/main.py`
- [ ] 1.4 Refatorar Caso de Uso `GetPostDetailUseCase` para disparar `PostNotFoundError` em vez de retornar `None`
- [ ] 1.5 Refatorar Caso de Uso `AddCommentUseCase` para disparar `InvalidCoordinateError` em vez de `ValueError`

## 2. Abstração de Storage (Desacoplamento)

- [ ] 2.1 Definir interface `StorageRepository` em `src/domain/repositories.py`
- [ ] 2.2 Implementar `S3StorageRepository` em `src/infrastructure/storage_impl.py` movendo a lógica do S3 anterior
- [ ] 2.3 Atualizar rotas de upload para utilizar a nova interface injetada
- [ ] 2.4 (Opcional) Criar `LocalStorageRepository` para uso em ambiente de testes sem S3

## 3. Swagger 2.0 (Documentação Profissional)

- [ ] 3.1 Adicionar metadados `Field(description, example)` em `src/domain/entities.py` (Coordinate, PostEntity, CommentEntity)
- [ ] 3.2 Adicionar metadados nos modelos de Request/Response em `src/interfaces/schemas.py`
- [ ] 3.3 Configurar respostas de erro explícitas nas rotas do FastAPI (responses={}, status_code)

## 4. Seed Narrative (Storytelling de Apresentação)

- [ ] 4.1 Expandir o script `backend/seed_db.py` com dados de campanha da vida real (Storytelling)
- [ ] 4.2 Garantir que o script limpe o banco de dados antes da execução (Clean State)
- [ ] 4.3 Validar se o seeding funciona corretamente no container Docker
