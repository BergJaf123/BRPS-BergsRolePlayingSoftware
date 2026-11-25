"use client";
import { useRef, useState } from "react";
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
  const [casaAtiva, setCasaAtiva] = useState(0);
  const grade = useRef(null);
  const tokenSel = tokens.find((t) => t.id === selecionado);
  const interativo = Boolean(onCelula);
  const paradaTab = Math.min(casaAtiva, colunas * linhas - 1);
  const ocupantes = new Map();
  if (interativo) {
    for (const token of tokens) {
      const casa = token.y * colunas + token.x;
      if (!ocupantes.has(casa)) ocupantes.set(casa, []);
      ocupantes.get(casa).push(token);
    }
  }

  function navegar(evento, x, y) {
    if (evento.altKey || evento.ctrlKey || evento.metaKey) return;
    switch (evento.key) {
      case "ArrowLeft": x = Math.max(0, x - 1); break;
      case "ArrowRight": x = Math.min(colunas - 1, x + 1); break;
      case "ArrowUp": y = Math.max(0, y - 1); break;
      case "ArrowDown": y = Math.min(linhas - 1, y + 1); break;
      case "Enter":
      case " ": {
        evento.preventDefault();
        if (evento.repeat || !ehChao(mascara, x, y)) return;
        const presentes = ocupantes.get(y * colunas + x);
        if (presentes?.length) {
          const atual = presentes.findIndex((t) => t.id === selecionado);
          onToken?.(presentes[(atual + 1) % presentes.length].id);
        } else if (tokenSel) {
          onCelula(x, y);
        }
        return;
      }
      default: return;
    }
    evento.preventDefault();
    grade.current.children[y].children[x].focus();
  }

  return (
    <div
      className="tabuleiro"
      style={{
        position: "relative",
        width: colunas * tam,
        height: linhas * tam,
        "--largura-grade": `${colunas * tam}px`,
      }}
    >
      <div ref={grade} role={interativo ? "grid" : undefined}
        aria-label={interativo ? "Tabuleiro do mestre" : undefined}
        aria-describedby={interativo ? "ajuda-tabuleiro" : undefined}>
        {Array.from({ length: linhas }, (_, y) => (
          <div key={y} role={interativo ? "row" : undefined} className="linha-tabuleiro">
            {Array.from({ length: colunas }, (_, x) => {
              const i = y * colunas + x;
              const chao = ehChao(mascara, x, y);
              const ehSel = tokenSel?.x === x && tokenSel.y === y;
              const ehHover = chao && interativo && selecionado && hover === i;
              const nomes = ocupantes.get(i)?.map((t) => t.nome).join(", ");
              return (
                <div
                  key={x}
                  role={interativo ? "gridcell" : undefined}
                  tabIndex={interativo ? (paradaTab === i ? 0 : -1) : undefined}
                  aria-label={interativo ? `Linha ${y + 1}, coluna ${x + 1}, ${nomes || (chao ? "livre" : "parede")}` : undefined}
                  aria-selected={interativo ? ehSel : undefined}
                  onFocus={interativo ? () => setCasaAtiva(i) : undefined}
                  onKeyDown={interativo ? (e) => navegar(e, x, y) : undefined}
                  onClick={() => chao && onCelula && onCelula(x, y)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    width: tam,
                    height: tam,
                    boxSizing: "border-box",
                    border: chao ? "0.5px solid var(--grade-linha)" : "none",
                    background: !chao
                      ? "var(--grade-parede)"
                      : ehHover
                      ? "var(--grade-destino)"
                      : ehSel
                      ? "var(--grade-selecao)"
                      : "var(--grade-chao)",
                    cursor: chao && interativo && selecionado ? "pointer" : "default",
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {tokens.map((t) => (
        <div
          className="token"
          key={t.id}
          title={t.nome}
          onClick={(e) => {
            e.stopPropagation();
            if (onToken) {
              grade.current.children[t.y]?.children[t.x]?.focus({ preventScroll: true });
              onToken(t.id);
            }
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
                ? "3px solid var(--token-selecao)"
                : `2px solid ${t.imagem ? t.cor : "var(--token-borda)"}`,
            boxSizing: "border-box",
            cursor: onToken ? "pointer" : "default",
          }}
        />
      ))}
    </div>
  );
}
