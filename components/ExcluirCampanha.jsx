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
    return <button onClick={() => setAberto(true)}>Excluir</button>;
  }

  return (
    <form onSubmit={confirmar} style={{ width: "100%" }}>
      <label htmlFor={`cod-${id}`}>
        Código do mestre para excluir "{nome}" (isso apaga as salas e os tokens)
      </label>
      <br />
      <input
        id={`cod-${id}`}
        type="password"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        required
        style={{ padding: 6 }}
      />{" "}
      <button type="submit" disabled={enviando || !codigo}>
        {enviando ? "Excluindo..." : "Confirmar exclusão"}
      </button>{" "}
      <button type="button" onClick={() => setAberto(false)}>
        Cancelar
      </button>
      {erro && (
        <p role="alert" style={{ color: "#A32D2D", margin: "4px 0 0" }}>
          {erro}
        </p>
      )}
    </form>
  );
}
