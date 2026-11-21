"use client";
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
    <div style={{ border: "1px solid #888", borderRadius: 8, padding: 10, marginTop: 16 }}>
      <h2 style={{ marginTop: 0 }}>Imagem da sala</h2>
      {sala.imagem ? (
        <div
          role="img"
          aria-label="Prévia da imagem da sala"
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            backgroundImage: `url(${sala.imagem})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: 6,
            border: "1px solid #888",
          }}
        />
      ) : (
        <p style={{ fontSize: 13, margin: "0 0 8px" }}>Nenhuma imagem escolhida.</p>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <label
          style={{ cursor: "pointer", border: "1px solid #888", borderRadius: 4, padding: "2px 8px", fontSize: 13 }}
        >
          {sala.imagem ? "Trocar imagem" : "Escolher imagem"}
          <input type="file" accept="image/*" hidden onChange={escolher} />
        </label>
        {sala.imagem && (
          <>
            <button onClick={() => onChange({ visivel: !sala.visivel })}>
              {sala.visivel ? "Esconder dos jogadores" : "Mostrar aos jogadores"}
            </button>
            <button onClick={() => onChange({ imagem: null, visivel: false })}>Remover</button>
          </>
        )}
      </div>
      {sala.imagem && (
        <p role="status" style={{ fontSize: 13, margin: "8px 0 0" }}>
          {sala.visivel ? "Os jogadores estão vendo esta imagem." : "Escondida dos jogadores."}
        </p>
      )}
      {erro && (
        <p role="alert" style={{ color: "#A32D2D", fontSize: 13 }}>
          {erro}
        </p>
      )}
    </div>
  );
}
