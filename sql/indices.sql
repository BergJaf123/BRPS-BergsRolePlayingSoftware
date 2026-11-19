-- Índice da consulta que a tela dos jogadores executa a cada 2 segundos
CREATE INDEX idx_tokens_sala_revelado ON tokens (sala_id, revelado);
