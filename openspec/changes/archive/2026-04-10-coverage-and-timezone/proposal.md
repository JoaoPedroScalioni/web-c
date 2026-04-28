## Why

A aplicação Elevva Marketing precisa de métricas de qualidade para garantir a confiabilidade das regras de negócio durante a expansão. Além disso, como um sistema B2B operando no Brasil, é crítico que todas as interações temporais (cronogramas, prazos de aprovação) sigam o fuso horário oficial `America/Sao_Paulo` para evitar inconsistências entre agências e clientes.

## What Changes

- **Test Coverage**: Integração do `pytest-cov` para medição de cobertura de código no backend.
- **Timezone Global**: Configuração do fuso horário `America/Sao_Paulo` no nível do sistema (Docker) e da aplicação (Python/FastAPI).
- **Relatórios de Qualidade**: Adição de comandos para geração de relatórios de cobertura em terminal e HTML.

## Capabilities

### New Capabilities
- `test-coverage`: Capacidade de executar testes com geração de relatórios de cobertura (statement e branch coverage).
- `regional-timezone-config`: Padronização de todas as datas e horários gerados pelo sistema para o fuso horário de São Paulo.

### Modified Capabilities
- Nenhuma capacidade existente teve seus requisitos alterados.

## Impact

- **Backend**: `pytest.ini` será atualizado; `requirements.txt` incluirá `pytest-cov`.
- **Infraestrutura**: `Dockerfile` e `docker-compose.yml` serão ajustados para configurar o `TZ`.
- **Domínio/Infra**: Utilitários de data precisarão ser revisados para garantir que usem o fuso horário configurado.
