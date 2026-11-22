"use client";
import Image from "next/image";
import { useState } from "react";
import { lerImagemSala } from "../lib/imagem";

export default function PainelSala({ sala, onChange }) {
  const [erro, setErro] = useState("");

  async function escolher(e) {
    const arq = e.target.files[0];
    e.target.value = "";
    if (!arq) return;
    try {
      setErro("");
      const imagem = await lerImagemSala(arq);
      onChange({ imagem, visivel: false });
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <section className="cartao pilha" aria-labelledby="titulo-sala">
      <h2 id="titulo-sala">Imagem da sala</h2>
      {sala.imagem ? (
        <Image key={sala.imagem} className="previa-sala" src={sala.imagem}
          width={640} height={360} unoptimized alt="Prévia da imagem da sala" />
      ) : (
        <p className="aviso">Nenhuma imagem escolhida.</p>
      )}
      <div className="acoes">
        <label className="botao seletor-arquivo">
          {sala.imagem ? "Trocar imagem" : "Escolher imagem"}
          <input type="file" accept="image/*" onChange={escolher} />
        </label>
        {sala.imagem && (
          <>
            <button className="botao" onClick={() => onChange({ visivel: !sala.visivel })}>
              {sala.visivel ? "Esconder dos jogadores" : "Mostrar aos jogadores"}
            </button>
            <button className="botao botao-perigo" onClick={() => onChange({ imagem: null, visivel: false })}>
              Remover
            </button>
          </>
        )}
      </div>
      {sala.imagem && (
        <p className={sala.visivel ? "aviso-ok" : "aviso"} role="status">
          {sala.visivel ? "Os jogadores estão vendo esta imagem." : "Escondida dos jogadores."}
        </p>
      )}
      {erro && <p className="aviso-erro" role="alert">{erro}</p>}
    </section>
  );
}
