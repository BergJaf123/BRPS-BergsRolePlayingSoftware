# BRPS — Bergs Role Playing Software

O BRPS é uma mesa virtual de RPG para o mestre preparar encontros e conduzir uma sessão. Ele pode descrever um personagem, revisar a ficha sugerida pela IA e colocá-lo no mapa. Os jogadores acompanham o tabuleiro por um link de leitura, enquanto o mestre controla quais personagens e imagens aparecem.

**Projeto Integrador de Desenvolvimento Web para IA e Banco de Dados.** [Abrir o BRPS na Vercel](https://bergs-role-playing-software.vercel.app/)

## Responsável pelo projeto

**Bergman** — único integrante do projeto acadêmico. Seu papel é integrar as telas da mesa, a API, o banco de dados e a geração por IA. Na demonstração, apresenta o fluxo completo e explica como uma descrição vira um personagem, como sua posição fica salva e o que é compartilhado com os jogadores.

## Como usar a mesa

1. Na página inicial, crie uma campanha com um nome e um código de mestre de 4 a 40 caracteres. A primeira sala é criada junto. Guarde o código para voltar ao painel.
2. Abra **Painel do mestre** e informe o código. Em **Gerar NPC com IA**, descreva um personagem. Revise nome, pontos de vida, classe de armadura e ataques antes de clicar em **Aprovar**.
3. Selecione o novo token (a peça que representa o personagem), clique em uma casa do chão e use **Revelar** quando ele entrar em cena. Aguarde **Salvo no banco** antes de recarregar.
4. Em outra aba ou dispositivo, escolha **Entrar como jogador** na mesma campanha. Os jogadores veem os tokens revelados e a imagem da sala quando o mestre escolhe mostrá-la. Pontos de vida, classe de armadura, descrição e ataques ficam no painel do mestre.

A página inicial permite buscar campanhas pelo nome. O painel também oferece rolagem de dados, criação manual de personagens e geração de mapas por descrição.

## Executar localmente

Use Node.js compatível com o Next.js 14 (mínimo 18.17), npm e um banco PostgreSQL com conexão SSL. O projeto usa PostgreSQL hospedado no Supabase.

1. Baixe a versão documentada e instale as dependências do arquivo de lock.

   ```bash
   git clone --branch feat/css-fix-merge https://github.com/BergJaf123/BRPS-BergsRolePlayingSoftware.git
   cd BRPS-BergsRolePlayingSoftware
   npm ci
   ```

2. Em um banco vazio, execute uma vez cada, na ordem indicada — [criação das tabelas](sql/schema.sql), [migração da imagem da sala](sql/002_sala_imagem.sql) e [índice de tokens](sql/indices.sql). No Supabase, use o SQL Editor.
3. Configure as variáveis no ambiente do servidor. Localmente, o Next.js também as aceita em `.env.local`, na raiz do projeto. Na Vercel, configure-as no ambiente de produção e faça um novo deploy para aplicar mudanças.

   | Variável | Finalidade |
   | --- | --- |
   | `DATABASE_URL` | Conexão PostgreSQL usada pelas rotas da API para consultar e salvar campanhas. |
   | `GROQ_API_KEY` | Chave do provedor para gerar NPCs e mapas reais. Sem ela, as rotas devolvem exemplos identificados como **Modo simulado**. |

   Mantenha os valores privados no servidor, fora do Git e sem o prefixo `NEXT_PUBLIC_`.

4. Inicie o projeto com `npm run dev` e abra [localhost:3000](http://localhost:3000). Para conferir a conexão, abra [a rota de saúde](http://localhost:3000/api/saude). Com o banco preparado, ela responde com `ok: true` e a quantidade de campanhas. Para testar a versão de produção localmente, execute `npm run build` e depois `npm start`.

## Como os dados circulam

As três telas usam **React, Next.js 14 (App Router) e JavaScript**. O Zustand mantém a mesa em memória durante a edição. O painel envia alterações às rotas do Next.js, que validam os dados e executam SQL parametrizado no PostgreSQL. Ao abrir novamente a campanha, o painel carrega o estado salvo. O código do mestre é verificado no servidor a partir de um hash com sal.

| Rota da API | Operação |
| --- | --- |
| `GET /api/campanhas` e `POST /api/campanhas` | Listar campanhas com a contagem de salas ou criar uma campanha com sua primeira sala. |
| `POST /api/campanhas/[id]/mestre` e `PUT /api/campanhas/[id]/mestre` | Conferir o código e abrir ou salvar o estado da mesa. |
| `GET /api/campanhas/[id]/estado` | Entregar o mapa e os dados públicos. A tela dos jogadores agenda uma nova consulta dois segundos depois de terminar a anterior. |
| `DELETE /api/campanhas/[id]` | Excluir a campanha após verificar o código. A exclusão remove também suas salas e tokens. |
| `POST /api/gerar-npc` e `POST /api/gerar-mapa` | Enviar a descrição à Groq e devolver um rascunho para revisão no painel. |

**A IA pode errar.** O servidor aceita pedidos de até 300 caracteres, limita a espera pelo provedor a 15 segundos e valida a estrutura da resposta. O mestre decide se o resultado serve à sessão.

## Banco de dados e evidências

| Tabela | O que guarda | Relação |
| --- | --- | --- |
| `campanhas` | Nome único, código do mestre em hash e data de criação. | Uma campanha pode ter várias salas. |
| `salas` | Dimensões do mapa, casas de chão, imagem e visibilidade. | `salas.campanha_id` referencia `campanhas.id`. |
| `tokens` | Nome, posição, visibilidade e ficha do personagem. | `tokens.sala_id` referencia `salas.id`. |

A primeira consulta de exemplo usa `LEFT JOIN` e `COUNT` para listar campanhas com o número de salas. A segunda relaciona as três tabelas e traz os tokens revelados das salas ativas. [Ver as duas consultas SQL](docs/consultas.sql)

A tela dos jogadores filtra tokens por sala e visibilidade. Para essa consulta, o índice composto `idx_tokens_sala_revelado` cobre `(sala_id, revelado)`. Na medição registrada para a sala 152, antes do índice o PostgreSQL fez uma leitura sequencial, descartou 29.902 linhas pelo filtro e executou a consulta em 3,542 ms. Depois, usou o índice e levou 0,918 ms. Os tempos correspondem a essas duas execuções. [Plano antes do índice](docs/evidencias/explain%20antes.png) · [Plano depois do índice](docs/evidencias/explain%20depois.png)

Para repetir a comparação em um banco de teste com dados fictícios, execute o `EXPLAIN (ANALYZE, BUFFERS)` de `docs/consultas.sql` com um ID de sala existente no lugar de `N`. Registre a primeira medição antes de aplicar `sql/indices.sql`. Aplique o índice uma única vez, repita a mesma consulta e compare os planos.

## Roteiro para a demonstração

- **IA real.** Em uma campanha fictícia, peça “Um goblin que guarda uma ponte e aceita pedágios em histórias”. Registre o pedido e a ficha retornada, edite um detalhe e aprove o NPC. Para comprovar a integração com a Groq, use a geração com chave configurada.
- **Persistência.** Mova o goblin e aguarde **Salvo no banco**. Recarregue a página, entre de novo com o código e confira o nome editado e a posição. Revele o token e execute a segunda consulta de exemplo para encontrá-lo pela campanha e pela sala.
- **Visão do jogador.** Abra a mesma campanha em uma janela anônima. Oculte e revele o goblin pelo painel do mestre e confira a mudança na outra janela. Repita com a imagem da sala.
- **Celular e erro.** Na largura de 375 px, confira a busca e o empilhamento dos painéis. Tente abrir o painel com um código incorreto e observe a mensagem de erro.

**Limitação conhecida.** A seleção e a movimentação de tokens no tabuleiro do mestre ainda dependem de clique ou toque. [Pendência de navegação por teclado](docs/PENDENCIAS-FRONT.md)
