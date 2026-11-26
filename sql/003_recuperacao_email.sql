-- Campanhas anteriores continuam acessíveis pelo código do mestre.
ALTER TABLE campanhas
  ADD COLUMN email_recuperacao TEXT,
  ADD COLUMN usuario_recuperacao UUID,
  ADD COLUMN email_desafio TEXT,
  ADD COLUMN desafio_email UUID,
  ADD COLUMN desafio_enviado_em TIMESTAMPTZ,
  ADD COLUMN desafio_tentativas SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN sessao_email_hash TEXT,
  ADD COLUMN sessao_email_expira TIMESTAMPTZ,
  ADD CONSTRAINT recuperacao_vinculada CHECK (
    (email_recuperacao IS NULL) = (usuario_recuperacao IS NULL)
  );
