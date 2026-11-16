'use client';
import { useEffect, useRef, useState } from 'react';
import Mapa from '../../components/Mapa';
import { useJogo } from '../../lib/store';

export default function Mestre() {
  const { tokens, mover, alternarRevelado } = useJogo();
  const [sel, setSel] = useState(null);
  const canal = useRef(null);
  const ultimos = useRef(tokens);

  useEffect(() => {
    const c = new BroadcastChannel('brps-mesa');
    canal.current = c;
    c.onmessage = (e) => {
      if (e.data.tipo === 'pedir') {
        c.postMessage({
          tipo: 'estado',
          tokens: ultimos.current.filter((t) => t.revelado),
        });
      }
    };
    return () => c.close();
  }, []);

  useEffect(() => {
    ultimos.current = tokens;
    canal.current?.postMessage({
      tipo: 'estado',
      tokens: tokens.filter((t) => t.revelado),
    });
  }, [tokens]);

  const token = tokens.find((t) => t.id === sel);

  return (
    <main>
      <h1>Mestre</h1>
      <p>Clica num token pra selecionar e numa casa pra mover.</p>
      <Mapa
        tokens={tokens}
        selecionado={sel}
        onToken={setSel}
        onCelula={(x, y) => sel && mover(sel, x, y)}
      />
      <div style={{ marginTop: 12 }}>
        {token ? (
          <button onClick={() => alternarRevelado(token.id)}>
            {token.revelado ? 'Ocultar' : 'Revelar'} {token.nome}
          </button>
        ) : (
          <span>Nenhum token selecionado</span>
        )}
      </div>
    </main>
  );
}
