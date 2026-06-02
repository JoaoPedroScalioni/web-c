# Guia Completo de Deploy — Elevva Marketing App

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Push para o GitHub](#2-push-para-o-github)
3. [Configurar Docker Hub](#3-configurar-docker-hub)
4. [Configurar Secrets no GitHub](#4-configurar-secrets-no-github)
5. [Pipeline CI/CD (Automático)](#5-pipeline-cicd-automático)
6. [Deploy no Render.com](#6-deploy-no-rendercom)
7. [Push Manual ao Docker Hub (Alternativa)](#7-push-manual-ao-docker-hub-alternativa)
8. [Rodar Testes Localmente](#8-rodar-testes-localmente)
9. [Verificar Deploy](#9-verificar-deploy)
10. [Diagrama da Arquitetura](#10-diagrama-da-arquitetura)

---

## 1. Pré-requisitos

Antes de começar, tenha em mãos:

| Item | Onde criar | Por quê |
|---|---|---|
| Conta no **GitHub** | https://github.com | Hospedar o código e rodar CI/CD |
| Conta no **Docker Hub** | https://hub.docker.com | Armazenar as imagens Docker |
| Conta no **Render** | https://dashboard.render.com | Fazer o deploy em produção |
| Conta no **Neon** | https://neon.tech | Banco PostgreSQL gerenciado (já tem) |

> ⚠️ **Já está tudo configurado localmente.** O `.env` já aponta para o Neon, e todo o código está pronto. Você só precisa subir para os serviços de nuvem.

---

## 2. Push para o GitHub

O repositório já existe (`JoaoPedroScalioni/web-c`). Você precisa commitar os novos arquivos e dar push:

```bash
# 1. Adiciona todos os arquivos novos (CI/CD, dockerignore, render.yaml, etc.)
git add .

# 2. Commita
git commit -m "feat: add CI/CD pipeline, Docker Hub push, Render deploy config"

# 3. Envia para o GitHub
git push origin main
```

> ✅ Quando der push, o GitHub Actions já vai tentar rodar. **Mas vai falhar** até configurar os secrets do Docker Hub (próximo passo).

---

## 3. Configurar Docker Hub

### 3.1. Criar um Access Token

1. Acesse https://hub.docker.com/settings/security
2. Clique em **New Access Token**
3. Preencha:
   - **Name**: `github-actions`
   - **Permissions**: `Read & Write`
4. Clique em **Generate**
5. **Copie o token gerado** (só aparece uma vez! Guarde em um lugar seguro)

### 3.2. Criar os repositórios (se quiser ver no site)

Não é obrigatório — o Docker Hub cria automaticamente no primeiro push. Mas se quiser criar manualmente:

1. Acesse https://hub.docker.com/repositories
2. Clique em **Create Repository**
3. Crie um repositório chamado **`elevva-api`** (público)
4. Crie um repositório chamado **`elevva-web`** (público)

---

## 4. Configurar Secrets no GitHub

No GitHub, vá em: **Settings → Secrets and variables → Actions**

Clique em **New repository secret** e adicione:

| Secret | Valor | Exemplo |
|---|---|---|
| `DOCKER_HUB_USERNAME` | Seu usuário do Docker Hub | `joaopedro` |
| `DOCKER_HUB_TOKEN` | Token que você gerou no passo 3.1 | `dckr_pat_abc123...` |

> ⚠️ **Esses são os únicos secrets necessários.** O resto das variáveis de ambiente já estão no `.env` ou são configuradas diretamente no Render.

---

## 5. Pipeline CI/CD (Automático)

### Como funciona

Toda vez que você der **push na branch `main`**:

```
Push no main
    │
    ▼
┌─────────────────────────────┐
│  Job: test-backend          │
│  • Sobe PostgreSQL service  │
│  • Instala dependências     │
│  • Roda Alembic migrations  │
│  • pytest unit + integração │
└─────────────┬───────────────┘
              │ (passou)
              ▼
┌─────────────────────────────┐
│  Job: test-frontend         │
│  • npm ci                   │
│  • npm run test:run         │
│  • npm run lint             │
└─────────────┬───────────────┘
              │ (passou)
              ▼
┌─────────────────────────────┐
│  Job: build-and-push        │
│  • Login no Docker Hub      │
│  • Build Dockerfile.prod    │
│  • Push elevva-api:latest   │
│  • Push elevva-web:latest   │
└─────────────┬───────────────┘
              │
              ▼
        Imagens no Docker Hub  🎉
```

### Para ver o progresso:

1. Acesse https://github.com/JoaoPedroScalioni/web-c/actions
2. Clique no workflow em execução para ver os logs ao vivo

### Se falhar:

- **Testes**: Corrija o erro, commite e push de novo
- **Docker Hub**: Verifique se os secrets estão corretos em Settings → Secrets
- **Dependências**: O log mostra exatamente onde parou

---

## 6. Deploy no Render.com

### 6.1. Conectar o repositório

1. Acesse https://dashboard.render.com
2. Clique em **New → Blueprint**
3. Conecte sua conta do GitHub
4. Selecione o repositório `JoaoPedroScalioni/web-c`
5. O Render vai detectar automaticamente o `render.yaml`

### 6.2. Preencher variáveis secretas

O Render vai pedir algumas variáveis que não podem ficar no `render.yaml`:

| Variável | Descrição | Como gerar |
|---|---|---|
| `JWT_SECRET_KEY` | Chave secreta JWT | Rode no terminal: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `AWS_ACCESS_KEY_ID` | Chave AWS S3 | Sua chave da AWS |
| `AWS_SECRET_ACCESS_KEY` | Secret AWS S3 | Sua secret da AWS |
| `S3_BUCKET_NAME` | Nome do bucket S3 | `elevva-uploads-prod` (ou seu bucket) |

### 6.3. O que o Render vai criar automaticamente

Baseado no `render.yaml`:

| Recurso | Nome | Tipo | Plano |
|---|---|---|---|
| Banco PostgreSQL | `elevva-db` | Banco gerenciado | Free ($0/mês) |
| API (FastAPI) | `elevva-api` | Web Service | Free |
| Frontend (Next.js) | `elevva-web` | Web Service | Free |

### 6.4. Finalizar

1. Clique em **Apply** (ou **Deploy Blueprint**)
2. Aguarde 5-10 minutos enquanto o Render constrói tudo
3. Quando terminar, o Render mostra as URLs:
   - API: `https://elevva-api.onrender.com`
   - Web: `https://elevva-web.onrender.com`
   - DB interno (não exposto publicamente)

### 6.5. Rodar migrations no banco do Render

Depois que a API estiver no ar, você precisa rodar as migrations no banco do Render:

**Opção A — Pelo terminal local:**
```bash
# Pega a connection string do banco no Render Dashboard
# (Render mostra em: Dashboard → elevva-db → Connections)

DATABASE_URL="postgresql+asyncpg://user:pass@host:5432/elevva" alembic upgrade head
```

**Opção B — Pelo terminal do próprio Render:**
1. No Render Dashboard, vá em `elevva-api` → **Shell**
2. Rode: `alembic upgrade head`

**Opção C — Automático via startup (se quiser):**
Atualmente não tem no código, mas podemos adicionar depois se preferir.

---

## 7. Push Manual ao Docker Hub (Alternativa)

Se quiser subir as imagens sem depender do CI (por exemplo, de outro computador):

```powershell
# 1. Login no Docker Hub
docker login -u "seu_usuario"

# 2. Rodar o script de push
.\scripts\docker-push.ps1 -DockerHubUsername "seu_usuario" -DockerHubToken "seu_token"
```

Ou manualmente:

```powershell
# Build
docker build -f Dockerfile.prod -t "seu_usuario/elevva-api:latest" .
docker build -f frontend/Dockerfile.prod -t "seu_usuario/elevva-web:latest" ./frontend

# Push
docker push "seu_usuario/elevva-api:latest"
docker push "seu_usuario/elevva-web:latest"
```

---

## 8. Rodar Testes Localmente

Antes de subir, sempre bom validar localmente:

### Backend
```bash
# Unitários
pytest backend/tests/unit -v

# Integração (precisa do PostgreSQL rodando)
pytest backend/tests/integration -v

# Tudo
pytest backend/tests -v --cov=backend/src
```

### Frontend
```bash
cd frontend
npm run test:run
npm run lint
```

### Tudo via Docker
```bash
docker-compose -f docker-compose.ci.yml up --abort-on-container-exit
```

---

## 9. Verificar Deploy

Depois de tudo no ar, faça essas verificações:

### 9.1. Health check da API
```bash
curl https://elevva-api.onrender.com/health
# Resposta esperada: {"status": "ok", "message": "Elevva API is operational."}
```

### 9.2. Swagger Docs
Acesse no navegador: `https://elevva-api.onrender.com/docs`

### 9.3. Frontend
Acesse no navegador: `https://elevva-web.onrender.com`

### 9.4. pgAdmin + Neon
1. Rode o Docker local: `docker-compose up -d pgadmin`
2. Acesse http://localhost:5050
3. Login: `admin@elevva.com` / `admin123`
4. Clique em **Add New Server**
   - **Name**: `Neon Production`
   - **Host**: `ep-still-hall-acbrv1yv-pooler.sa-east-1.aws.neon.tech`
   - **Database**: `neondb`
   - **User**: `neondb_owner`
   - **Password**: `npg_hmO4wxpMR5Ke`
   - **SSL**: `Require`

### 9.5. Docker Hub
Acesse: https://hub.docker.com/repositories
Você deve ver `elevva-api` e `elevva-web` com a tag `latest`.

---

## 10. Diagrama da Arquitetura

```
DESENVOLVIMENTO (Local)
┌─────────────────────────────────────────────────────────┐
│  docker-compose.yml                                     │
│  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐  │
│  │  db      │  │  minio   │  │  api   │  │  web     │  │
│  │(Postgres)│  │(S3 local)│  │(FastAPI)│  │(Next.js) │  │
│  └─────────┘  └──────────┘  └────────┘  └──────────┘  │
│  ┌──────────┐                                          │
│  │ pgadmin  │  ← http://localhost:5050                  │
│  └──────────┘                                          │
│       │                                                │
│       ▼ (conexão manual)                               │
│  ┌──────────┐                                          │
│  │  Neon DB │ ← API já usa em dev (via .env)            │
│  └──────────┘                                          │
└─────────────────────────────────────────────────────────┘

PRODUÇÃO
┌──────────────────────────────────────────────────────┐
│  GitHub Actions (CI/CD)                              │
│  ┌──────────┐  ┌────────────┐  ┌────────────────┐   │
│  │  Testes  │→ │  Build     │→ │  Docker Hub    │   │
│  │  Backend │  │  Imagens   │  │  (Registry)    │   │
│  │+ Frontend│  │  Docker    │  │  elevva-api    │   │
│  └──────────┘  └────────────┘  │  elevva-web    │   │
│                                └────────┬───────┘   │
└─────────────────────────────────────────┼───────────┘
                                          │
                                          ▼
┌──────────────────────────────────────────────────────┐
│  Render.com                                          │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────┐ │
│  │  PostgreSQL  │←─│  API       │←─│  Web (Next)  │ │
│  │  Gerenciado  │  │  FastAPI   │  │  Node.js     │ │
│  │  (Neon-like) │  │  Gunicorn  │  │  Standalone  │ │
│  └──────────────┘  └────────────┘  └──────────────┘ │
│                          │                           │
│                          ▼                           │
│                    Nginx Proxy (built-in do Render)  │
│                    https://app.elevva.com            │
└──────────────────────────────────────────────────────┘
```

---

## Checklist Final

- [ ] Código commitado e pushado no GitHub
- [ ] Docker Hub token criado
- [ ] Secrets `DOCKER_HUB_USERNAME` e `DOCKER_HUB_TOKEN` configurados no GitHub
- [ ] GitHub Actions rodou verde (✅)
- [ ] Imagens aparecem no Docker Hub
- [ ] Render Blueprint aplicado
- [ ] Render criou DB + API + Web
- [ ] Migrations rodadas no banco do Render
- [ ] Health check retorna 200
- [ ] Swagger docs acessível
- [ ] Frontend carrega no navegador
- [ ] pgAdmin conectado ao Neon
