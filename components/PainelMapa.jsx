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
    <section className="cartao pilha" aria-labelledby="titulo-mapa">
      <h2 id="titulo-mapa">Configurar mapa</h2>
      <div className="acoes acoes-campos">
        <label className="rotulo">Largura
          <input className="campo campo-numero" inputMode="numeric" value={larg}
            onChange={(e) => setLarg(e.target.value.replace(/\D/g, ""))} />
        </label>
        <label className="rotulo">Altura
          <input className="campo campo-numero" inputMode="numeric" value={alt}
            onChange={(e) => setAlt(e.target.value.replace(/\D/g, ""))} />
        </label>
        <button className="botao" onClick={aplicarRetangulo}>Aplicar retângulo</button>
      </div>
      <div>
        <label className="rotulo" htmlFor="pedido-mapa">Descrição do mapa para a IA</label>
        <input
          className="campo" id="pedido-mapa"
          value={pedido}
          onChange={(e) => setPedido(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && pedido.trim() && !carregando && gerar()}
          placeholder="Ex. mapa em L, com 7 por 14 casas"
        />
      </div>
      <button className="botao" onClick={gerar} disabled={carregando || !pedido.trim()}>
        {carregando ? "Gerando..." : "Gerar mapa"}
      </button>
      {erro && <p className="aviso-erro" role="alert">{erro}</p>}
      {rascunho && (
        <div className="rascunho pilha">
          {simulado && <p className="aviso">Modo simulado (sem chave da IA).</p>}
          <h3>{rascunho.nome} · {rascunho.colunas} × {rascunho.linhas}</h3>
          <div className="area-mapa">
            <Mapa tokens={[]} colunas={rascunho.colunas} linhas={rascunho.linhas}
              mascara={rascunho.mascara} tamanho={prev} />
          </div>
          <small>Tokens que ficarem fora do chão vão para as primeiras casas livres.</small>
          <div className="acoes">
            <button className="botao botao-primario" onClick={usar}>Usar este mapa</button>
            <button className="botao" onClick={() => setRascunho(null)}>Descartar</button>
          </div>
        </div>
      )}
    </section>
  );
}
