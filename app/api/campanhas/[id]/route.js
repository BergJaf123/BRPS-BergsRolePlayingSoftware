import { NextResponse } from "next/server";
import { getSql } from "../../../../lib/sql";
import { idValido, autorizar } from "../../../../lib/estado";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req, { params }) {
  const id = idValido(params.id);
  let corpo = null;
  try {
    corpo = await req.json();
  } catch {}
  if (!id || !corpo) {
    return NextResponse.json({ erro: "Pedido inválido" }, { status: 400 });
  }
  try {
    const sql = getSql();
    const auth = await autorizar(sql, id, corpo.codigo);
    if (auth === "nao_existe") {
      return NextResponse.json({ erro: "Campanha não encontrada" }, { status: 404 });
    }
    if (auth !== "ok") {
      return NextResponse.json({ erro: "Código do mestre incorreto" }, { status: 403 });
    }
    // as salas e os tokens saem junto (ON DELETE CASCADE)
    await sql`DELETE FROM campanhas WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.log("ERRO EXCLUIR:", e.message);
    return NextResponse.json({ erro: "Falha ao excluir no banco" }, { status: 500 });
  }
}
