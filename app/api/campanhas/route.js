import { NextResponse } from "next/server";
import { getSql } from "../../../lib/sql";
import { gerarHash } from "../../../lib/codigo";

export const runtime = "nodejs";

// lista as campanhas (JOIN com as salas + contagem)
export async function GET() {
  try {
    const sql = getSql();
    const lista = await sql`
      SELECT c.id, c.nome, c.criado_em, COUNT(s.id)::int AS salas
      FROM campanhas c
      LEFT JOIN salas s ON s.campanha_id = c.id
      GROUP BY c.id
      ORDER BY c.id DESC
    `;
    return NextResponse.json(lista);
  } catch (e) {
    console.log("ERRO LISTAR:", e.message);
    return NextResponse.json({ erro: "Falha ao consultar o banco" }, { status: 500 });
  }
}

// cria uma campanha nova, já com a primeira sala
export async function POST(req) {
  let corpo;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Pedido inválido" }, { status: 400 });
  }
  const nome = String(corpo?.nome ?? "").trim();
  const codigo = String(corpo?.codigo ?? "");
  if (nome.length < 1 || nome.length > 80) {
    return NextResponse.json({ erro: "O nome deve ter de 1 a 80 caracteres" }, { status: 400 });
  }
  if (codigo.length < 4 || codigo.length > 40) {
    return NextResponse.json({ erro: "O código deve ter de 4 a 40 caracteres" }, { status: 400 });
  }

  try {
    const sql = getSql();
    const campanha = await sql.begin(async (tx) => {
      const [c] = await tx`
        INSERT INTO campanhas (nome, codigo_hash)
        VALUES (${nome}, ${gerarHash(codigo)})
        RETURNING id, nome
      `;
      await tx`
        INSERT INTO salas (campanha_id, nome, ativa)
        VALUES (${c.id}, 'Sala 1', TRUE)
      `;
      return c;
    });
    return NextResponse.json(campanha, { status: 201 });
  } catch (e) {
    if (e.code === "23505") {
      return NextResponse.json({ erro: "Já existe uma campanha com esse nome" }, { status: 409 });
    }
    console.log("ERRO CRIAR:", e.message);
    return NextResponse.json({ erro: "Falha ao gravar no banco" }, { status: 500 });
  }
}
