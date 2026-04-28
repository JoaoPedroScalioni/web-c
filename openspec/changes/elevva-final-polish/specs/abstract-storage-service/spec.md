## ADDED Requirements

### Requirement: Interface Abstrata de Storage
O sistema SHALL possuir uma interface que defina as operações de armazenamento de mídia, permitindo diferentes implementações (AWS S3, Local, Mock).

#### Scenario: Geração de URL de upload via Interface
- **WHEN** uma rota de "upload intent" é chamada
- **THEN** o sistema SHALL invocar o `StorageRepository.generate_upload_url`, independente da nuvem utilizada.

### Requirement: Persistência Cloud-First (S3)
O sistema SHALL implementar o `StorageRepository` utilizando AWS S3 para produção.

#### Scenario: Execução em produção
- **WHEN** as credenciais da AWS estão presentes
- **THEN** o sistema SHALL utilizar o `S3StorageRepository` para gerenciar as Pre-Signed URLs.
