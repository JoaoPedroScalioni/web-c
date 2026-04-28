# test-coverage Specification

## Purpose
TBD - created by archiving change coverage-and-timezone. Update Purpose after archive.
## Requirements
### Requirement: Mediçao de Cobertura de Código
O sistema SHALL ser capaz de medir a porcentagem de linhas de código executadas durante a suíte de testes do backend.

#### Scenario: Execução de testes com relatório de cobertura
- **WHEN** o desenvolvedor executa o comando de teste com a flag de cobertura no container da API
- **THEN** o sistema exibe um relatório no terminal listando todos os arquivos da pasta `src` e sua respectiva porcentagem de cobertura.

### Requirement: Relatório de Cobertura HTML
O sistema SHALL gerar um relatório visual em formato HTML que demonstre quais linhas específicas foram ou não cobertas pelos testes.

#### Scenario: Geração de relatório HTML
- **WHEN** os testes são encerrados
- **THEN** uma pasta `htmlcov` é criada na raiz do backend contendo os arquivos index.html para visualização detalhada.

