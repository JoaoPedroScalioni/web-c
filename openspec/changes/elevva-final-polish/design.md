## Context

A aplicação Elevva Marketing amadureceu tecnicamente, atingindo 82% de cobertura de código. Porém, para uma entrega de nível B2B Profissional, precisamos desacoplar a infraestrutura de storage (S3) do domínio e garantir que falhas de lógica de negócio (ex: Post não encontrado) sejam reportadas de forma limpa via HTTP, sem expor tracebacks ou exigir blocos try/except repetitivos nas rotas.

## Goals / Non-Goals

**Goals:**
- Desacoplar a lógica de armazenamento da implementação do SDK da AWS.
- Centralizar a conversão de erros de domínio em códigos de status HTTP.
- Melhorar a auto-documentação da API para facilitar o onboarding de parceiros.
- Criar um conjunto de dados ricos para demonstração visual.

**Non-Goals:**
- Não trocaremos o provedor S3 agora, apenas criaremos a abstração.
- Não implementaremos tratamento de erro para falhas de rede de baixo nível (TCP/IP).

## Decisions

### 1. Unified Error Mapping (FastAPI Exception Handlers)
**Rationale:** Utilizaremos `app.exception_handler(DomainException)` para interceptar erros lançados nos Use Cases. Isso permite que o desenvolvedor foque na lógica de negócio (`raise PostNotFoundError`) enquanto a infraestrutura cuida da resposta HTTP (404 Not Found).
- *Alternatives:* Middleware global (mais difícil de tipar exceções específicas).

### 2. Storage Repository Pattern
**Rationale:** Criaremos uma interface abstrata `StorageRepository` no Domínio. Isso permite que Casos de Uso que precisam gerar URLs de upload ou deletar arquivos não saibam que o S3 existe. A implementação concreta em `Infrastructure` usará o Boto3.
- *Alternatives:* Injeção direta de `S3CloudService` (mantém o acoplamento).

### 3. Pydantic Descriptive Metadata (`Field`)
**Rationale:** Utilizaremos `Field` com `description` e `examples` nos modelos Pydantic. Isso gera um Swagger interativo e auto-explicativo sem necessidade de documentação externa.

## Risks / Trade-offs

- **[Risco]** Aumentar a complexidade do código com mais uma camada de abstração (Storage) → **Mitigação**: O ganho em testabilidade (podendo usar um Storage local em memória para testes) compensa a pequena carga cognitiva extra.
- **[Risco]** Captura genérica demais de erros escondendo bugs reais → **Mitigação**: O handler global logará o erro original e apenas formatará a resposta para o cliente final.
