import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSql } from "../../../../../lib/sql";
import { autorizar, idValido } from "../../../../../lib/estado";
import { gerarHash } from "../../../../../lib/codigo";
import { emailConfigurado, enviarVerificacao, tempoProvedor, verificarEmail } from "../../../../../lib/email-mestre";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const opcoes = { "Cache-Control": "no-store" };
const responder = (corpo, status = 200) => NextResponse.json(corpo, { status, headers: opcoes });
const falha = (erro, status) => responder({ erro }, status);
const invalido = () => falha("Verificação inválida ou expirada. Peça outro código por e-mail.", 400);
const indisponivel = () => falha("Recuperação por e-mail indisponível no momento.", 503);
const codigoValido = (s) => typeof s === "string" && s.length >= 4 && s.length <= 40;
const nomeCookie = "brps_email";
const hashSessao = (segredo) => createHash("sha256").update(segredo).digest("hex");

function cookieSessao(resposta, id, segredo, maxAge) {
  resposta.cookies.set(nomeCookie, segredo, {
    path: `/api/campanhas/${id}/recuperacao`, httpOnly: true,
    secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge,
  });
  return resposta;
}

function identificarSessao(req) {
  const segredo = req.cookies.get(nomeCookie)?.value;
  return /^[0-9a-f]{64}$/.test(segredo ?? "") ? hashSessao(segredo) : null;
}

async function solicitar(sql, id, email, vincular) {
  const desafio = randomUUID();
  const [reserva] = await sql`
    UPDATE campanhas SET desafio_email = ${desafio}, email_desafio = ${email},
      desafio_enviado_em = now(), desafio_tentativas = 0
    WHERE id = ${id}
      AND ((${vincular} AND email_recuperacao IS NULL) OR (NOT ${vincular} AND email_recuperacao = ${email}))
      AND (desafio_enviado_em IS NULL OR desafio_enviado_em <= now() - interval '60 seconds')
    RETURNING id
  `;
  if (reserva) {
    try {
      const status = await enviarVerificacao(email, vincular);
      if (vincular && status === 429) return falha("Aguarde para pedir outro código por e-mail.", 429);
      if (vincular && status >= 400) return indisponivel();
    } catch {
      if (vincular) return indisponivel();
    }
  } else if (vincular) {
    return falha("Esta campanha já tem um e-mail confirmado ou houve um pedido no último minuto.", 409);
  }
  // O pedido público tem a mesma resposta mesmo se o endereço não pertencer à campanha.
  return responder({ desafio });
}

async function confirmar(sql, id, email, vincular, dados) {
  const { desafio, token } = dados;
  if (typeof desafio !== "string" || !/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(desafio) ||
      typeof token !== "string" || !/^\d{6,10}$/.test(token)) return invalido();

  // Reserva uma tentativa antes de consultar o provedor, inclusive em requisições simultâneas.
  const [pedido] = await sql`
    UPDATE campanhas SET desafio_tentativas = desafio_tentativas + 1
    WHERE id = ${id} AND desafio_email = ${desafio} AND email_desafio = ${email}
      AND ((${vincular} AND email_recuperacao IS NULL) OR (NOT ${vincular} AND email_recuperacao = ${email}))
      AND desafio_enviado_em > now() - interval '10 minutes' AND desafio_tentativas < 5
    RETURNING usuario_recuperacao, codigo_hash
  `;
  if (!pedido) return invalido();
  const { usuario, limitado } = await verificarEmail(email, token).catch((e) => {
    if (vincular) throw e;
    return {};
  });
  if (limitado && !vincular) return invalido();
  if (limitado) return falha("Muitas tentativas. Aguarde antes de tentar novamente.", 429);
  if (!usuario || (!vincular && usuario !== pedido.usuario_recuperacao)) return invalido();

  const segredo = vincular ? null : randomBytes(32).toString("hex");
  const alteracao = vincular
    ? sql`email_recuperacao = ${email}, usuario_recuperacao = ${usuario}`
    : sql`sessao_email_hash = ${hashSessao(segredo)}, sessao_email_expira = now() + interval '10 minutes'`;
  const [alterada] = await sql`
    UPDATE campanhas SET ${alteracao}, desafio_email = NULL, email_desafio = NULL,
      desafio_enviado_em = NULL, desafio_tentativas = 0
    WHERE id = ${id} AND desafio_email = ${desafio} AND codigo_hash = ${pedido.codigo_hash}
      AND desafio_enviado_em > now() - interval '10 minutes'
    RETURNING sessao_email_expira
  `;
  if (!alterada) return invalido();
  if (vincular) return responder({ ok: true });
  return cookieSessao(responder({ expira: alterada.sessao_email_expira }), id, segredo, 600);
}

