async function chamar(url, opcoes) {
  let r;
  try {
    r = await fetch(url, {
      ...opcoes,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    throw new Error("Sem conexão com o servidor");
  }
  let d = null;
  try {
    d = await r.json();
  } catch {}
  if (!r.ok) throw new Error(d?.erro || "Erro no servidor");
  return d;
}

export function abrirCampanha(id, codigo) {
  return chamar(`/api/campanhas/${id}/mestre`, {
    method: "POST",
    body: JSON.stringify({ codigo }),
  });
}

export function salvarCampanha(id, codigo, estado) {
  return chamar(`/api/campanhas/${id}/mestre`, {
    method: "PUT",
    body: JSON.stringify({ codigo, ...estado }),
  });
}

export function lerEstadoPublico(id) {
  return chamar(`/api/campanhas/${id}/estado`, { method: "GET" });
}
