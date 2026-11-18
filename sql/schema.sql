-- BRPS: mesa virtual de RPG com IA para o mestre
-- Banco: PostgreSQL (Supabase). Acesso somente pelo servidor Next.js.

CREATE TABLE campanhas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE,
  codigo_hash TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE salas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campanha_id BIGINT NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
  nome VARCHAR(80) NOT NULL DEFAULT 'Sala 1',
  colunas INT NOT NULL DEFAULT 12 CHECK (colunas BETWEEN 3 AND 30),
  linhas INT NOT NULL DEFAULT 8 CHECK (linhas BETWEEN 3 AND 30),
  mascara JSONB,
  ativa BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tokens (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sala_id BIGINT NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
  nome VARCHAR(80) NOT NULL,
  x INT NOT NULL DEFAULT 0 CHECK (x >= 0),
  y INT NOT NULL DEFAULT 0 CHECK (y >= 0),
  cor VARCHAR(9) NOT NULL DEFAULT '#E24B4A',
  revelado BOOLEAN NOT NULL DEFAULT FALSE,
  imagem TEXT,
  hp INT CHECK (hp >= 0),
  hp_max INT CHECK (hp_max >= 1),
  ca INT CHECK (ca BETWEEN 1 AND 30),
  descricao TEXT,
  ataques JSONB NOT NULL DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Segurança: o Supabase cria uma API pública automática para as tabelas.
-- Ligando o RLS sem nenhuma política, essa API fica bloqueada.
-- O servidor Next.js acessa pela conexão direta do Postgres, que não é afetada.
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
