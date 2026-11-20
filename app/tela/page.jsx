"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Mapa from "../../components/Mapa";
import { lerEstadoPublico } from "../../lib/api";

export default function Tela() {
  const [campanha, setCampanha] = useState(null);
  const [estado, setEstado] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("campanha");
    setCampanha(/^\d{1,15}$/.test(id ?? "") ? id : "");
  }, []);

  useEffect(() => {
    if (!campanha) return;
    let vivo = true;
    let t;
    async function buscar() {
      try {
        const d = await lerEstadoPublico(campanha);
        if (vivo) {
          setEstado(d);
          setErro("");
        }
      } catch (e) {
        if (vivo) setErro(e.message);
      } finally {
        if (vivo) t = setTimeout(buscar, 2000);
      }
    }
    buscar();
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [campanha]);

  if (campanha === null) return <p>Carregando...</p>;
  if (campanha === "") {
    return (
      <main>
        <h1>Jogadores</h1>
        <p>Nenhuma campanha escolhida.</p>
        <Link href="/">Ver as campanhas</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Jogadores</h1>
      {erro && (
        <p role="alert" style={{ color: "#A32D2D" }}>
          {estado ? "Reconectando..." : erro}
        </p>
      )}
      {!estado && !erro && <p>Carregando...</p>}
      {estado && (
        <Mapa
          tokens={estado.tokens}
          colunas={estado.mapa.colunas}
          linhas={estado.mapa.linhas}
          mascara={estado.mapa.mascara}
        />
      )}
    </main>
  );
}
