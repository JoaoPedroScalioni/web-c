# Proposal: Elevva Marketing App

## Why
O método atual de aprovação de conteúdo entre a agência Elevva e seus clientes corporativos ocorre via WhatsApp, o que gera um caos operacional insustentável. Arquivos de vídeo brutais (até 500MB) expiram, históricos de feedback são perdidos em conversas longas e o tempo de ciclo da agência é destruído. A criação de um portal de aprovação focado no cliente B2B resolverá esse gargalo, alavancando as vendas e a retenção ao profissionalizar a entrega.

## What Changes
- **BREAKING CHANGE**: Substituição completa do fluxo síncrono de aprovação por chat via WhatsApp por um **Dashboard Kanban assíncrono B2B**.
- Implementação do **Pin Visual**, onde os clientes mapeiam correções através de coordenadas exatas (X, Y) na mídia em vez de textos longos.
- Transição do tráfego de mídia para um **Pipeline Cloud-First**, permitindo que o cliente gerencie vídeos brutais diretamente na nuvem, desafogando a operação dos servidores.

## Capabilities
### New Capabilities
- `visual-approval-pins`: O sistema **MUST** fornecer uma interface de anotação e **SHALL** vincular precisamente a marcação nas coordenadas flutuantes (X,Y).
- `kanban-workflow`: A aplicação **MUST** transitar publicações via motor de estado persistido (Criado, Aguardando, Aprovado, Rejeitado).
- `heavy-media-upload`: Mecanismo seguro de bypass do servidor para envio direto de arquivos grandes via Pre-Signed URLs.
- `b2b-authentication`: Tradicional fluxo seguro com Bcrypt e JWT exigido academicamente.

### Modified Capabilities
- N/A

## Impact
- **Arquitetura Web:** Desacoplamento do backend (FastAPI) e frontend (Next.js) para escalar sem engasgos de memória RAM.
- **Processos B2B:** Redução projetada de 70% no tempo de "vai-e-vem" de aprovações.
- **Infraestrutura:** Custo computacional baixo preservado ao não hospedar binários na máquina da API.
