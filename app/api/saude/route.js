import { NextResponse } from "next/server";
import { getSql } from "../../../lib/sql";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sql = getSql();
    const [c] = await sql`SELECT COUNT(*)::int AS total FROM campanhas`;
    return NextResponse.json({ ok: true, campanhas: c.total });
  } catch (e) {
    console.log("ERRO BANCO:", e.message);
    return NextResponse.json({ ok: false, erro: "Falha ao consultar o banco" }, { status: 500 });
  }
}