async function atender(req, params, operacao) {
  const id = idValido(params.id);
  const dados = await req.json().catch(() => null);
  const email = typeof dados?.email === "string" ? dados.email.trim().toLowerCase() : "";
  if (!id || !["vincular", "entrar"].includes(dados?.finalidade) ||
      email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return falha("Pedido inválido.", 400);
  if (!emailConfigurado()) return indisponivel();
  const vincular = dados.finalidade === "vincular";
  try {
    const sql = getSql();
    if (vincular) {
      if (!codigoValido(dados.codigo) || await autorizar(sql, id, dados.codigo) !== "ok") {
        return falha("Código do mestre incorreto.", 403);
      }
      return await operacao(sql, id, email, vincular, dados);
    }
    // Uma consulta pública não deve revelar por seu tempo se o e-mail está cadastrado.
    const [resposta] = await Promise.all([
      operacao(sql, id, email, vincular, dados),
      new Promise((resolve) => setTimeout(resolve, tempoProvedor + 300)),
    ]);
    return resposta;
  } catch {
    return indisponivel();
  }
}

export function POST(req, { params }) {
  return atender(req, params, solicitar);
}

export function PUT(req, { params }) {
  return atender(req, params, confirmar);
}

async function sessaoAtiva(sql, id, hash) {
  const [sessao] = await sql`
    SELECT sessao_email_expira FROM campanhas WHERE id = ${id}
      AND sessao_email_hash = ${hash} AND sessao_email_expira > now()
  `;
  return sessao;
}

export async function GET(req, { params }) {
  const id = idValido(params.id);
  const hash = identificarSessao(req);
  if (!id || !hash) return responder({ expira: null });
  try {
    const sessao = await sessaoAtiva(getSql(), id, hash);
    return responder({ expira: sessao?.sessao_email_expira ?? null });
  } catch {
    return indisponivel();
  }
}

export async function PATCH(req, { params }) {
  const id = idValido(params.id);
  const hash = identificarSessao(req);
  const recusada = () => falha("Entre novamente com o e-mail desta campanha.", 401);
  if (!id || !hash) return recusada();
  const dados = await req.json().catch(() => null);
  if (!codigoValido(dados?.novoCodigo)) return falha("Use de 4 a 40 caracteres no novo código.", 400);
  try {
    const sql = getSql();
    if (!await sessaoAtiva(sql, id, hash)) return recusada();
    const [alterada] = await sql`
      UPDATE campanhas SET codigo_hash = ${gerarHash(dados.novoCodigo)},
        sessao_email_hash = NULL, sessao_email_expira = NULL,
        desafio_email = NULL, email_desafio = NULL, desafio_enviado_em = NULL, desafio_tentativas = 0
      WHERE id = ${id} AND sessao_email_hash = ${hash} AND sessao_email_expira > now()
      RETURNING id
    `;
    if (!alterada) return recusada();
    return cookieSessao(responder({ ok: true }), id, "", 0);
  } catch {
    return indisponivel();
  }
}

export async function DELETE(req, { params }) {
  const id = idValido(params.id);
  if (!id) return falha("Campanha inválida.", 400);
  const hash = identificarSessao(req);
  try {
    if (hash) {
      const sql = getSql();
      await sql`UPDATE campanhas SET sessao_email_hash = NULL, sessao_email_expira = NULL
        WHERE id = ${id} AND sessao_email_hash = ${hash}`;
    }
    return cookieSessao(responder({ ok: true }), id, "", 0);
  } catch {
    return indisponivel();
  }
}
