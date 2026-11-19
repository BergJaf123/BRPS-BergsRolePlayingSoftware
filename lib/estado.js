import { conferir } from "./codigo";

export function idValido(v) {
  return /^\d{1,15}$/.test(String(v)) ? String(v) : null;
}

export async function autorizar(sql, campanhaId, codigo) {
  const [c] = await sql`SELECT codigo_hash FROM campanhas WHERE id = ${campanhaId}`;
  if (!c) return "nao_existe";
  if (!codigo || !conferir(codigo, c.codigo_hash)) {
    await new Promise((r) => setTimeout(r, 600));
    return "negado";
  }
  return "ok";
}

// lê a sala ativa e os tokens. soPublico = só o que os jogadores podem ver
export async function carregarEstado(sql, campanhaId, soPublico) {
  const [sala] = await sql`
    SELECT id, colunas, linhas, mascara FROM salas
    WHERE campanha_id = ${campanhaId} AND ativa = TRUE
    ORDER BY id LIMIT 1
  `;
  if (!sala) return null;

  const mapa = { colunas: sala.colunas, linhas: sala.linhas, mascara: sala.mascara ?? null };

  if (soPublico) {
    const rows = await sql`
      SELECT id, nome, x, y, cor, imagem FROM tokens
      WHERE sala_id = ${sala.id} AND revelado = TRUE
      ORDER BY id
    `;
    return {
      mapa,
      tokens: rows.map((t) => ({
        id: Number(t.id),
        nome: t.nome,
        x: t.x,
        y: t.y,
        cor: t.cor,
        imagem: t.imagem ?? undefined,
        revelado: true,
      })),
    };
  }

  const rows = await sql`
    SELECT id, nome, x, y, cor, revelado, imagem, hp, hp_max, ca, descricao, ataques
    FROM tokens WHERE sala_id = ${sala.id}
    ORDER BY id
  `;
  return {
    mapa,
    tokens: rows.map((t) => ({
      id: Number(t.id),
      nome: t.nome,
      x: t.x,
      y: t.y,
      cor: t.cor,
      revelado: t.revelado,
      imagem: t.imagem ?? undefined,
      hp: t.hp ?? undefined,
      hpMax: t.hp_max ?? undefined,
      ca: t.ca ?? undefined,
      descricao: t.descricao ?? undefined,
      ataques: t.ataques ?? [],
    })),
  };
}

const inteiro = (v, min, max) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

// confere tudo que chega do navegador antes de gravar
export function validarEstado(corpo) {
  const m = corpo?.mapa;
  const colunas = inteiro(m?.colunas, 3, 30);
  const linhas = inteiro(m?.linhas, 3, 30);
  if (colunas === null || linhas === null) throw new Error("Tamanho do mapa inválido");

  let mascara = null;
  if (m.mascara != null) {
    const ok =
      Array.isArray(m.mascara) &&
      m.mascara.length === linhas &&
      m.mascara.every((r) => typeof r === "string" && r.length === colunas && /^[#.]+$/.test(r));
    if (!ok) throw new Error("Formato do mapa inválido");
    mascara = m.mascara;
  }

  if (!Array.isArray(corpo.tokens) || corpo.tokens.length > 60) {
    throw new Error("Tokens inválidos (máximo 60)");
  }

  const vistos = new Set();
  const tokens = corpo.tokens.map((t) => {
    const id = inteiro(t?.id, 1, Number.MAX_SAFE_INTEGER);
    if (id === null || vistos.has(id)) throw new Error("Token com id inválido");
    vistos.add(id);

    const x = inteiro(t.x, 0, colunas - 1);
    const y = inteiro(t.y, 0, linhas - 1);
    if (x === null || y === null) throw new Error("Token fora do mapa");

    const hp = t.hp == null ? null : inteiro(t.hp, 0, 9999);
    if (t.hp != null && hp === null) throw new Error("Vida inválida");
    let hpMax = t.hpMax == null ? null : inteiro(t.hpMax, 1, 9999);
    if (t.hpMax != null && hpMax === null) throw new Error("Vida máxima inválida");
    if (hp !== null && hpMax === null) hpMax = Math.max(1, hp);

    const ca = t.ca == null ? null : inteiro(t.ca, 1, 30);
    if (t.ca != null && ca === null) throw new Error("CA inválida");

    let imagem = null;
    if (t.imagem) {
      if (typeof t.imagem !== "string" || !t.imagem.startsWith("data:image/") || t.imagem.length > 200000) {
        throw new Error("Imagem inválida ou grande demais");
      }
      imagem = t.imagem;
    }

    return {
      id,
      nome: String(t.nome ?? "").trim().slice(0, 80) || "Sem nome",
      x,
      y,
      cor: /^#[0-9a-fA-F]{6}$/.test(t.cor) ? t.cor : "#E24B4A",
      revelado: Boolean(t.revelado),
      imagem,
      hp,
      hp_max: hpMax,
      ca,
      descricao: t.descricao ? String(t.descricao).slice(0, 2000) : null,
      ataques: Array.isArray(t.ataques)
        ? t.ataques.slice(0, 8).map((a) => String(a).slice(0, 200))
        : [],
    };
  });

  return { colunas, linhas, mascara, tokens };
}
