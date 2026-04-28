# regional-timezone-config Specification

## Purpose
TBD - created by archiving change coverage-and-timezone. Update Purpose after archive.
## Requirements
### Requirement: Configuração de Fuso Horário de São Paulo
O sistema SHALL operar por padrão no fuso horário `America/Sao_Paulo` para todas as operações de data e hora geradas pela aplicação.

#### Scenario: Atribuição de data padrão
- **WHEN** um novo registro de banco de dados (ex: comentário ou post) é criado sem uma data explícita via aplicação
- **THEN** o sistema SHALL registrar o timestamp sincronizado com o fuso de São Paulo.

### Requirement: Centralização de Geração de Tempo
A aplicação SHALL utilizar um serviço centralizado (TimeService) para obter o tempo atual, evitando chamadas diretas a bibliotecas externas dispersas pelo código.

#### Scenario: Injeção de TimeService
- **WHEN** um Caso de Uso necessita da hora atual para validar um prazo
- **THEN** ele SHALL invocar o método `get_now()` do `TimeService`, que retornará um objeto `datetime` com o timezone correto embutido.

