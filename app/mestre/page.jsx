"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Mapa from "../../components/Mapa";
import Dados from "../../components/Dados";
import PainelMapa from "../../components/PainelMapa";
import Acesso from "../../components/Acesso";
import { useJogo } from "../../lib/store";
import { abrirCampanha, salvarCampanha } from "../../lib/api";
import { lerImagem } from "../../lib/imagem";

export default function Mestre() {
  const {
    tokens, mapa, mover, alternarRevelado, adicionar, ajustarHp,
    definirEstado, definirImagem, definirMapa,
  } = useJogo();
  const [campanha, setCampanha] = useState(null);
  const [codigo, setCodigo] = useState(null);
  const [status, setStatus] = useState("");
  const [sel, setSel] = useState(null);
  const [pedido, setPedido] = useState("");
  const [rascunho, setRascunho] = useState(null);
  const [simulado, setSimulado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [valor, setValor] = useState("");
  const [erroImg, setErroImg] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const ultimo = useRef("");
  const filaSalvamento = useRef(Promise.resolve());

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("campanha");
    setCampanha(/^\d{1,15}$/.test(id ?? "") ? id : "");
  }, []);

  async function entrar(cod) {
    const estado = await abrirCampanha(campanha, cod);
    definirEstado(estado);
    ultimo.current = JSON.stringify({ tokens: estado.tokens, mapa: estado.mapa });
    setCodigo(cod);
  }

  // salva no banco 0,8 s depois da última mudança
  useEffect(() => {
    if (!codigo) return;
    const agora = JSON.stringify({ tokens, mapa });
    let ativo = true;
    const t = setTimeout(() => {
      filaSalvamento.current = filaSalvamento.current.then(async () => {
        if (!ativo) return;
        if (agora === ultimo.current) {
          setStatus((atual) => atual ? "salvo" : "");
          return;
        }

        setStatus("salvando");
        try {
          await salvarCampanha(campanha, codigo, { tokens, mapa });
          ultimo.current = agora;
          if (ativo) setStatus("salvo");
        } catch (e) {
          if (ativo) setStatus("Erro ao salvar: " + e.message);
        }
      });
    }, 800);
    return () => {
      ativo = false;
      clearTimeout(t);
    };
  }, [tokens, mapa, codigo, campanha]);

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

  function novoPersonagem() {
    const nome = novoNome.trim();
    if (!nome) return;
    adicionar({ nome: nome.slice(0, 80), cor: "#378ADD", revelado: true });
    setNovoNome("");
  }

  const campo = (k) => (e) => setRascunho({ ...rascunho, [k]: e.target.value });
  const token = tokens.find((t) => t.id === sel);

  if (campanha === null) return <p>Carregando...</p>;
  if (campanha === "") {
    return (
      <main>
        <h1>Mestre</h1>
        <p>Nenhuma campanha escolhida.</p>
        <Link href="/">Voltar para as campanhas</Link>
      </main>
    );
  }
  if (!codigo) {
    return (
      <main>
        <h1>Mestre</h1>
        <Acesso onEntrar={entrar} />
        <p>
          <Link href="/">Voltar para as campanhas</Link>
        </p>
      </main>
    );
  }

  return (
    <main style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      <section>
        <h1>Mestre</h1>
        <p>
          <Link href="/">Campanhas</Link> ·{" "}
          <Link href={`/tela?campanha=${campanha}`} target="_blank" rel="noreferrer">
            Abrir tela dos jogadores
          </Link>{" "}
          ·{" "}
          <span role="status">
            {status === "salvando" ? "Salvando..." : status === "salvo" ? "Salvo no banco" : status}
          </span>
        </p>
        <p>Clica num token pra selecionar e numa casa pra mover.</p>
        <Mapa
          tokens={tokens}
          colunas={mapa.colunas}
          linhas={mapa.linhas}
          mascara={mapa.mascara}
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
        <PainelMapa mapa={mapa} onAplicar={definirMapa} />
        <div style={{ marginTop: 16 }}>
          <Dados />
        </div>

        <h2 style={{ marginTop: 24 }}>Personagem</h2>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && novoPersonagem()}
            placeholder="nome do personagem"
            aria-label="Nome do personagem"
            style={{ flex: 1, padding: 6, minWidth: 0 }}
          />
          <button onClick={novoPersonagem} disabled={!novoNome.trim()}>
            Adicionar
          </button>
        </div>

        <h2 style={{ marginTop: 24 }}>Gerar com IA</h2>
        <p style={{ fontSize: 12, margin: "0 0 6px" }}>
          A IA pode errar. Revise o rascunho antes de aprovar.
        </p>
        <input
          value={pedido}
          onChange={(e) => setPedido(e.target.value)}
          placeholder="ex: goblin xamã nível 3"
          aria-label="Pedido para a IA"
          style={{ width: "100%", boxSizing: "border-box", padding: 6 }}
        />
        <button onClick={gerar} disabled={carregando || !pedido.trim()} style={{ marginTop: 8 }}>
          {carregando ? "Gerando..." : "Gerar rascunho"}
        </button>
        {erro && <p style={{ color: "#A32D2D" }}>{erro}</p>}

        {rascunho && (
          <div style={{ marginTop: 12, border: "1px solid #888", borderRadius: 8, padding: 10 }}>
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
