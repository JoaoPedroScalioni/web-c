CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria banco de testes para rodar localmente
SELECT 'CREATE DATABASE elevva_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'elevva_test')\gexec
