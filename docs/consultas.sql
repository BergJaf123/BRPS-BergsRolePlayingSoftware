-- Consulta 1 (JOIN + agregação): campanhas com a contagem de salas
SELECT c.id, c.nome, COUNT(s.id)::int AS salas
FROM campanhas c
LEFT JOIN salas s ON s.campanha_id = c.id
GROUP BY c.id
ORDER BY c.id DESC;

-- Consulta 2 (JOIN + filtro): tokens revelados de uma sala, com o nome da campanha
SELECT c.nome AS campanha, s.nome AS sala, t.nome AS token, t.x, t.y
FROM tokens t
JOIN salas s ON s.id = t.sala_id
JOIN campanhas c ON c.id = s.campanha_id
WHERE t.revelado = TRUE AND s.ativa = TRUE;

-- Consulta analisada (a que a tela dos jogadores faz): troque N pelo id da sala
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, nome, x, y, cor FROM tokens WHERE sala_id = N AND revelado = TRUE;

-- Índice criado depois da análise "antes"
CREATE INDEX idx_tokens_sala_revelado ON tokens (sala_id, revelado);
