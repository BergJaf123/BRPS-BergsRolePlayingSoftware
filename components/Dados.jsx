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
    <section className="cartao pilha" aria-labelledby="titulo-dados">
      <h2 id="titulo-dados">Dados</h2>
      <div className="acoes dados-rapidos">
        {[4, 6, 8, 10, 12, 20].map((n) => (
          <button className="botao" key={n} onClick={() => fazer(`1d${n}`)}>d{n}</button>
        ))}
      </div>
      <div>
        <label className="rotulo" htmlFor="expressao-dados">Expressão dos dados</label>
        <div className="acoes">
          <input
            className="campo campo-flex"
            id="expressao-dados"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && texto.trim() && fazer(texto)}
            placeholder="Ex. 2d6+3"
          />
          <button className="botao" onClick={() => fazer(texto)} disabled={!texto.trim()}>Rolar</button>
        </div>
      </div>
      {erro && <p className="aviso-erro" role="alert">{erro}</p>}
      {ultimo && (
        <div className="aviso-ok" role="status">
          <span>Total da rolagem</span>
          <strong className="total-dados" key={ultimo.id}>{ultimo.total}</strong>
          {ultimo.expr}: [{ultimo.dados.join(", ")}]
        </div>
      )}
      {historico.length > 1 && (
        <ul className="historico-dados" aria-label="Rolagens anteriores">
          {historico.slice(1).map((h) => <li key={h.id}>{h.expr} = {h.total}</li>)}
        </ul>
      )}
    </section>
  );
}
