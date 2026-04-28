# Explore: Elevva Marketing App

## Foco de Exploração: Riscos de Nuvem e Latência de Rede

Durante a concepção técnica do pipeline de armazenamento secundário para a Elevva Marketing, levantamos incertezas cruciais quanto à escala da solução visual:

1. **Custos Exponenciais do Storage (S3)**: A agência realiza envios constantes de vídeos brutais (500MB). O risco de custo com *Egress* (Banda de saída) e manutenção em longo prazo na AWS precisará ser rigorosamente monitorado, dado que a arquitetura B2B exige redundância e versionamento.
2. **Latência de Rede e Timeouts de Bucket**: A geração criptográfica da Pre-signed URL via FastAPI deve ser quase instantânea. Contudo, clientes B2B com redes de escritórios superlotadas podem sofrer timeout durante o upload nativo `PUT` do Next.js para a AWS. Investigar a necessidade de implementar fluxos de "Multipart Upload" com retry em pedaços se o timeout se tornar o padrão.
