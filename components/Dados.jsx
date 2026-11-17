"use client";
import { useState } from "react";

function rolar(texto) {
  const m = texto
    .replace(/\s/g, "")
    .toLowerCase()
    .match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!m) return null;
  const qtd = m[1] ? parseInt(m[1], 10) : 1;
  const lados = parseInt(m[2], 10);
  const mod = m[3] ? parseInt(m[3], 10) : 0;
  if (qtd < 1 || qtd > 50 || lados < 2 || lados > 1000) return null;
  const dados = Array.from({ length: qtd }, () => Math.floor(Math.random() * lados) + 1);
  const total = dados.reduce((a, b) => a + b, 0) + mod;
  const modTxt = mod > 0 ? `+${mod}` : mod < 0 ? `${mod}` : "";
  return { id: Date.now() + Math.random(), expr: `${qtd}d${lados}${modTxt}`, dados, total };
}

export default function Dados() {
  const [texto, setTexto] = useState("");
  const [historico, setHistorico] = useState([]);
  const [erro, setErro] = useState("");

  function fazer(expr) {
    const r = rolar(expr);
    if (!r) {
      setErro("Use o formato 2d6+3 (1 a 50 dados, 2 a 1000 lados).");
      return;
    }
    setErro("");
    setHistorico((h) => [r, ...h].slice(0, 6));
  }

  const ultimo = historico[0];

  return (
    <div style={{ border: "1px solid #888", borderRadius: 8, padding: 10 }}>
      <h2 style={{ marginTop: 0 }}>Dados</h2>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[4, 6, 8, 10, 12, 20].map((n) => (
          <button key={n} onClick={() => fazer(`1d${n}`)}>
            d{n}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && texto.trim() && fazer(texto)}
          placeholder="ex: 2d6+3"
          style={{ flex: 1, padding: 6, minWidth: 0 }}
        />
        <button onClick={() => fazer(texto)} disabled={!texto.trim()}>
          Rolar
        </button>
      </div>
      {erro && <p style={{ color: "#A32D2D", fontSize: 13 }}>{erro}</p>}
      {ultimo && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 32, fontWeight: 600 }}>{ultimo.total}</div>
          <div style={{ fontSize: 13 }}>
            {ultimo.expr}: [{ultimo.dados.join(", ")}]
          </div>
        </div>
      )}
      {historico.length > 1 && (
        <div style={{ marginTop: 8, fontSize: 12 }}>
          {historico.slice(1).map((h) => (
            <div key={h.id}>
              {h.expr} = {h.total}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
