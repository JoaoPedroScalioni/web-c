# Políticas Globais da Elevva Marketing (Enterprise)

Este documento define as regras de negócio de alto nível que governam TODOS os aplicativos, microsserviços e portais construídos para o ecossistema da Elevva Marketing. Nenhuma aplicação subordinada (como o `elevva-marketing-app`) pode sobrescrever estas diretrizes arquiteturais.

## 1. Governança de Autenticação e Privacidade

O ecossistema Elevva atende clientes B2B (credores corporativos de publicidade). Portanto, a segurança é a camada zero da empresa.

- **Criptografia Forte (Obrigatória):** O sistema SHALL armazenar todas as credenciais de usuários e clientes usando mecanismos de hash encriptado homologados pela indústria. Senhas em plaintext são banidas da infraestrutura de dados sob qualquer circunstância.
- **Isolamento B2B (Tenancy):** O sistema MUST garantir que a sessão de um Cliente jamais tenha visibilidade sobre o calendário ou o Kanban de outro Cliente (Multi-tenancy rígido por Agency/Client Role).
- **Tempo de Sessão Estrito:** Os tokens criptográficos de sessão MUST possuir uma política rígida de expiração temporal por questões de segurança.

## 2. Padrão de Interfaces UI/UX (Quiet Luxury)

A Elevva Marketing constrói sua marca sobre uma estética funcional e intencional.
- O sistema visual SHALL evitar o excesso de bordas saturadas e estímulos irrelevantes (Minimalismo B2B).
- Interfaces que requerem interação pesada do cliente (como aprovação de mídia) MUST reduzir a fricção com o máximo de feedback visual assíncrono possível.
