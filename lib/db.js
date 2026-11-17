import Dexie from "dexie";

// Dexie só existe no navegador (no servidor do Next não há IndexedDB)
const db = typeof window !== "undefined" ? new Dexie("brps") : null;
if (db) db.version(1).stores({ campanhas: "id" });

export async function salvarCampanha(id, dados) {
  if (!db) return;
  await db.campanhas.put({ id, ...dados, atualizado: Date.now() });
}

export async function carregarCampanha(id) {
  if (!db) return null;
  return (await db.campanhas.get(id)) ?? null;
}
