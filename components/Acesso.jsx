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
    <form className="cartao pilha" onSubmit={enviar}>
      <div>
        <label className="rotulo" htmlFor="codigo-mestre">Código do mestre</label>
        <input
          className="campo"
          id="codigo-mestre"
          type="password"
          autoComplete="current-password"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          required
        />
      </div>
      <button className="botao botao-primario" type="submit" disabled={enviando || !codigo}>
        {enviando ? "Entrando..." : "Entrar"}
      </button>
      {erro && <p className="aviso-erro" role="alert">{erro}</p>}
    </form>
  );
}
