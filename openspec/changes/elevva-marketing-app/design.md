# Design: Elevva Marketing App

## 1. Clean Architecture (As 4 Camadas Isoladas)
A engenharia de software acadêmica obriga que o **Domínio seja isolado de tecnologias externas**. O backend em FastAPI será fatiado estritamente nas seguintes camadas:
- **`domain/`**: Coração do sistema B2B. Classes puras Python (Entidades, Objetos de Valor e Contratos de Repositório). NADA de frameworks aqui.
- **`application/`**: Orquestração. Os Casos de Uso (Use Cases) que comandam o fluxo (ex: `AprovarPostUseCase`).
- **`infrastructure/`**: Onde as tecnologias sujas moram. Lógica do SQLAlchemy, geração da Pre-Signed URL do AWS S3, e o hash Bcrypt de senhas.
- **`presentation/`**: A interface de entrega REST. Rotas do FastAPI (`/posts`) e as validações Pydantic v2.

## 2. Topologia Docker e Orquestração
A infraestrutura será isoladamente replicável via `docker-compose.yml` usando a rede `elevva-net`.
- **Serviço `db` (PostgresSQL):** Opera na porta 5432 utilizando um volume persistente (`postgres_data`). O banco guarda os 4 CRUDs (Users, Calendars, Posts, Ideas).
- **Serviço `api` (FastAPI):** Expõe porta 8000. Conta com a regra absoluta de `depends_on`, que proíbe o boot caso o healthcheck do PostgreSQL falhe.
- **Serviço `web` (Next.js):** Construído no App Router explorando Server Components SSR. Comunica-se à API host na porta 3000.

## 3. Solução Cloud-First para Vídeos de 500MB
Se as instâncias de API processassem vídeos de 500MB em streaming, o custo de RAM escalaria infinitamente e derrubaria outras aprovações de clientes.
**Decisão:** O upload transfere a responsabilidade para a Cloud Distribuída.
1. O Front-end bate no FastAPI pedindo intenção de Upload. Submete o tamanho e tipo.
2. FastAPI gera uma **Pre-Signed URL** (Token efêmero assinado secretamente) via infraestrutura (AWS S3) e devolve.
3. Front-end injeta o arquivo binário num método `PUT` **diretamente* ao Bucket S3, isolado do Backend.
4. FastAPI guarda apenas o link em banco.

## 4. Segurança Camada Zero
Este projeto enforça rigidamente protocolos base de Segurança da Informação:
- Senhas MUST usar `Bcrypt` com salting iterativo dinâmico.
- Sessões MUST usar JWT (JSON Web Tokens) devidamente assinado.
- Uploads de vídeos (500MB) MUST usar Pre-Signed URLs nativas, engessando o bypass completo da API.
- O Isolamento de Dados B2B (Multi-tenancy) MUST impedir que um cliente corporativo acesse o board de outro.

## 5. Persistência Fixada (PostgreSQL + SQLAlchemy 2.0)
O banco de dados relacional MUST sustentar os 4 CRUDs essenciais. As Chaves Primárias MUST gerar um UUID v4 de identificação universal para inviabilizar listagem sequencial:
- Tabela `users`: name, email `UNIQUE`, password_hash (`Bcrypt`), role (`AGENCY/CLIENT`).
- Tabela `calendars`: Gerencia grupamentos temporais.
- Tabela `posts`: Componentes do Kanban B2B.
- Tabela `ideas`: Inbox colaborativo.
- Tabela `comments` (Pin Visual): Feedback com `coord_x` e `coord_y`.
