"use client";
import { useEffect, useState } from "react";

async function chamar(url, method, corpo) {
  const r = await fetch(url, {
    method, cache: "no-store",
    headers: corpo ? { "Content-Type": "application/json" } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const dados = await r.json();
  if (!r.ok) throw Object.assign(new Error(dados.erro || "Tente novamente."), { status: r.status });
  return dados;
}

function VerificarEmail({ url, codigoMestre, aoEntrar }) {
  const [email, setEmail] = useState("");
  const [desafio, setDesafio] = useState("");
  const [token, setToken] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const vincular = Boolean(codigoMestre);

  function recomecar() {
    setDesafio("");
    setToken("");
    setErro("");
    setMensagem("");
  }

  async function enviar(e) {
    e.preventDefault();
    if (ocupado) return;
    setOcupado(true);
    setErro("");
    setMensagem("");
    const corpo = { email, finalidade: vincular ? "vincular" : "entrar" };
    if (vincular) corpo.codigo = codigoMestre;
    try {
      if (!desafio) {
        const dados = await chamar(url, "POST", corpo);
        setDesafio(dados.desafio);
        setMensagem(vincular ? "Confira sua caixa de entrada e a pasta de spam." :
          "Se o endereço estiver vinculado a esta campanha, você receberá um código por e-mail.");
      } else {
        const dados = await chamar(url, "PUT", { ...corpo, desafio, token });
        recomecar();
        setEmail("");
        if (vincular) setMensagem("E-mail vinculado à campanha. Você já pode usá-lo na entrada do mestre.");
        else aoEntrar(dados.expira);
      }
    } catch (err) {
      setErro(err instanceof TypeError ? "Falha de conexão. Tente novamente." : err.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <details className="cartao recuperacao-email">
      <summary className="botao">{vincular ? "Vincular e-mail (opcional)" : "Entrar com e-mail (opcional)"}</summary>
      <form className="pilha" onSubmit={enviar}>
        <p className="texto-suave">{vincular
          ? "Confirme um e-mail seu para poder redefinir o código desta campanha se o esquecer."
          : "Use o e-mail que você já confirmou no painel desta campanha."}</p>
        <label className="rotulo">E-mail do mestre
          <input className="campo" type="email" autoComplete="email" maxLength={254} required
            value={email} readOnly={Boolean(desafio) || ocupado} onChange={(e) => setEmail(e.target.value)} />
        </label>
        {desafio && (
          <label className="rotulo">Código recebido por e-mail
            <input className="campo" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6,10}"
              maxLength={10} required value={token} onChange={(e) => setToken(e.target.value)} />
            <small>O pedido vale por até 10 minutos.</small>
          </label>
        )}
        {mensagem && <p className="aviso-ok" role="status">{mensagem}</p>}
        {erro && <p className="aviso-erro" role="alert">{erro}</p>}
        <div className="acoes">
          <button className="botao botao-primario" disabled={ocupado} type="submit">
            {ocupado ? "Aguarde..." : !desafio ? "Enviar código por e-mail" : vincular ? "Confirmar e-mail" : "Entrar com e-mail"}
          </button>
          {desafio && <button className="botao" type="button" disabled={ocupado} onClick={recomecar}>Recomeçar</button>}
        </div>
      </form>
    </details>
  );
}

function AcoesDaSessao({ url, aoEncerrar }) {
  const [novo, setNovo] = useState("");
  const [repeticao, setRepeticao] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  async function concluir(redefinir) {
    if (ocupado) return;
    setErro("");
    if (redefinir && novo !== repeticao) {
      setErro("Os dois códigos do mestre precisam ser iguais.");
      return;
    }
    setOcupado(true);
    try {
      if (redefinir) await chamar(url, "PATCH", { novoCodigo: novo });
      else await chamar(url, "DELETE");
      aoEncerrar(redefinir ? "Código alterado. Use o novo código para abrir o painel do mestre." : "");
    } catch (err) {
      if (err.status === 401) aoEncerrar("A sessão expirou. Entre de novo com seu e-mail.");
      else setErro(err instanceof TypeError ? "Falha de conexão. Tente novamente." : err.message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="cartao pilha" aria-label="Sessão por e-mail">
      <p>Você entrou com o e-mail desta campanha.</p>
      <details className="recuperacao-email">
        <summary className="botao">Recuperar código do mestre</summary>
        <form className="pilha" onSubmit={(e) => { e.preventDefault(); concluir(true); }}>
          <label className="rotulo">Novo código do mestre (4 a 40 caracteres)
            <input className="campo" type="password" autoComplete="new-password" minLength={4} maxLength={40}
              required value={novo} onChange={(e) => setNovo(e.target.value)} />
          </label>
          <label className="rotulo">Repita o novo código
            <input className="campo" type="password" autoComplete="new-password" minLength={4} maxLength={40}
              required value={repeticao} onChange={(e) => setRepeticao(e.target.value)} />
          </label>
          <button className="botao botao-primario" disabled={ocupado} type="submit">Salvar novo código</button>
        </form>
      </details>
      {erro && <p className="aviso-erro" role="alert">{erro}</p>}
      <button className="botao" type="button" disabled={ocupado} onClick={() => concluir(false)}>Sair da sessão por e-mail</button>
    </section>
  );
}

export default function RecuperacaoEmail({ campanha, codigoMestre }) {
  const url = `/api/campanhas/${campanha}/recuperacao`;
  const [expira, setExpira] = useState(null);
  const [aviso, setAviso] = useState("");
  const [consultando, setConsultando] = useState(!codigoMestre);

  useEffect(() => {
    if (codigoMestre) return;
    let ativo = true;
    setConsultando(true);
    chamar(url, "GET").then((d) => { if (ativo) setExpira(d.expira); })
      .catch(() => { if (ativo) setExpira(null); })
      .finally(() => { if (ativo) setConsultando(false); });
    return () => { ativo = false; };
  }, [url, codigoMestre]);

  useEffect(() => {
    if (!expira) return;
    const t = setTimeout(() => {
      setExpira(null);
      setAviso("A sessão por e-mail expirou.");
    }, Math.max(0, Date.parse(expira) - Date.now()));
    return () => clearTimeout(t);
  }, [expira]);

  if (codigoMestre) return <VerificarEmail url={url} codigoMestre={codigoMestre} />;
  if (consultando) return null;
  return (
    <>
      {aviso && <p className="aviso" role="status">{aviso}</p>}
      {expira ? <AcoesDaSessao url={url} aoEncerrar={(texto) => { setExpira(null); setAviso(texto); }} /> :
        <VerificarEmail url={url} aoEntrar={(prazo) => { setAviso(""); setExpira(prazo); }} />}
    </>
  );
}
