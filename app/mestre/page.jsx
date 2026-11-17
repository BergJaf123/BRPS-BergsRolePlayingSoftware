"use client";
import { useEffect, useRef, useState } from "react";
import Mapa from "../../components/Mapa";
import { useJogo } from "../../lib/store";

// manda pros jogadores só o que eles podem ver (sem PV, CA, ataques)
const publico = (lista) =>
  lista
    .filter((t) => t.revelado)
    .map(({ id, nome, x, y, cor }) => ({ id, nome, x, y, cor, revelado: true }));

export default function Mestre() {
  const { tokens, mover, alternarRevelado, adicionar } = useJogo();
  const [sel, setSel] = useState(null);
  const [pedido, setPedido] = useState("");
  const [rascunho, setRascunho] = useState(null);
  const [simulado, setSimulado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const canal = useRef(null);
  const ultimos = useRef(tokens);

  useEffect(() => {
    const c = new BroadcastChannel("brps-mesa");
    canal.current = c;
    c.onmessage = (e) => {
      if (e.data.tipo === "pedir") {
        c.postMessage({ tipo: "estado", tokens: publico(ultimos.current) });
      }
    };
    return () => c.close();
  }, []);

  useEffect(() => {
    ultimos.current = tokens;
    canal.current?.postMessage({ tipo: "estado", tokens: publico(tokens) });
  }, [tokens]);

  async function gerar() {
    setErro("");
    setCarregando(true);
    try {
      const r = await fetch("/api/gerar-npc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erro ao gerar");
      setRascunho({ ...d.npc, ataquesTexto: d.npc.ataques.join("\n") });
      setSimulado(Boolean(d.simulado));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  function aprovar() {
    adicionar({
      nome: rascunho.nome,
      descricao: rascunho.descricao,
      hp: Number(rascunho.hp) || 1,
      ca: Number(rascunho.ca) || 10,
      ataques: rascunho.ataquesTexto.split("\n").filter(Boolean),
    });
    setRascunho(null);
    setPedido("");
  }

  const campo = (k) => (e) => setRascunho({ ...rascunho, [k]: e.target.value });
  const token = tokens.find((t) => t.id === sel);

  return (
    <main style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <section>
        <h1>Mestre</h1>
        <p>Clica num token pra selecionar e numa casa pra mover.</p>
        <Mapa
          tokens={tokens}
          selecionado={sel}
          onToken={setSel}
          onCelula={(x, y) => sel && mover(sel, x, y)}
        />
        <div style={{ marginTop: 12 }}>
          {token ? (
            <div>
              <button onClick={() => alternarRevelado(token.id)}>
                {token.revelado ? "Ocultar" : "Revelar"} {token.nome}
              </button>
              {token.hp && (
                <p>
                  <b>{token.nome}</b> — PV {token.hp} | CA {token.ca}
                  <br />
                  {token.descricao}
                  <br />
                  {(token.ataques || []).map((a, i) => (
                    <span key={i}>
                      • {a}
                      <br />
                    </span>
                  ))}
                </p>
              )}
            </div>
          ) : (
            <span>Nenhum token selecionado</span>
          )}
        </div>
      </section>

      <section style={{ width: 320 }}>
        <h2>Gerar com IA</h2>
        <input
          value={pedido}
          onChange={(e) => setPedido(e.target.value)}
          placeholder="ex: goblin xamã nível 3"
          style={{ width: "100%", boxSizing: "border-box", padding: 6 }}
        />
        <button
          onClick={gerar}
          disabled={carregando || !pedido.trim()}
          style={{ marginTop: 8 }}
        >
          {carregando ? "Gerando..." : "Gerar rascunho"}
        </button>
        {erro && <p style={{ color: "#A32D2D" }}>{erro}</p>}

        {rascunho && (
          <div
            style={{
              marginTop: 12,
              border: "1px solid #888",
              borderRadius: 8,
              padding: 10,
            }}
          >
            {simulado && <p style={{ fontSize: 12 }}>Modo simulado (sem chave da IA).</p>}
            <label>
              Nome
              <input
                value={rascunho.nome}
                onChange={campo("nome")}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <label>
                PV
                <input value={rascunho.hp} onChange={campo("hp")} style={{ width: 60 }} />
              </label>
              <label>
                CA
                <input value={rascunho.ca} onChange={campo("ca")} style={{ width: 60 }} />
              </label>
            </div>
            <label>
              Descrição
              <textarea
                value={rascunho.descricao}
                onChange={campo("descricao")}
                rows={3}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </label>
            <label>
              Ataques (um por linha)
              <textarea
                value={rascunho.ataquesTexto}
                onChange={campo("ataquesTexto")}
                rows={3}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </label>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={aprovar}>Aprovar</button>
              <button onClick={() => setRascunho(null)}>Descartar</button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
