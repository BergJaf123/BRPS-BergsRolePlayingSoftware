export const ehChao = (mascara, x, y) => !mascara || mascara[y]?.[x] === "#";

// coloca de volta no chão os tokens que ficaram fora do mapa novo
export function reposicionar(tokens, mapa) {
  const livres = [];
  for (let y = 0; y < mapa.linhas; y++)
    for (let x = 0; x < mapa.colunas; x++)
      if (ehChao(mapa.mascara, x, y)) livres.push([x, y]);

  const dentro = (t) =>
    t.x >= 0 && t.x < mapa.colunas && t.y >= 0 && t.y < mapa.linhas &&
    ehChao(mapa.mascara, t.x, t.y);

  const ocupadas = new Set();
  tokens.filter(dentro).forEach((t) => ocupadas.add(`${t.x},${t.y}`));

  return tokens.map((t) => {
    if (dentro(t)) return t;
    const c = livres.find(([x, y]) => !ocupadas.has(`${x},${y}`)) ?? livres[0] ?? [0, 0];
    ocupadas.add(`${c[0]},${c[1]}`);
    return { ...t, x: c[0], y: c[1] };
  });
}
