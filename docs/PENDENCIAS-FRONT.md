# Pendências do front

## Operar o tabuleiro do mestre pelo teclado

Em `components/Mapa.jsx`, a seleção de tokens e a escolha da casa de destino dependem de cliques. Para operar o tabuleiro pelo teclado, é preciso acrescentar navegação pelas casas, ativação da seleção e do movimento e indicação da posição e do token para leitores de tela. Essa mudança envolve eventos e gerenciamento de foco. O teste de aceitação é selecionar um token e movê-lo usando apenas o teclado, sem precisar tabular por todas as casas. A tela dos jogadores deve continuar somente leitura.
