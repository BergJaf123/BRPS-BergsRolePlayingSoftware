"use client";
import { useEffect, useState } from "react";
import Mapa from "../../components/Mapa";

export default function Tela() {
  const [tokens, setTokens] = useState([]);
  const [mapa, setMapa] = useState({ colunas: 12, linhas: 8, mascara: null });

  useEffect(() => {
    const c = new BroadcastChannel("brps-mesa");
    c.onmessage = (e) => {
      if (e.data.tipo === "estado") {
        setTokens(e.data.tokens);
        if (e.data.mapa) setMapa(e.data.mapa);
      }
    };
    c.postMessage({ tipo: "pedir" });
    return () => c.close();
  }, []);

  return (
    <main>
      <h1>Jogadores</h1>
      <Mapa
        tokens={tokens}
        colunas={mapa.colunas}
        linhas={mapa.linhas}
        mascara={mapa.mascara}
      />
    </main>
  );
}
