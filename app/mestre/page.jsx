"use client";
import { useEffect, useRef, useState } from "react";
import Mapa from "../../components/Mapa";
import Dados from "../../components/Dados";
import { useJogo } from "../../lib/store";
import { carregarCampanha, salvarCampanha } from "../../lib/db";
import { lerImagem } from "../../lib/imagem";

// manda pros jogadores só o que eles podem ver (sem PV, CA, ataques)
const publico = (lista) =>
  lista
    .filter((t) => t.revelado)
    .map(({ id, nome, x, y, cor, imagem }) => ({ id, nome, x, y, cor, imagem, revelado: true }));

export default function Mestre() {
  const { tokens, mover, alternarRevelado, adicionar, ajustarHp, definirTokens, definirImagem } = useJogo();
  const [sel, setSel] = useState(null);
  const [pedido, setPedido] = useState("");
  const [rascunho, setRascunho] = useState(null);
  const [simulado, setSimulado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [valor, setValor] = useState("");
  const [pronto, setPronto] = useState(false);
  const [erroImg, setErroImg] = useState("");
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

  // carrega a campanha salva ao abrir
  useEffect(() => {
    carregarCampanha("principal").then((c) => {
      if (c?.tokens) definirTokens(c.tokens);
      setPronto(true);
    });
  }, []);

  // salva sozinho a cada mudança (só depois de carregar, pra não apagar o que já estava salvo)
  useEffect(() => {
    if (pronto) salvarCampanha("principal", { tokens });
  }, [tokens, pronto]);

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
      hpMax: Number(rascunho.hp) || 1,
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
        <div style={{ marginTop: 12, maxWidth: 480 }}>
          {token ? (
            <div>
              <button onClick={() => alternarRevelado(token.id)}>
                {token.revelado ? "Ocultar" : "Revelar"} {token.nome}
              </button>
              <div style={{ margin: "8px 0", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ cursor: "pointer", border: "1px solid #888", borderRadius: 4, padding: "2px 8px", fontSize: 13 }}>
                  Escolher imagem
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const arq = e.target.files[0];
                      e.target.value = "";
                      if (!arq) return;
                      try {
                        setErroImg("");
                        definirImagem(token.id, await lerImagem(arq));
                      } catch (err) {
                        setErroImg(err.message);
                      }
                    }}
                  />
                </label>
                {token.imagem && (
                  <button style={{ fontSize: 13 }} onClick={() => definirImagem(token.id, null)}>
                    Remover imagem
                  </button>
                )}
                {erroImg && <span style={{ color: "#A32D2D", fontSize: 13 }}>{erroImg}</span>}
              </div>
              {token.hp !== undefined && (
                <div style={{ marginTop: 8 }}>
                  <b>{token.nome}</b> — PV {token.hp}/{token.hpMax ?? token.hp} | CA {token.ca}
                  {token.hp === 0 && <b style={{ color: "#A32D2D" }}> (caído)</b>}
                  <div style={{ display: "flex", gap: 6, margin: "8px 0" }}>
                    <input
                      value={valor}
                      onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))}
                      placeholder="valor"
                      style={{ width: 70, padding: 4 }}
                    />
                    <button
                      disabled={!valor}
                      onClick={() => {
                        ajustarHp(token.id, -Number(valor));
                        setValor("");
                      }}
                    >
                      Dano
                    </button>
                    <button
                      disabled={!valor}
                      onClick={() => {
                        ajustarHp(token.id, Number(valor));
                        setValor("");
                      }}
                    >
                      Cura
                    </button>
                  </div>
                  {token.descricao}
                  <br />
                  {(token.ataques || []).map((a, i) => (
                    <span key={i}>
                      • {a}
                      <br />
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span>Nenhum token selecionado</span>
          )}
        </div>
      </section>

      <section style={{ width: 320 }}>
        <Dados />
        <h2 style={{ marginTop: 24 }}>Gerar com IA</h2>
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
