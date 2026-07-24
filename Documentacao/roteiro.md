Documento de Design de Jogo (GDD) - Projeto Nêmesis (Título Provisório)

1. Visão Geral do Jogo
   Gênero: Thriller Psicológico, Educacional, Escape Room Narrativo.
   Plataforma/Motor: Web (HTML5) / Phaser (JavaScript).
   Estilo Visual: Indie 2D em Pixel Art, visão Top-Down (visto de cima).
   Escopo: Escala menor, focado em narrativa ambiental (environmental storytelling).
   Tema Principal: Conscientização sobre os cinco tipos de violência contra a mulher (Lei Maria da Penha), interseccionalidade e a cultura do machismo.
   Objetivo do Jogador: Explorar um apartamento, resolver puzzles baseados em metáforas de abuso e adquirir conhecimento para quebrar as "correntes" que trancam os cômodos, até alcançar a porta da rua e a liberdade.
2. Direção de Arte e Parâmetros Técnicos
   Resolução de Tela: 320x240 pixels (para garantir a imersão e o aspecto retrô).
   Tilesets: Os cenários devem ser construídos em grade com blocos de 32x32 pixels ou 16x16 pixels.
   Atmosfera: O jogo não possui o agressor fisicamente presente para evitar gatilhos diretos e afastar do terror clássico. A tensão é construída pela iluminação (que escurece ou muda de tom), design de som (tique-taque, batidas) e o peso psicológico do ambiente.
   As Correntes: As portas trancadas possuem correntes visuais sobrepostas. Elas se partem (com animação) quando a protagonista atinge uma "epifania" de conhecimento.
3. Personagens
   A Protagonista: Representa qualquer mulher. Não tem um rosto altamente detalhado para facilitar a projeção do jogador. Possui animações de Idle (parada) e Walk (andando).
   Nêmesis (Deusa da Justiça): Atua como guia e voz da consciência. Aparece visualmente como uma entidade etérea, uma aura brilhante ou uma constelação na interface. Ela não julga a protagonista, mas valida sua dor e ensina os conceitos de abuso.
4. Fluxo de Jogo e Puzzles (Os 5 Tipos de Violência)
   Fase 0: A Cutscene Inicial
   Cena: Tela escura, minimalista. Nêmesis se manifesta.
   Diálogo: "A história está cheia de mulheres que foram chamadas de loucas, histéricas ou vilãs. Mas muitas delas estavam apenas tentando sobreviver... e buscar justiça. Acorde."
   Transição: Fade out para o primeiro cômodo.
   Fase 1: O Quarto/Banheiro (Violência Psicológica)
   Conceito: Condutas que causem dano emocional, diminuam a autoestima ou manipulem.
   O Problema: A porta tem correntes. Há um espelho embaçado/distorcido com um bilhete vital. Clicar no espelho gera a mensagem: "Eu odeio olhar para mim mesma... ele tem razão sobre o meu corpo."
   A Solução: O jogador explora o quarto e coleta um "Item de Resgate Pessoal" (ex: uma medalha ou livro favorito). Isso ativa a variável de amor-próprio, permitindo limpar o espelho, ler o bilhete e quebrar as correntes da porta.
   Intervenção de Nêmesis: "A voz dele não define quem você é."
   Fase 2: O Corredor/Área de Serviço (Violência Física)
   Conceito: Ação que ofenda a integridade ou saúde corporal (retratada de forma indireta).
   O Problema: A protagonista se recusa a abrir a próxima porta e o jogo avisa: "Não posso sair assim. Alguém pode ver as marcas."
   A Solução (Mecânica de Drag and Drop): O jogador deve arrastar um banquinho pelo cenário até um armário alto para alcançar e coletar uma Blusa de Frio ou Maquiagem. Ao equipar o item, o sprite da personagem muda, ela esconde as marcas e a porta é liberada.
   Intervenção de Nêmesis: "Você não deveria ter que se esconder."
   Fase 3: O Escritório (Violência Patrimonial)
   Conceito: Controle, subtração ou destruição de bens, documentos ou recursos financeiros.
   O Problema: A protagonista precisa do seu passaporte/carteira de trabalho, mas o jogo avisa: "Não posso ir sem meus documentos. Ele disse que eu não sou nada sem ele."
   A Solução (Minigame): O jogador encontra o documento rasgado na lixeira. Abre-se um puzzle de arrastar e soltar para juntar os pedaços de papel na tela. Ao completar, a chave da gaveta é revelada.
   Intervenção de Nêmesis: "O controle financeiro não é cuidado. O que é seu, é seu direito e sua liberdade."
   Fase 4: O Quarto de Casal (Violência Sexual)
   Conceito: Atos forçados ou não consentidos, incluindo limitação de direitos reprodutivos.
   O Problema: Há uma área de "sombra" ao redor da cama que aplica um debuff de lentidão drástica na protagonista. A porta avisa: "Meu corpo não me pertence mais."
   A Solução: O jogador deve encontrar a cartela de pílulas (escondida ou no lixo) e uma Tranca de Porta solta. O jogador deve usar a tranca na porta do quarto (pelo lado de dentro). A sombra some e a velocidade volta ao normal.
   Intervenção de Nêmesis: "Seu corpo é o seu primeiro e mais sagrado território. O consentimento é a única regra."
   Fase 5: A Sala de Estar (Violência Moral e o Clímax)
   Conceito: Calúnia, difamação ou injúria, atacando a honra da mulher.
   O Problema: A porta da rua (saída final) está bloqueada por sprites de palavras flutuantes e ofensivas ("Louca", "Mentirosa"). O celular na mesa vibra com mensagens difamatórias enviadas pelo agressor para isolá-la da família.
   A Solução: O jogador deve vasculhar a sala e coletar 3 "Verdades" (orbes brilhantes ou memórias reais). Com as três coletadas, ele interage com o celular para apagar as mentiras. As palavras na porta da rua quebram.
   Intervenção de Nêmesis: "A mentira dele não apaga a sua história. A sua voz tem força. A porta está aberta."
   Fim do Jogo: A protagonista abre a porta. Luz branca, som de pássaros, quebra do ciclo.
5. Lista de Assets (Para os Artistas)
   +1

Cenários (Tilesets):
Chão/Paredes (madeira para salas, cerâmica para áreas molhadas).
Móveis fixos: Cama (versão normal e com sombra ao redor), armários, mesa de escritório, pia, porta da rua.
Portas internas (Abertas, Fechadas, e Fechadas com Correntes).
Sprites Interativos:
Espelho (Embaçado e Limpo).
Item de Resgate Pessoal.
Banquinho (Arrastável).
Blusa/Maquiagem (Coletável).
Pedaços de documento rasgado.
Cartela de pílulas e Tranca solta.
Celular (Animado - vibrando).
Orbes de "Verdade" e Palavras ofensivas.
Personagens:
Protagonista: Spritesheets de movimentação básica (sem blusa e com blusa).
Nêmesis: Arte etérea/iluminada para as caixas de diálogo e cutscene.
Interface (UI):
Inventário minimalista (para chaves e itens coletados).
Caixas de diálogo estilizadas.
