import postgres from "postgres";

let conexao = globalThis.__brpsSql;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada");
  }
  if (!conexao) {
    conexao = postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: 3,
      ssl: "require",
      idle_timeout: 20,
      connect_timeout: 10,
    });
    globalThis.__brpsSql = conexao;
  }
  return conexao;
}
