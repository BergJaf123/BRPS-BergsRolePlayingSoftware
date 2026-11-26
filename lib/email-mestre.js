export const tempoProvedor = 4000;

export function emailConfigurado() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}

async function chamarAuth(rota, corpo) {
  const url = new URL("/auth/v1/" + rota, process.env.SUPABASE_URL);
  return fetch(url, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpo),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(tempoProvedor),
  });
}

export async function enviarVerificacao(email, cadastrar) {
  const resposta = await chamarAuth("otp", { email, create_user: cadastrar });
  return resposta.status;
}

export async function verificarEmail(email, token) {
  const resposta = await chamarAuth("verify", { type: "email", email, token });
  if (resposta.status === 429) return { limitado: true };
  if (resposta.status >= 500) throw new Error("Serviço de e-mail indisponível");
  if (!resposta.ok) return {};
  const { user } = await resposta.json();
  if (!user?.email_confirmed_at || user.email?.toLowerCase() !== email) return {};
  return { usuario: user.id };
}
