import { NextResponse } from "next/server";
import { getSql } from "../../../../../lib/sql";
import { idValido, carregarEstado } from "../../../../../lib/estado";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const id = idValido(params.id);
  if (!id) return NextResponse.json({ erro: "Campanha inválida" }, { status: 400 });
  try {
    const estado = await carregarEstado(getSql(), id, true);
    if (!estado) return NextResponse.json({ erro: "Campanha não encontrada" }, { status: 404 });
    return NextResponse.json(estado, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.log("ERRO ESTADO:", e.message);
    return NextResponse.json({ erro: "Falha ao consultar o banco" }, { status: 500 });
  }
}
