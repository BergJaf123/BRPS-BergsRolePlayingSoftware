"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Mapa from "../../components/Mapa";
import Dados from "../../components/Dados";
import PainelMapa from "../../components/PainelMapa";
import PainelSala from "../../components/PainelSala";
import Acesso from "../../components/Acesso";
import { useJogo } from "../../lib/store";
import { abrirCampanha, salvarCampanha } from "../../lib/api";
import { lerImagem } from "../../lib/imagem";

export default function Mestre() {
  const {
    tokens, mapa, mover, alternarRevelado, adicionar, remover, ajustarHp,
    definirEstado, definirImagem, definirMapa, sala, definirSala,
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

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("campanha");
    setCampanha(/^\d{1,15}$/.test(id ?? "") ? id : "");
  }, []);

  async function entrar(cod) {
    const estado = await abrirCampanha(campanha, cod);
    definirEstado(estado);
    ultimo.current = JSON.stringify({ tokens: estado.tokens, mapa: estado.mapa, sala: estado.sala });
    setCodigo(cod);
  }

  // salva no banco 0,8 s depois da última mudança
  useEffect(() => {
    if (!codigo) return;
    const agora = JSON.stringify({ tokens, mapa, sala });
    if (agora === ultimo.current) return;
    setStatus("salvando");
    const t = setTimeout(async () => {
      try {
        await salvarCampanha(campanha, codigo, { tokens, mapa, sala });
        ultimo.current = agora;
        setStatus("salvo");
      } catch (e) {
        setStatus("Erro ao salvar: " + e.message);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [tokens, mapa, sala, codigo, campanha]);

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

  function excluirToken() {
    if (!token) return;

    if (window.confirm(`Deseja excluir ${token.nome}?`)) {
      remover(token.id);
      setSel(null);
      setValor("");
      setErroImg("");
    }
  }

  useEffect(() => {
    function aoPressionar(e) {
      if (!codigo || !token || e.key !== "Delete" || e.repeat) return;
      if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;

      e.preventDefault();

      if (window.confirm(`Deseja excluir ${token.nome}?`)) {
        remover(token.id);
        setSel(null);
        setValor("");
        setErroImg("");
      }
    }

    window.addEventListener("keydown", aoPressionar);
    return () => window.removeEventListener("keydown", aoPressionar);
  }, [codigo, token, remover]);

  if (campanha === null) return <p className="aviso" role="status">Carregando...</p>;
  if (campanha === "" || !codigo) {
    return (
      <main className="pagina pagina-acesso pilha">
        <h1>Mestre</h1>
        {campanha === "" ? (
          <p className="aviso">Nenhuma campanha escolhida.</p>
        ) : (
          <Acesso onEntrar={entrar} />
        )}
        <Link className="botao" href="/">Voltar para as campanhas</Link>
      </main>
    );
  }

  return (
    <main className="pagina">
      <header className="cabecalho">
        <h1>Mestre</h1>
        <nav className="acoes" aria-label="Campanha">
          <Link className="botao" href="/">Campanhas</Link>
          <Link className="botao botao-primario" href={`/tela?campanha=${campanha}`} target="_blank" rel="noreferrer">
            Abrir tela dos jogadores
          </Link>
        </nav>
      </header>

      <div className="mesa">
        <section className="cartao pilha" aria-labelledby="titulo-tabuleiro">
          <h2 id="titulo-tabuleiro">Tabuleiro</h2>
          {status && (
            <p className={status === "salvo" ? "aviso-ok" : status === "salvando" ? "aviso" : "aviso-erro"} role="status">
              {status === "salvando" ? "Salvando..." : status === "salvo" ? "Salvo no banco" : status}
            </p>
          )}
          <p className="texto-suave">Selecione um token e depois uma casa para movê-lo.</p>
          <div className="area-mapa">
            <Mapa
              tokens={tokens}
              colunas={mapa.colunas}
              linhas={mapa.linhas}
              mascara={mapa.mascara}
              selecionado={sel}
              onToken={setSel}
              onCelula={(x, y) => sel && mover(sel, x, y)}
            />
          </div>
          {token ? (
            <div className="rascunho pilha">
              <h3>{token.nome}</h3>
              <div className="acoes">
                <button className="botao botao-perigo" onClick={excluirToken}>
                  Excluir token
                </button>
                <button className="botao" onClick={() => alternarRevelado(token.id)}>
                  {token.revelado ? "Ocultar" : "Revelar"} {token.nome}
                </button>
                <label className="botao seletor-arquivo">
                  Escolher imagem do token
                  <input
                    type="file"
                    accept="image/*"
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
                  <button className="botao botao-perigo" onClick={() => definirImagem(token.id, null)}>Remover imagem</button>
                )}
              </div>
              {erroImg && <p className="aviso-erro" role="alert">{erroImg}</p>}
              {token.hp !== undefined && (
                <div className="pilha">
                  <p>PV {token.hp}/{token.hpMax ?? token.hp} · CA {token.ca}
                    {token.hp === 0 && <strong className="texto-perigo"> (caído)</strong>}
                  </p>
                  <div className="acoes acoes-campos">
                    <label className="rotulo">Pontos de vida
                      <input className="campo campo-numero" inputMode="numeric" value={valor}
                        onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))} />
                    </label>
                    <button className="botao botao-perigo" disabled={!valor}
                      onClick={() => {
                        ajustarHp(token.id, -Number(valor));
                        setValor("");
                      }}>
                      Dano
                    </button>
                    <button className="botao" disabled={!valor}
                      onClick={() => {
                        ajustarHp(token.id, Number(valor));
                        setValor("");
                      }}>
                      Cura
                    </button>
                  </div>
                  {token.descricao && <p>{token.descricao}</p>}
                  {!!token.ataques?.length && (
                    <ul className="lista-ataques">
                      {token.ataques.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="aviso">Nenhum token selecionado.</p>
          )}
        </section>

        <div className="pilha">
          <PainelMapa mapa={mapa} onAplicar={definirMapa} />
          <PainelSala sala={sala} onChange={definirSala} />
          <Dados />

          <section className="cartao pilha" aria-labelledby="titulo-personagem">
            <h2 id="titulo-personagem">Personagem</h2>
            <div>
              <label className="rotulo" htmlFor="novo-nome">Nome do personagem</label>
              <div className="acoes">
                <input className="campo campo-flex" id="novo-nome"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && novoPersonagem()}
                />
                <button className="botao" onClick={novoPersonagem} disabled={!novoNome.trim()}>Adicionar</button>
              </div>
            </div>
          </section>

          <section className="cartao pilha" aria-labelledby="titulo-npc">
            <h2 id="titulo-npc">Gerar NPC com IA</h2>
            <p className="aviso" id="aviso-ia">A IA pode errar. Revise o rascunho antes de aprovar.</p>
            <div>
              <label className="rotulo" htmlFor="pedido-npc">Descrição do NPC para a IA</label>
              <input className="campo" id="pedido-npc" aria-describedby="aviso-ia"
                value={pedido} onChange={(e) => setPedido(e.target.value)} placeholder="Ex. goblin xamã nível 3" />
            </div>
            <button className="botao botao-primario" onClick={gerar} disabled={carregando || !pedido.trim()}>
              {carregando ? "Gerando..." : "Gerar rascunho"}
            </button>
            {erro && <p className="aviso-erro" role="alert">{erro}</p>}
            {rascunho && (
              <div className="rascunho pilha">
                <h3>Rascunho do NPC</h3>
                {simulado && <p className="aviso">Modo simulado (sem chave da IA).</p>}
                <label className="rotulo">Nome
                  <input className="campo" value={rascunho.nome} onChange={campo("nome")} />
                </label>
                <div className="acoes acoes-campos">
                  <label className="rotulo">PV
                    <input className="campo campo-numero" value={rascunho.hp} onChange={campo("hp")} />
                  </label>
                  <label className="rotulo">CA
                    <input className="campo campo-numero" value={rascunho.ca} onChange={campo("ca")} />
                  </label>
                </div>
                <label className="rotulo">Descrição
                  <textarea className="campo" value={rascunho.descricao} onChange={campo("descricao")} rows={3} />
                </label>
                <label className="rotulo">Ataques (um por linha)
                  <textarea className="campo" value={rascunho.ataquesTexto} onChange={campo("ataquesTexto")} rows={3} />
                </label>
                <div className="acoes">
                  <button className="botao botao-primario" onClick={aprovar}>Aprovar</button>
                  <button className="botao" onClick={() => setRascunho(null)}>Descartar</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
