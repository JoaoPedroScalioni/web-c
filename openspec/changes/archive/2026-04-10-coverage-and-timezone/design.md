## Context

O projeto Elevva Marketing está em fase de estruturação de qualidade (TDD) e conformidade regional. Atualmente, os testes rodam sem métricas de esforço (cobertura) e a aplicação assume o fuso horário padrão do servidor (UTC), o que causa confusão em agendamentos B2B no fuso de Brasília.

## Goals / Non-Goals

**Goals:**
- Implementar medição automática de cobertura de testes no pipeline de desenvolvimento.
- Garantir que todos os logs, registros de banco de dados e exibições sigam o fuso `America/Sao_Paulo`.
- Facilitar a visualização de relatórios de cobertura em HTML.

**Non-Goals:**
- Não automatizaremos o deploy em CI/CD neste momento.
- Não alteraremos dados históricos existentes no banco de dados (o banco está em fase inicial).

## Decisions

### 1. Ferramenta de Cobertura: Pytest-cov
**Rationale:** É o padrão de mercado para aplicações Python/Pytest. Oferece integração nativa, relatórios em múltiplos formatos (HTML, XML, Term) e suporta medição de branches.
- *Alternatives:* `coverage.py` puramente (exige configuração manual mais extensa via CLI).

### 2. Configuração de Timezone via Docker ENV e Python TZ
**Rationale:** Configurar `ENV TZ` no Docker garante que bibliotecas de baixo nível (e logs do SO) usem o fuso correto. No Python, utilizaremos a biblioteca nativa `zoneinfo` (Python 3.9+) ou `pytz` vinculada a uma configuração centralizada no `settings.py`.
- *Alternatives:* Converter fusos apenas na camada de apresentação (causa erros de lógica em agendamentos no domínio).

### 3. Centralização de Datas: TimeService (Infrastructure)
**Rationale:** Seguindo Clean Architecture, criaremos um serviço especializado para fornecer a "hora atual". Isso facilita o mocking em testes e garante que nenhum desenvolvedor use `datetime.now()` sem fuso acidentalmente.

## Risks / Trade-offs

- **[Risco]** Impacto de performance na execução de testes com coverage ligado → **Mitigação**: O coverage será ativado via flag específica ou configurado no `pytest.ini` com opção de desativar em execuções rápidas de dev.
- **[Risco]** Conflito entre fuso do Postgres e da App → **Mitigação**: O banco de dados continuará em UTC (melhor prática), mas o driver (SQLAlchemy) e a aplicação farão o mapeamento explícito para `America/Sao_Paulo`.
