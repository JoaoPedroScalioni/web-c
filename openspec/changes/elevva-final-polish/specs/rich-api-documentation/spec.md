## ADDED Requirements

### Requirement: Documentação Interativa com Metadados
O sistema SHALL exibir no Swagger (/docs) descrições detalhadas e exemplos para todos os campos dos modelos Pydantic de entrada e saída.

#### Scenario: Visualização de campos no Swagger
- **WHEN** o usuário acessa a rota `/docs`
- **THEN** o sistema SHALL exibir descrições para campos como `coord_x`, `coord_y` e `status`, incluindo exemplos de valores esperados.

### Requirement: Documentação de Respostas de Erro
O sistema SHALL documentar no Swagger as possíveis respostas de erro (4xx, 5xx) para cada endpoint crítico.

#### Scenario: Exibição de Erros 404
- **WHEN** o endpoint `GET /posts/{id}` é visualizado na documentação
- **THEN** o sistema SHALL listar o status 404 como uma resposta possível com o modelo de erro correspondente.
