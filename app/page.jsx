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
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <h1>BRPS</h1>
      <p>Mesa virtual de RPG com IA para o mestre.</p>

      <section aria-labelledby="titulo-lista">
        <h2 id="titulo-lista">Campanhas</h2>
        {campanhas === null && <p>Carregando...</p>}
        {erroLista && (
          <p role="alert" style={{ color: "#A32D2D" }}>
            {erroLista} <button onClick={carregar}>Tentar de novo</button>
          </p>
        )}
        {campanhas && campanhas.length === 0 && !erroLista && (
          <p>Nenhuma campanha ainda. Cria a primeira ali embaixo.</p>
        )}
        {campanhas && campanhas.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {campanhas.map((c) => (
              <li
                key={c.id}
                style={{
                  border: "1px solid #888",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span>
                  <b>{c.nome}</b>
                  <br />
                  <small>
                    {c.salas} {c.salas === 1 ? "sala" : "salas"} · criada em{" "}
                    {new Date(c.criado_em).toLocaleDateString("pt-BR")}
                  </small>
                </span>
                <span style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <Link href={`/mestre?campanha=${c.id}`}>Abrir</Link>
                  <ExcluirCampanha id={c.id} nome={c.nome} onExcluida={carregar} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titulo-nova" style={{ marginTop: 24 }}>
        <h2 id="titulo-nova">Nova campanha</h2>
        <form onSubmit={criar}>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="nome">Nome da campanha</label>
            <br />
            <input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={80}
              required
              style={{ width: "100%", boxSizing: "border-box", padding: 6 }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="codigo">Código do mestre (4 a 40 caracteres)</label>
            <br />
            <input
              id="codigo"
              type="password"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              minLength={4}
              maxLength={40}
              required
              style={{ width: "100%", boxSizing: "border-box", padding: 6 }}
            />
            <small>É a senha que protege a campanha. Guarda ela, porque não dá pra recuperar.</small>
          </div>
          <button type="submit" disabled={enviando}>
            {enviando ? "Criando..." : "Criar campanha"}
          </button>
        </form>
        {erro && (
          <p role="alert" style={{ color: "#A32D2D" }}>
            {erro}
          </p>
        )}
        {ok && <p role="status">{ok}</p>}
      </section>

      <p style={{ marginTop: 24 }}>
        <Link href="/tela">Tela dos jogadores</Link>
      </p>
    </main>
  );
}
