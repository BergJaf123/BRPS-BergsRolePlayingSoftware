import { create } from "zustand";
import { reposicionar } from "./mapa";

export const useJogo = create((set) => ({
  tokens: [
    { id: 1, nome: "Herói", x: 2, y: 3, cor: "#378ADD", revelado: true },
    { id: 2, nome: "Goblin", x: 8, y: 4, cor: "#E24B4A", revelado: false },
  ],
  mapa: { colunas: 12, linhas: 8, mascara: null },
  sala: { imagem: null, visivel: false },
  definirEstado: (c) =>
    set((s) => ({ tokens: c.tokens ?? s.tokens, mapa: c.mapa ?? s.mapa, sala: c.sala ?? s.sala })),
  definirMapa: (mapa) =>
    set((s) => ({ mapa, tokens: reposicionar(s.tokens, mapa) })),
  definirSala: (parcial) =>
    set((s) => ({ sala: { ...s.sala, ...parcial } })),
  mover: (id, x, y) =>
    set((s) => ({
      tokens: s.tokens.map((t) => (t.id === id ? { ...t, x, y } : t)),
    })),
  alternarRevelado: (id) =>
    set((s) => ({
      tokens: s.tokens.map((t) =>
        t.id === id ? { ...t, revelado: !t.revelado } : t
      ),
    })),
  adicionar: (npc) =>
    set((s) => {
      // Gera um inteiro aleatório de 53 bits, compatível com JavaScript e BIGINT.
      const partes = new Uint32Array(2);
      let id;
      do {
        crypto.getRandomValues(partes);
        id = (partes[0] & 0x1fffff) * 0x100000000 + partes[1];
      } while (!id || s.tokens.some((t) => t.id === id));

      const token = { ...npc, id, x: -1, y: -1, cor: npc.cor ?? "#E24B4A", revelado: npc.revelado ?? false };
      return { tokens: reposicionar([...s.tokens, token], s.mapa) };
    }),
  remover: (id) =>
    set((s) => ({
      tokens: s.tokens.filter((t) => t.id !== id),
    })),
  ajustarHp: (id, delta) =>
    set((s) => ({
      tokens: s.tokens.map((t) => {
        if (t.id !== id || t.hp === undefined) return t;
        const max = t.hpMax ?? t.hp;
        return { ...t, hp: Math.min(max, Math.max(0, t.hp + delta)) };
      }),
    })),
  definirImagem: (id, imagem) =>
    set((s) => ({
      tokens: s.tokens.map((t) => (t.id === id ? { ...t, imagem } : t)),
    })),
}));
