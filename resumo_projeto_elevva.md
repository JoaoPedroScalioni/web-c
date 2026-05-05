# Dossiê de Arquitetura: Elevva Marketing (B2B Video Workflow)

Este documento descreve a infraestrutura, stack tecnológica e regras de negócio implementadas no projeto Elevva, focado na aprovação e revisão visual (PinCanvas) de mídias para agências e clientes.

---

## 1. Visão Geral da Arquitetura
O sistema foi concebido sob os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)** no backend, combinado com um frontend reativo fortemente tipado, eliminando completamente o uso de `any` no ciclo de vida dos dados. Toda a orquestração local é feita através do **Docker Compose**.

---

## 2. Backend (FastAPI + Python 3.12)
Localizado na pasta `/backend`. O backend foi projetado em camadas estritas para isolar as regras de negócio de frameworks externos.

### Tecnologias
- **FastAPI**: Roteamento, validação e documentação Swagger automática.
- **SQLAlchemy + PostgreSQL**: ORM e persistência de dados.
- **Pydantic V2**: Validação de dados rigorosa (Validação Sniper).
- **Alembic**: Controle de migrações do banco de dados.
- **JWT (OAuth2)**: Autenticação stateless (Camada Zero).

### Estrutura de Pastas (Clean Architecture)
- `/src/domain/`: O coração do sistema. Contém `entities.py` (modelos puros como `PostEntity`, `CommentEntity`), `exceptions.py` (erros de domínio) e as interfaces/contratos dos repositórios (`repositories.py`). Nenhuma biblioteca externa (ex: SQL) entra aqui.
- `/src/application/`: Contém os Casos de Uso (`use_cases.py`). Aqui ocorre a orquestração do domínio, injetando os repositórios (Dependency Injection). Ex: Criar post, Adicionar Pin de Comentário.
- `/src/infrastructure/`: Camada de detalhes técnicos. Contém:
  - `database.py`: Conexão com o PostgreSQL.
  - `models.py`: Tabelas do banco via SQLAlchemy.
  - `repositories_impl.py`: Implementação real das interfaces de banco de dados definidas no Domínio.
  - `s3_service.py` / `storage_impl.py`: Lógica para interagir com a AWS S3 (Geração de URL pre-signed para upload direto).
  - `security.py`: Motor de Hash e JWT.
- `/src/interfaces/`: Camada de apresentação/controladores.
  - `routes.py`: Endpoints expostos pelo FastAPI.
  - `schemas.py`: Contratos DTO de entrada e saída (Pydantic), onde ocorre a **Validação Sniper** (garantindo que coordenadas visuais X e Y fiquem exatamente entre 0 e 100).
  - `auth.py`: Rotas de geração de token.
  - `main.py`: Ponto de entrada do uvicorn, contendo a configuração de CORS permitindo o frontend (porta 3000) acessar a API.

---

## 3. Frontend (Next.js + TypeScript)
Localizado na pasta `/frontend`. Uma aplicação server-side rendering (SSR) com hidratação reativa onde a interatividade visual é necessária.

### Tecnologias
- **Next.js 14 (App Router)**: Framework React principal.
- **TanStack Query (React Query)**: Gerenciamento assíncrono de estado, cache, invalidação inteligente e tratamento de carregamento (`isLoading`).
- **OpenAPI TypeScript (`openapi-typescript`)**: O "Pulo do Gato". Uma ponte que lê o `openapi.json` gerado pelo FastAPI e escreve automaticamente um arquivo `api.ts` contendo todas as tipagens (schemas e responses) do backend para o React usar. Se o Python mudar, o TypeScript acusa erro no build.
- **Tailwind CSS**: Estilização visual utilitária.

### Estrutura de Pastas
- `/app/`: Usa a nova arquitetura do Next.js.
  - `layout.tsx`: Root layout configurado com o `QueryProvider`.
  - `page.tsx`: Página inicial.
  - `kanban/page.tsx`: A tela B2B (Cockpit do cliente/agência). Ela consome os Posts pendentes e plota o componente visual interativo.
- `/src/adapters/`: Padrão Adapter. Arquivo `post-service.ts` encapsula todas as chamadas HTTP (Fetch) para o FastAPI e provê os hooks do React Query (`usePendingPosts`, `useAddComment`), mantendo os componentes React limpos e livres de requisições cruas.
- `/src/components/`: Componentes visuais isolados.
  - `PinCanvas.tsx`: O diferencial core do negócio. Componente altamente interativo que renderiza a mídia de fundo e, via eventos de mouse (`e.nativeEvent.offsetX / offsetWidth`), calcula o clique exato do usuário, transforma em porcentagem (0-100%) e salva um Pin (Bolinha vermelha) no vídeo.
- `/src/types/`: Contém o `api.ts`, arquivo autogerado via script NPM sincronizado com o backend.

---

## 4. Banco de Dados e Storage
- **PostgreSQL**: Rodando containerizado via Docker, persistindo: Usuários, Agências, Calendários, Posts e Comments (Pins).
- **AWS S3 (Upload Intent)**: Para manter a performance e economizar banda e CPU do Backend, o sistema gera uma `Presigned URL` via backend, que é enviada ao frontend. O Frontend faz o upload do arquivo de vídeo pesado **direto** para a AWS S3 (Bypass).

---

## 5. Orquestração (Docker)
O `docker-compose.yml` na raiz rege a sinfonia. O sistema foi desenhado para inicializar de forma autônoma.
- **`webc-api`**: Container do FastAPI (porta 8000).
- **`elevva-db`**: Container do PostgreSQL (porta 5432).
- **`elevva-pgadmin`**: Interface administrativa do banco de dados (porta 5050).
- **`elevva-web`**: Container com Node.js rodando o frontend Next.js (porta 3000), executando `npm run dev`.

### Conclusão e Filosofia do Projeto
O Projeto Elevva não é um CRUD comum; ele se posiciona como um produto profissional (nível Pleno/Sênior). O uso da Clean Architecture garante que as regras de cálculo do `PinCanvas` e os estados (CRIADO, AGUARDANDO_APROVACAO) sejam validados na essência do domínio sem depender do banco. A tipagem fim-a-fim elimina "chutes" e garante segurança na evolução da plataforma.
