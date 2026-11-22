"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ExcluirCampanha from "../components/ExcluirCampanha";

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
    <main className="pagina">
      <header className="cabecalho cabecalho-campanhas">
        <div>
          <h1>BRPS</h1>
          <p className="texto-suave">Mesa virtual de RPG com IA para o mestre.</p>
        </div>
      </header>

      <div className="paineis-campanhas">
        <section className="cartao pilha" aria-labelledby="titulo-lista">
          <h2 id="titulo-lista">Campanhas</h2>
          {campanhas === null && <p className="aviso" role="status">Carregando campanhas...</p>}
          {erroLista && (
            <div className="aviso-erro" role="alert">
              <p>{erroLista}</p>
              <button className="botao" onClick={carregar}>Tentar de novo</button>
            </div>
          )}
          {campanhas && campanhas.length === 0 && !erroLista && (
            <p className="aviso">Nenhuma campanha ainda. Use o formulário de nova campanha para criar a primeira.</p>
          )}
          {campanhas && campanhas.length > 0 && (
            <ul className="lista-campanhas">
              {campanhas.map((c) => (
                <li key={c.id} className="item-campanha">
                  <div>
                    <strong>{c.nome}</strong>
                    <small>
                      {c.salas} {c.salas === 1 ? "sala" : "salas"} · criada em{" "}
                      {new Date(c.criado_em).toLocaleDateString("pt-BR")}
                    </small>
                  </div>
                  <div className="acoes">
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

        <section className="cartao pilha" aria-labelledby="titulo-nova">
          <h2 id="titulo-nova">Nova campanha</h2>
          <form className="pilha" onSubmit={criar}>
            <div>
              <label className="rotulo" htmlFor="nome">Nome da campanha</label>
              <input className="campo" id="nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required />
            </div>
            <div>
              <label className="rotulo" htmlFor="codigo">Código do mestre (4 a 40 caracteres)</label>
              <input
                className="campo" id="codigo" type="password" autoComplete="new-password"
                value={codigo} onChange={(e) => setCodigo(e.target.value)}
                minLength={4} maxLength={40} required aria-describedby="ajuda-codigo"
              />
              <small id="ajuda-codigo">Guarde o código. Ele protege a campanha e não pode ser recuperado.</small>
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
