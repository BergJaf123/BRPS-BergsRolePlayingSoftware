# Regras para commits

Toda mensagem de commit segue este formato, em português:

    tipo: descrição curta no presente, com verbo no começo

Tipos permitidos:
- feat: funcionalidade nova
- fix: correção de erro
- style: aparência (CSS, layout), sem mudar a lógica
- refactor: reorganiza o código sem mudar o comportamento
- docs: documentação (README, docs/, legendas)
- chore: tarefas de manutenção (arquivos, dependências, configuração)
- merge: junção de branches

Regras:
1. Máximo de 72 caracteres na primeira linha, minúscula depois dos dois pontos, sem ponto final.
2. A mensagem diz O QUE mudou e, se couber, ONDE. Nunca use só um código, um hash, "update", "changes" ou "wip".
3. Um commit por mudança lógica. Não misture estilo, correção e funcionalidade no mesmo commit.
4. Se precisar explicar o porquê, deixe uma linha em branco e escreva um parágrafo curto abaixo da primeira linha.
5. Antes de commitar, rode `git status` e `git diff --stat` e confira que só entraram os arquivos da tarefa. Nunca adicione .env*, node_modules ou .next.
6. Depois de commitar, rode `git log --oneline -3` e confira que a mensagem ficou legível.

Exemplos bons:
- feat: excluir campanha com código do mestre
- fix: escapa aspas no lint do ExcluirCampanha
- style: harmoniza o mapa e a imagem da tela dos jogadores
- chore: remove arquivos vazios criados por engano
- merge: junta correções de build à branch de estilo
- docs: adiciona diagrama do banco em Mermaid

Exemplos ruins (não faça):
- 89f0606806f
- update
- mudanças
- ajustes diversos
