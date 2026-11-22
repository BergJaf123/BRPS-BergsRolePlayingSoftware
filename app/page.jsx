"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ExcluirCampanha from "../components/ExcluirCampanha";
import "./inicio.css";

export default function Home() {
  const [campanhas, setCampanhas] = useState(null);
  const [erroLista, setErroLista] = useState("");
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  async function carregar() {
    try {
      setErroLista("");
      const r = await fetch("/api/campanhas");
      if (!r.ok) throw new Error();
      setCampanhas(await r.json());
    } catch {
      setErroLista("Não foi possível carregar as campanhas. Tenta de novo.");
      setCampanhas([]);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criar(e) {
    e.preventDefault();
    setErro("");
    setOk("");
    setEnviando(true);
    try {
      const r = await fetch("/api/campanhas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, codigo }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || "Erro ao criar a campanha");
      setOk(`Campanha "${d.nome}" criada.`);
      setNome("");
      setCodigo("");
      await carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="inicio">
      <header className="barra-inicio">
        <div className="marca-inicio">
          <svg aria-hidden="true" focusable="false" width="36" height="40" viewBox="0 0 36 40"
            fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M18 2 34 11v18l-16 9L2 29V11Z M18 2l9 11-9 16L9 13Z M2 11l7 2h18l7-2 M2 29h16l16 0 M9 13 2 29m25-16 7 16m-16 0v9" />
          </svg>
          BRPS
        </div>
        <a className="botao atalho-nova" href="#titulo-nova">
          <span aria-hidden="true">+</span> Nova campanha
        </a>
      </header>

      <section className="capa-campanhas" aria-labelledby="titulo-inicio">
        <div className="paisagem-inicio" aria-hidden="true" />
        <div className="chamada-inicio">
          <h1 id="titulo-inicio">Mesa de <em>campanhas</em></h1>
          <p>Mesa virtual de RPG com IA para o mestre.</p>
          <a className="botao botao-primario atalho-lista" href="#titulo-lista">
            Escolher campanha <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <div className="paineis-campanhas">
        <section className="arquivo-campanhas pilha" aria-labelledby="titulo-lista">
          <div className="titulo-arquivo">
            <h2 id="titulo-lista" tabIndex={-1}>Campanhas disponíveis</h2>
            {campanhas?.length > 0 && !erroLista && (
              <span className="quantidade-campanhas" aria-hidden="true">
                {campanhas.length}
              </span>
            )}
          </div>
          {campanhas === null && <p className="aviso" role="status">Carregando campanhas...</p>}
          {erroLista && (
            <div className="aviso-erro" role="alert">
              <p>{erroLista}</p>
              <button className="botao" onClick={carregar}>Tentar de novo</button>
            </div>
          )}
          {campanhas && campanhas.length === 0 && !erroLista && (
            <div className="aviso arquivo-vazio">
              <h3>Nenhuma campanha ainda</h3>
              <p>Crie a primeira para reunir sua mesa.</p>
              <a className="botao" href="#titulo-nova">Criar a primeira campanha</a>
            </div>
          )}
          {campanhas && campanhas.length > 0 && (
            <ul className="lista-campanhas">
              {campanhas.map((c) => (
                <li key={c.id} className="item-campanha">
                  <div className="resumo-campanha">
                    <span className="livro-campanha" aria-hidden="true" />
                    <div>
                      <h3>{c.nome}</h3>
                      <small>
                        {c.salas} {c.salas === 1 ? "sala" : "salas"} · criada em{" "}
                        {new Date(c.criado_em).toLocaleDateString("pt-BR")}
                      </small>
                    </div>
                  </div>
                  <div className="acoes acoes-campanha">
                    <Link
                      className="botao botao-primario"
                      href={`/tela?campanha=${c.id}`}
                      aria-label={`Entrar como jogador na campanha ${c.nome}`}
                    >
                      Entrar como jogador
                    </Link>
                    <Link
                      className="botao"
                      href={`/mestre?campanha=${c.id}`}
                      aria-label={`Painel do mestre da campanha ${c.nome}`}
                    >
                      Painel do mestre
                    </Link>
                    <ExcluirCampanha id={c.id} nome={c.nome} onExcluida={carregar} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="cartao pilha ficha-criacao" aria-labelledby="titulo-nova">
          <h2 id="titulo-nova" tabIndex={-1}>Nova campanha</h2>
          <form className="pilha" onSubmit={criar}>
            <div>
              <label className="rotulo" htmlFor="nome">Nome da campanha</label>
              <input className="campo" id="nome" placeholder="Ex. O Vale das Brumas"
                value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required />
            </div>
            <div>
              <label className="rotulo" htmlFor="codigo">Código do mestre</label>
              <input
                className="campo" id="codigo" type="password" autoComplete="new-password"
                value={codigo} onChange={(e) => setCodigo(e.target.value)}
                minLength={4} maxLength={40} required aria-describedby="ajuda-codigo"
              />
              <small id="ajuda-codigo">Use de 4 a 40 caracteres. Guarde o código para acessar o painel do mestre. Ele não pode ser recuperado.</small>
            </div>
            <button className="botao botao-primario" type="submit" disabled={enviando}>
              {enviando ? "Criando..." : "Criar campanha"}
            </button>
          </form>
          {erro && <p className="aviso-erro" role="alert">{erro}</p>}
          {ok && <p className="aviso-ok" role="status">{ok}</p>}
        </section>
      </div>
    </main>
  );
}
