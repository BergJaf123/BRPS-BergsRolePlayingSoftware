import { create } from 'zustand';

export const useJogo = create((set) => ({
  tokens: [
    { id: 1, nome: 'Herói', x: 2, y: 3, cor: '#378ADD', revelado: true },
    { id: 2, nome: 'Goblin', x: 8, y: 4, cor: '#E24B4A', revelado: false },
  ],
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
}));
