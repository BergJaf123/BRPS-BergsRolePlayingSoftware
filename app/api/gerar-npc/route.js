import { NextResponse } from "next/server";

const MODELO = "qwen/qwen3.8-27b"; // confere o nome atual no console da Groq

function simulado(pedido) {
  return {
    nome: "Goblin xamã (simulado)",
    descricao: `Rascunho de teste para: "${pedido}". Pequeno, esperto, cheio de talismãs.`,
    hp: 14,
    ca: 12,
    ataques: [
      "Cajado de fogo: +4 para acertar, 1d8 de dano",
      "Maldição fraca: alvo faz teste de Sabedoria",
    ],
  };
}

function validar(bruto) {
  const num = (v, min, max, padrao) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : padrao;
  };
  return {
    nome: String(bruto.nome || "Sem nome").slice(0, 60),
    descricao: String(bruto.descricao || "").slice(0, 500),
    hp: num(bruto.hp, 1, 999, 10),
    ca: num(bruto.ca, 1, 30, 10),
    ataques: Array.isArray(bruto.ataques)
      ? bruto.ataques.slice(0, 5).map((a) => String(a).slice(0, 120))
      : [],
  };
}

export async function POST(req) {
  const corpo = await req.json().catch(() => null);
  const pedido = typeof corpo?.pedido === "string" ? corpo.pedido.trim() : "";
  if (!pedido || pedido.length > 300) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }

  const chave = process.env.GROQ_API_KEY;
  if (!chave) {
    return NextResponse.json({ npc: simulado(pedido), simulado: true });
  }

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify({
        model: MODELO,
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Você ajuda um mestre de RPG de mesa. Gere UM personagem ou inimigo conforme o pedido, em português do Brasil. Responda SOMENTE com JSON neste formato: {"nome": string, "descricao": string, "hp": número, "ca": número, "ataques": [string]}. Os números são apenas sugestões, o mestre decide as regras.',
          },
          { role: "user", content: pedido },
        ],
      }),
    });
    if (!r.ok) throw new Error(`Groq respondeu com status ${r.status}`);
    const dados = await r.json();
    const texto = dados.choices?.[0]?.message?.content ?? "";
    const ini = texto.indexOf("{");
    const fim = texto.lastIndexOf("}");
    const bruto = JSON.parse(texto.slice(ini, fim + 1));
    return NextResponse.json({ npc: validar(bruto) });
  } catch (e) {
    console.log("ERRO NA ROTA:", e.message);
    return NextResponse.json(
      { error: "A IA não respondeu direito. Tenta de novo." },
      { status: 502 }
    );
  }
}
