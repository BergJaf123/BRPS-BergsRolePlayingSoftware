import { NextResponse } from "next/server";

const MODELO = "qwen/qwen3.8-27b";

function simulado() {
  const mascara = [];
  for (let y = 0; y < 14; y++) mascara.push(y < 10 ? "...####" : "#######");
  return { nome: "L invertido (simulado)", colunas: 7, linhas: 14, mascara };
}

function desdeRetangulos(colunas, linhas, rets) {
  const grade = Array.from({ length: linhas }, () => Array(colunas).fill("."));
  for (const r of rets) {
    const x = Math.round(Number(r?.x));
    const y = Math.round(Number(r?.y));
    const w = Math.round(Number(r?.w));
    const h = Math.round(Number(r?.h));
    if (![x, y, w, h].every(Number.isFinite)) continue;
    for (let yy = Math.max(0, y); yy < Math.min(linhas, y + h); yy++)
      for (let xx = Math.max(0, x); xx < Math.min(colunas, x + w); xx++)
        grade[yy][xx] = "#";
  }
  return grade.map((l) => l.join(""));
}

function validar(b) {
  const lim = (v, padrao) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(30, Math.max(3, n)) : padrao;
  };
  const colunas = lim(b.colunas, 12);
  const linhas = lim(b.linhas, 8);

  let mascara = null;
  if (Array.isArray(b.retangulos) && b.retangulos.length) {
    mascara = desdeRetangulos(colunas, linhas, b.retangulos);
  } else if (Array.isArray(b.mascara)) {
    mascara = Array.from({ length: linhas }, (_, y) => {
      const s = String(b.mascara[y] ?? "");
      return Array.from({ length: colunas }, (_, x) => (s[x] === "#" ? "#" : ".")).join("");
    });
  }
  if (!mascara || !mascara.some((r) => r.includes("#"))) {
    mascara = Array.from({ length: linhas }, () => "#".repeat(colunas));
  }
  return { nome: String(b.nome || "Sala").slice(0, 60), colunas, linhas, mascara };
}

export async function POST(req) {
  const { pedido } = await req.json();
  if (!pedido || typeof pedido !== "string" || pedido.length > 300) {
    return NextResponse.json({ error: "Pedido inválido" }, { status: 400 });
  }

  const chave = process.env.GROQ_API_KEY;
  if (!chave) {
    return NextResponse.json({ mapa: simulado(), simulado: true });
  }

  const instrucao = `Você ajuda um mestre de RPG de mesa a desenhar o mapa de uma sala em grade. Responda SOMENTE com JSON neste formato: {"nome": string, "colunas": número, "linhas": número, "retangulos": [{"x": número, "y": número, "w": número, "h": número}]}.
"retangulos" descreve o chão da sala como a união de retângulos. x é a coluna e y é a linha, contadas a partir de 0 no canto superior esquerdo. w é a largura e h é a altura, em casas. Tudo fora dos retângulos é vazio.
Se o pedido informar largura e altura, use colunas = largura e linhas = altura, exatamente. Máximo de 30 em cada. Os retângulos devem ficar dentro do mapa e se tocar, para o chão ser todo conectado.
Exemplo de um L normal (parte vertical à esquerda e base embaixo) com 7 colunas e 14 linhas: {"nome":"Sala em L","colunas":7,"linhas":14,"retangulos":[{"x":0,"y":0,"w":3,"h":14},{"x":0,"y":11,"w":7,"h":3}]}.
Adapte esse raciocínio ao formato pedido (L, L invertido, T, U, corredor, cruz etc.), girando ou espelhando as partes conforme a descrição.`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify({
        model: MODELO,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: instrucao },
          { role: "user", content: pedido },
        ],
      }),
    });
    const dados = await r.json();
    const texto = dados.choices?.[0]?.message?.content ?? "";
    console.log("MAPA DA IA:", texto.slice(0, 700));
    const bruto = JSON.parse(texto.slice(texto.indexOf("{"), texto.lastIndexOf("}") + 1));
    return NextResponse.json({ mapa: validar(bruto) });
  } catch (e) {
    console.log("ERRO GERAR MAPA:", e.message);
    return NextResponse.json(
      { error: "A IA não respondeu direito. Tenta de novo." },
      { status: 502 }
    );
  }
}
