# Roadmap de Tarefas (Fase 2: Implementação)

Este cronograma deve seguir rigorosamente a metodologia TDD (Test-Driven Development). Nenhuma rota web pode existir antes da entidade que a governa estar testada.

## 1. Infraestrutura Docker e Configuração (TDD Nível Zero)
- [ ] 1.1 Criar o `docker-compose.yml` na raiz mapeando a topologia tripla: `db` (PostgreSQL), `api` (FastAPI) e `web` (Next.js).
- [ ] 1.2 Configurar arquivos `.env` e `.env.example` protegendo as rotas e chaves AWS/JWT.
- [ ] 1.3 Inicializar container de banco `db` e garantir conexões saudáveis no Healthcheck.

## 2. Núcleo do Domínio (TDD de Regras Puras)
- [ ] 2.1 **TDD:** Criar Suite de Testes puras (Pytest/Vitest) para a entidade `Post`, `User`, e os Objetos de Valor de `Coordinate` (X,Y).
- [ ] 2.2 **Implementação:** Codificar as lógicas e Entidades B2B independentes de banco na pasta `domain/`.
- [ ] 2.3 **TDD:** Definir os contratos das interfaces dos Repositórios para a Camada 3.

## 3. Camada de Aplicação (TDD de Casos de Uso)
- [x] 3.1 **TDD:** Escrever testes de orquestração injetando repositórios Falsos/Mocks nos Use Cases.
- [x] 3.2 **Implementação:** Construir a orquestração na pasta `application/` (`ApprovePostUseCase`, `UploadMediaIntentUseCase`).

## 4. Camada de Infraestrutura e Adaptadores (TDD Concreto)
- [x] 4.1 **TDD/Implementação:** Adicionar os modelos concretos via SQLAlchemy e efetivar testes de Banco na pasta `infrastructure/`.
- [x] 4.2 **Implementação:** Codificar o hash de Bcrypt e a liberação das Pre-signed URLs no S3.

## 5. Interface de Entrega Web (Rotas e TDD de Contrato)
- [x] 5.1 **TDD:** Executar o ciclo implacável *Red-Green-Refactor* para todas as rotas de aprovação de posts no FastAPI. Começar com `TestClient` falhando severamente, resolver a dependência Mock, passar (Green) e consolidar rotas.
- [x] 5.2 **Implementação:** Construir as Rotas testadas na pasta `presentation/` servindo os Endpoints HTTP consumindo o Validation Pydantic v2.
- [x] 5.3 **Integração E2E:** Setup Next.js com Tailwind/Shadcn UI puxando dados através dos Server Components e Polling de UI via Kanban.
