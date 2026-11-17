"use client";
import { useEffect, useState } from "react";
import Mapa from "./Mapa";

export default function PainelMapa({ mapa, onAplicar }) {
  const [larg, setLarg] = useState(String(mapa.colunas));
  const [alt, setAlt] = useState(String(mapa.linhas));
  const [pedido, setPedido] = useState("");
  const [rascunho, setRascunho] = useState(null);
  const [simulado, setSimulado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    setLarg(String(mapa.colunas));
    setAlt(String(mapa.linhas));
  }, [mapa.colunas, mapa.linhas]);

  function aplicarRetangulo() {
    const c = parseInt(larg, 10);
    const l = parseInt(alt, 10);
    if (!(c >= 3 && c <= 30 && l >= 3 && l <= 30)) {
      setErro("Use valores de 3 a 30.");
      return;
    }
    setErro("");
    onAplicar({ colunas: c, linhas: l, mascara: null });
  }

  async function gerar() {
    setErro("");
    setCarregando(true);
    try {
      const r = await fetch("/api/gerar-mapa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erro ao gerar");
      setRascunho(d.mapa);
      setSimulado(Boolean(d.simulado));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  function usar() {
    onAplicar({
      colunas: rascunho.colunas,
      linhas: rascunho.linhas,
      mascara: rascunho.mascara,
    });
    setRascunho(null);
    setPedido("");
  }

  const prev = rascunho
    ? Math.max(10, Math.min(24, Math.floor(280 / Math.max(rascunho.colunas, rascunho.linhas))))
    : 0;

  return (
    <div style={{ border: "1px solid #888", borderRadius: 8, padding: 10 }}>
      <h2 style={{ marginTop: 0 }}>Mapa</h2>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          Largura{" "}
          <input value={larg} onChange={(e) => setLarg(e.target.value.replace(/\D/g, ""))} style={{ width: 44, padding: 4 }} />
        </label>
        <label>
          Altura{" "}
          <input value={alt} onChange={(e) => setAlt(e.target.value.replace(/\D/g, ""))} style={{ width: 44, padding: 4 }} />
        </label>
        <button onClick={aplicarRetangulo}>Aplicar retângulo</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <input
          value={pedido}
          onChange={(e) => setPedido(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && pedido.trim() && !carregando && gerar()}
          placeholder="ex: grid em L invertido, 7 de largura e 14 de altura"
          style={{ width: "100%", boxSizing: "border-box", padding: 6 }}
        />
        <button onClick={gerar} disabled={carregando || !pedido.trim()} style={{ marginTop: 6 }}>
          {carregando ? "Gerando..." : "Gerar mapa"}
        </button>
      </div>

      {erro && <p style={{ color: "#A32D2D", fontSize: 13 }}>{erro}</p>}

      {rascunho && (
        <div style={{ marginTop: 10 }}>
          {simulado && <p style={{ fontSize: 12 }}>Modo simulado (sem chave da IA).</p>}
          <div style={{ fontSize: 13, marginBottom: 6 }}>
            <b>{rascunho.nome}</b> — {rascunho.colunas} x {rascunho.linhas}
          </div>
          <div style={{ overflow: "auto" }}>
            <Mapa
              tokens={[]}
              colunas={rascunho.colunas}
              linhas={rascunho.linhas}
              mascara={rascunho.mascara}
              tamanho={prev}
            />
          </div>
          <p style={{ fontSize: 12 }}>
            Tokens que ficarem fora do chão vão para as primeiras casas livres.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={usar}>Usar este mapa</button>
            <button onClick={() => setRascunho(null)}>Descartar</button>
          </div>
        </div>
      )}
    </div>
  );
}
