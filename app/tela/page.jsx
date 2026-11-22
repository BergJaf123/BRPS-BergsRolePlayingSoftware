"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Mapa from "../../components/Mapa";
import { lerEstadoPublico } from "../../lib/api";

const oculto = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

function useJanela() {
  const [t, setT] = useState({ w: 1024, h: 768 });
  useEffect(() => {
    const ler = () => setT({ w: window.innerWidth, h: window.innerHeight });
    ler();
    window.addEventListener("resize", ler);
    return () => window.removeEventListener("resize", ler);
  }, []);
  return t;
}

export default function Tela() {
  const [campanha, setCampanha] = useState(null);
  const [estado, setEstado] = useState(null);
  const [erro, setErro] = useState("");
  const janela = useJanela();

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("campanha");
    setCampanha(/^\d{1,15}$/.test(id ?? "") ? id : "");
  }, []);

  useEffect(() => {
    if (!campanha) return;
    let vivo = true;
    async function buscar() {
      try {
        const d = await lerEstadoPublico(campanha);
        if (vivo) {
          setEstado(d);
          setErro("");
        }
      } catch (e) {
        if (vivo) setErro(e.message);
      }
    }
    buscar();
    const t = setInterval(buscar, 2000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [campanha]);

  if (campanha === null) return <p className="aviso" role="status">Carregando...</p>;
  if (campanha === "") {
    return (
      <main className="pagina pagina-acesso pilha">
        <h1>Jogadores</h1>
        <p className="aviso">Nenhuma campanha escolhida.</p>
        <Link className="botao" href="/">Ver as campanhas</Link>
      </main>
    );
  }

  const imagem = estado?.sala?.imagem;
  const largo = janela.w >= 900;
  const GAP = 12;
  const disponivelW = janela.w - 32;
  const disponivelH = janela.h - 32;

  let mapaW = disponivelW;
  let mapaH = disponivelH;
  if (imagem && largo) mapaW = Math.floor((disponivelW - GAP) * 0.68);
  if (imagem && !largo) mapaH = Math.floor((disponivelH - GAP) * 0.62);

  const colunas = estado?.mapa.colunas ?? 12;
  const linhas = estado?.mapa.linhas ?? 8;
  const tam = Math.max(16, Math.floor(Math.min((mapaW - 6) / colunas, (mapaH - 6) / linhas)));

  return (
    <main className="tela-jogadores"
      style={{
        display: "flex",
        flexDirection: imagem && largo ? "row" : "column",
        gap: GAP,
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <h1 style={oculto}>Tela dos jogadores</h1>
      {erro && (
        <p role="alert" className="aviso-erro">
          {estado ? "Reconectando..." : erro}
        </p>
      )}
      {!estado && !erro && <p className="aviso" role="status">Carregando...</p>}
      {estado && (
        <>
          <Mapa
            tokens={estado.tokens}
            colunas={colunas}
            linhas={linhas}
            mascara={estado.mapa.mascara}
            tamanho={tam}
          />
          {imagem && (
            <div
              className="imagem-sala"
              role="img"
              aria-label="Imagem da sala"
              style={{
                flex: largo ? "1 1 0" : "none",
                minWidth: 0,
                width: largo ? undefined : "100%",
                height: largo ? linhas * tam + 6 : Math.floor((disponivelH - GAP) * 0.34),
                backgroundImage: `url(${imagem})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                boxSizing: "border-box",
              }}
            />
          )}
        </>
      )}
    </main>
  );
}
