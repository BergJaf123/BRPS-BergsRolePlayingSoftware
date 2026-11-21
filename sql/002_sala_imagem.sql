-- Imagem que representa a sala e se os jogadores podem vê-la
ALTER TABLE salas
  ADD COLUMN imagem TEXT,
  ADD COLUMN imagem_visivel BOOLEAN NOT NULL DEFAULT FALSE,
  ADD CONSTRAINT salas_imagem_tamanho CHECK (imagem IS NULL OR length(imagem) <= 600000);
