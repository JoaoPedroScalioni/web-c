## ADDED Requirements

### Requirement: Script de Seeding Narrativo
O sistema SHALL possuir um script automatizado para popular o banco de dados com uma narrativa de demonstração (storytelling).

#### Scenario: População para Apresentação
- **WHEN** o comando de seeding é executado
- **THEN** o banco de dados SHALL conter um usuário "Agency", uma campanha de teste, e pelo menos um Post com Pins Visuais simulando feedback de cliente.

### Requirement: Idempotência de Dados de Teste
O sistema SHALL garantir que a execução repetida do script de seeding não gere duplicatas inconsistentes (usar UPSERT ou limpar tabelas).

#### Scenario: Re-execução do seed
- **WHEN** o script de seeding é rodado pela segunda vez
- **THEN** o sistema SHALL atualizar os dados existentes ou manter o estado final sem erros de chave primária.
