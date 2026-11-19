"use client";
import { useState } from "react";

export default function Acesso({ onEntrar }) {
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      await onEntrar(codigo);
    } catch (err) {
      setErro(err.message);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} style={{ maxWidth: 360 }}>
      <label htmlFor="codigo-mestre">Código do mestre</label>
      <br />
      <input
        id="codigo-mestre"
        type="password"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        required
        style={{ width: "100%", boxSizing: "border-box", padding: 6 }}
      />
      <button type="submit" disabled={enviando || !codigo} style={{ marginTop: 8 }}>
        {enviando ? "Entrando..." : "Entrar"}
      </button>
      {erro && (
        <p role="alert" style={{ color: "#A32D2D" }}>
          {erro}
        </p>
      )}
    </form>
  );
}
