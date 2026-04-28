## 1. Setup de Dependências e Infraestrutura

- [ ] 1.1 Adicionar `pytest-cov` e `pytz` ao `requirements.txt`
- [ ] 1.2 Atualizar o `Dockerfile` para incluir a variável de ambiente `TZ=America/Sao_Paulo`
- [ ] 1.3 Atualizar o `docker-compose.yml` para garantir que o container da API use o fuso horário correto

## 2. Configuração do Timezone na Aplicação

- [ ] 2.1 Adicionar `TIMEZONE=America/Sao_Paulo` ao arquivo `.env` e ao `config.py` (Pydantic Settings)
- [ ] 2.2 Criar `backend/src/infrastructure/utils/time_service.py` com a lógica de `get_now()` com timezone forçado
- [ ] 2.3 Refatorar o Caso de Uso `AddCommentUseCase` para usar o `TimeService` em vez de gerar datas nulas ou locais do sistema (se aplicável)

## 3. Configuração de Test Coverage

- [ ] 3.1 Atualizar `backend/pytest.ini` para incluir as flags de coverage: `--cov=src --cov-report=term-missing --cov-report=html`
- [ ] 3.2 Garantir que a pasta `htmlcov` seja ignorada no `.gitignore`

## 4. Verificação Final

- [ ] 4.1 Executar a suíte de testes e validar a exibição do relatório de cobertura no terminal
- [ ] 4.2 Validar a criação da pasta `htmlcov` no backend
- [ ] 4.3 Criar um teste temporário para garantir que `get_now()` retorna o horário exato de São Paulo independente do host

## 5. Expansão de Cobertura (Sniper Strategy)

- [ ] 5.1 Implementar teste unitário para "Caminho Triste" (Post não encontrado) no `GetPostDetailUseCase`
- [ ] 5.2 Implementar teste unitário para `AddCommentUseCase` (Sucesso com coordenadas X,Y)
- [ ] 5.3 Implementar teste unitário para `AddCommentUseCase` (Erro: UserID inválido)
- [ ] 5.4 Implementar teste de integração para Rotas de Autenticação (Garantir 401 Unauthorized sem Token)

