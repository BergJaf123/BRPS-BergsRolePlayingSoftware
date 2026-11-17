import { create } from "zustand";

export const useJogo = create((set) => ({
  tokens: [
    { id: 1, nome: "Herói", x: 2, y: 3, cor: "#378ADD", revelado: true },
    { id: 2, nome: "Goblin", x: 8, y: 4, cor: "#E24B4A", revelado: false },
  ],
  definirTokens: (tokens) => set({ tokens }),
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
    set((s) => ({
      tokens: [
        ...s.tokens,
        { id: Date.now(), x: 0, y: 0, cor: "#E24B4A", revelado: false, ...npc },
      ],
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
