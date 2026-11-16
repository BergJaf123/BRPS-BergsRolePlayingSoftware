'use client';
import { useState } from 'react';

export default function Mapa({
  tokens,
  colunas = 12,
  linhas = 8,
  tamanho = 40,
  selecionado,
  onCelula,
  onToken,
}) {
  const [hover, setHover] = useState(null);
  const tokenSel = tokens.find((t) => t.id === selecionado);
  const interativo = Boolean(onCelula);

  return (
    <div
      style={{
        position: 'relative',
        width: colunas * tamanho,
        height: linhas * tamanho,
        background: '#F1EFE8',
        border: '3px solid #444441',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${colunas}, ${tamanho}px)`,
        }}
      >
        {Array.from({ length: colunas * linhas }, (_, i) => {
          const x = i % colunas;
          const y = Math.floor(i / colunas);
          const ehSel = tokenSel && tokenSel.x === x && tokenSel.y === y;
          const ehHover = interativo && selecionado && hover === i;
          return (
            <div
              key={i}
              onClick={() => onCelula && onCelula(x, y)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                width: tamanho,
                height: tamanho,
                boxSizing: 'border-box',
                border: '0.5px solid #B4B2A9',
                background: ehHover
                  ? '#B5D4F4'
                  : ehSel
                  ? '#FAC775'
                  : 'transparent',
                cursor: interativo && selecionado ? 'pointer' : 'default',
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
            position: 'absolute',
            left: t.x * tamanho + 4,
            top: t.y * tamanho + 4,
            width: tamanho - 8,
            height: tamanho - 8,
            borderRadius: '50%',
            background: t.cor,
            opacity: t.revelado ? 1 : 0.45,
            border:
              selecionado === t.id ? '3px solid #000' : '2px solid #2C2C2A',
            cursor: onToken ? 'pointer' : 'default',
          }}
        />
      ))}
    </div>
  );
}
