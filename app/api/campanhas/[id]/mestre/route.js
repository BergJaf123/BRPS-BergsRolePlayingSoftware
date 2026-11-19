import { NextResponse } from "next/server";
import { getSql } from "../../../../../lib/sql";
import { idValido, autorizar, carregarEstado, validarEstado } from "../../../../../lib/estado";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function lerCorpo(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function recusar(situacao) {
  if (situacao === "nao_existe") {
    return NextResponse.json({ erro: "Campanha não encontrada" }, { status: 404 });
  }
  return NextResponse.json({ erro: "Código do mestre incorreto" }, { status: 403 });
}

// abre a campanha: confere o código e devolve o estado completo
export async function POST(req, { params }) {
  const id = idValido(params.id);
  const corpo = await lerCorpo(req);
  if (!id || !corpo) return NextResponse.json({ erro: "Pedido inválido" }, { status: 400 });
  try {
    const sql = getSql();
    const auth = await autorizar(sql, id, corpo.codigo);
    if (auth !== "ok") return recusar(auth);
    const estado = await carregarEstado(sql, id, false);
    if (!estado) return NextResponse.json({ erro: "Campanha sem sala ativa" }, { status: 404 });
    return NextResponse.json(estado, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.log("ERRO ABRIR:", e.message);
    return NextResponse.json({ erro: "Falha ao consultar o banco" }, { status: 500 });
  }
}

// salva o estado: troca o mapa e os tokens da sala ativa
export async function PUT(req, { params }) {
  const id = idValido(params.id);
  const corpo = await lerCorpo(req);
  if (!id || !corpo) return NextResponse.json({ erro: "Pedido inválido" }, { status: 400 });

  let dados;
  try {
    dados = validarEstado(corpo);
  } catch (e) {
    return NextResponse.json({ erro: e.message }, { status: 400 });
  }

  try {
    const sql = getSql();
    const auth = await autorizar(sql, id, corpo.codigo);
    if (auth !== "ok") return recusar(auth);

    const gravou = await sql.begin(async (tx) => {
      await tx`SET LOCAL lock_timeout = '5s'`;
      const [sala] = await tx`
        SELECT id FROM salas
        WHERE campanha_id = ${id} AND ativa = TRUE
        ORDER BY id LIMIT 1 FOR UPDATE
      `;
      if (!sala) return false;
      await tx`
        UPDATE salas
        SET colunas = ${dados.colunas}, linhas = ${dados.linhas},
            mascara = ${dados.mascara === null ? null : tx.json(dados.mascara)}
        WHERE id = ${sala.id}
      `;
      await tx`DELETE FROM tokens WHERE sala_id = ${sala.id}`;
      if (dados.tokens.length > 0) {
        await tx`
          INSERT INTO tokens
            (id, sala_id, nome, x, y, cor, revelado, imagem, hp, hp_max, ca, descricao, ataques)
          OVERRIDING SYSTEM VALUE
          SELECT t.id, ${sala.id}::bigint, t.nome, t.x, t.y, t.cor, t.revelado, t.imagem,
                 t.hp, t.hp_max, t.ca, t.descricao, t.ataques
          FROM jsonb_to_recordset(${tx.json(dados.tokens)}::jsonb) AS t(
            id bigint, nome text, x int, y int, cor text, revelado boolean, imagem text,
            hp int, hp_max int, ca int, descricao text, ataques jsonb
          )
        `;
      }
      return true;
    });

    if (!gravou) return NextResponse.json({ erro: "Campanha sem sala ativa" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e.code === "23505") {
      return NextResponse.json({ erro: "Conflito de ids de token" }, { status: 409 });
    }
    console.log("ERRO SALVAR:", e.message);
    return NextResponse.json({ erro: "Falha ao gravar no banco" }, { status: 500 });
  }
}
