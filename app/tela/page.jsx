'use client';
import { useEffect, useState } from 'react';
import Mapa from '../../components/Mapa';

export default function Tela() {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    const c = new BroadcastChannel('brps-mesa');
    c.onmessage = (e) => {
      if (e.data.tipo === 'estado') setTokens(e.data.tokens);
    };
    c.postMessage({ tipo: 'pedir' });
    return () => c.close();
  }, []);

  return (
    <main>
      <h1>Jogadores</h1>
      <Mapa tokens={tokens} />
    </main>
  );
}
