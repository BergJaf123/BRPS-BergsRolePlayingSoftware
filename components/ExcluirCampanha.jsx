"use client";
import { useState } from "react";
import { excluirCampanha } from "../lib/api";

export default function ExcluirCampanha({ id, nome, onExcluida }) {
  const [aberto, setAberto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function confirmar(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await excluirCampanha(id, codigo);
      onExcluida();
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  if (!aberto) {
    return <button className="botao botao-perigo" aria-label={`Excluir campanha ${nome}`} onClick={() => setAberto(true)}>Excluir</button>;
  }

  return (
    <form className="confirmacao pilha" onSubmit={confirmar}>
      <div>
        <label className="rotulo" htmlFor={`cod-${id}`}>
          Código do mestre para excluir &ldquo;{nome}&rdquo; (isso apaga as salas e os tokens)
        </label>
        <input
          className="campo"
          id={`cod-${id}`}
          type="password"
          autoComplete="current-password"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          required
        />
      </div>
      <div className="acoes">
        <button className="botao botao-perigo" type="submit" disabled={enviando || !codigo}>
          {enviando ? "Excluindo..." : "Confirmar exclusão"}
        </button>
        <button className="botao" type="button" onClick={() => setAberto(false)}>Cancelar</button>
      </div>
      {erro && <p className="aviso-erro" role="alert">{erro}</p>}
    </form>
  );
}
