"use client";
import { useState } from "react";
import { ehChao } from "../lib/mapa";

export default function Mapa({
  tokens,
  colunas = 12,
  linhas = 8,
  mascara = null,
  tamanho,
  selecionado,
  onCelula,
  onToken,
}) {
  const tam =
    tamanho ?? Math.max(24, Math.min(40, Math.floor(600 / Math.max(colunas, linhas))));
  const [hover, setHover] = useState(null);
  const tokenSel = tokens.find((t) => t.id === selecionado);
  const interativo = Boolean(onCelula);

  return (
    <div
      style={{
        position: "relative",
        width: colunas * tam,
        height: linhas * tam,
        background: "#444441",
        border: "3px solid #444441",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${colunas}, ${tam}px)`,
        }}
      >
        {Array.from({ length: colunas * linhas }, (_, i) => {
          const x = i % colunas;
          const y = Math.floor(i / colunas);
          const chao = ehChao(mascara, x, y);
          const ehSel = tokenSel && tokenSel.x === x && tokenSel.y === y;
          const ehHover = chao && interativo && selecionado && hover === i;
          return (
            <div
              key={i}
              onClick={() => chao && onCelula && onCelula(x, y)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                width: tam,
                height: tam,
                boxSizing: "border-box",
                border: chao ? "0.5px solid #B4B2A9" : "none",
                background: !chao
                  ? "#444441"
                  : ehHover
                  ? "#B5D4F4"
                  : ehSel
                  ? "#FAC775"
                  : "#F1EFE8",
                cursor: chao && interativo && selecionado ? "pointer" : "default",
              }}
            />
          );
        })}
      </div>

      {tokens.map((t) => (
        <div
          key={t.id}
          title={t.nome}
          onClick={(e) => {
            e.stopPropagation();
            onToken && onToken(t.id);
          }}
          style={{
            position: "absolute",
            left: t.x * tam + 4,
            top: t.y * tam + 4,
            width: tam - 8,
            height: tam - 8,
            borderRadius: "50%",
            backgroundColor: t.cor,
            backgroundImage: t.imagem ? `url(${t.imagem})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: t.revelado ? 1 : 0.45,
            border:
              selecionado === t.id
                ? "3px solid #000"
                : `2px solid ${t.imagem ? t.cor : "#2C2C2A"}`,
            boxSizing: "border-box",
            cursor: onToken ? "pointer" : "default",
          }}
        />
      ))}
    </div>
  );
}
