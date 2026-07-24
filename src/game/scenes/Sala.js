import { Scene } from "phaser";
import Player from "../../player.js";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  create() {
    // 1. Criar o objeto do Mapa (JSON do Tiled)
    const map = this.make.tilemap({ key: "mapa-sala" });

    // 2. Ligar os Tilesets do Tiled com as imagens carregadas no Phaser
    const tilesetPortasJanelas = map.addTilesetImage("TopDownHouse_DoorsAndWindows", "portas_janelas");
    const tilesetPortasAbertas = map.addTilesetImage("TopDownHouse_FloorsAndWalls_OpenDoors", "portas_abertas");
    const tilesetChaoParedes = map.addTilesetImage("TopDownHouse_FloorsAndWalls", "chao_paredes");
    const tilesetMoveis1 = map.addTilesetImage("TopDownHouse_FurnitureState1", "moveis_1");
    const tilesetMoveis2 = map.addTilesetImage("TopDownHouse_FurnitureState2", "moveis_2");
    const tilesetItensPequenos = map.addTilesetImage("TopDownHouse_SmallItems", "itens_pequenos");

    // Agrupamos os tilesets em um array para que todas as camadas tenham acesso
    const todosTilesets = [
      tilesetPortasJanelas,
      tilesetPortasAbertas,
      tilesetChaoParedes,
      tilesetMoveis1,
      tilesetMoveis2,
      tilesetItensPequenos
    ];

    // 3. Criar as Camadas na ordem correta de visualização (Suporta a ordem de sobreposição do Tiled!)
    const chaoLayer = map.createLayer("Chao", todosTilesets, 0, 0);
    this.paredeLayer = map.createLayer("Parede", todosTilesets, 0, 0);
    this.limiteLayer = map.createLayer("Limite do mapa", todosTilesets, 0, 0); // Barreiras físicas invisíveis
    const intransponivelLayer = map.createLayer("Intransponivel", todosTilesets, 0, 0); // Móveis sólidos 1
    const transponivelLayer = map.createLayer("Transponivel", todosTilesets, 0, 0); // Tapetes e decorações
    const intransponivel2Layer = map.createLayer("Intransponivel 2", todosTilesets, 0, 0); // Móveis sólidos 2
    
    // Novas Camadas adicionadas para interações da Fase 1!
    this.portaLayer = map.createLayer("Porta", todosTilesets, 0, 0); // Porta de saída
    this.interativoLayer = map.createLayer("Interativo", todosTilesets, 0, 0); // Espelho escondido
    this.interativoLayer.setVisible(true); // Visível desde o início, mas escondido atrás da estante
    this.arrastarLayer = map.createLayer("Arrastar", todosTilesets, 0, 0); // Estante empurrável

    // 4. Configurar Profundidade Visual (Z-Index correspondendo exatamente ao Tiled!)
    chaoLayer.setDepth(10);
    this.paredeLayer.setDepth(20);
    this.limiteLayer.setDepth(30);
    intransponivelLayer.setDepth(40);
    transponivelLayer.setDepth(50);
    intransponivel2Layer.setDepth(60);
    this.portaLayer.setDepth(70);
    this.interativoLayer.setDepth(80);
    this.arrastarLayer.setDepth(90);

    // Instanciação da Protagonista (Spawn seguro na área de piso livre, longe do sofá!)
    this.player = new Player(this, 168, 168);
    this.player.setDepth(95);         // Jogador desenhado de acordo com a ordem do Tiled

    // 5. Configurar Colisões Físicas em todas as camadas necessárias
    this.paredeLayer.setCollisionByExclusion([-1]);
    this.limiteLayer.setCollisionByExclusion([-1]);
    intransponivelLayer.setCollisionByExclusion([-1]);
    intransponivel2Layer.setCollisionByExclusion([-1]);
    this.arrastarLayer.setCollisionByExclusion([-1]); // Estante colide no começo!
    this.interativoLayer.setCollisionByExclusion([-1]); // O espelho bloqueia fisicamente!
    this.portaLayer.setCollisionByExclusion([-1]); // A porta também bloqueia!

    // Adiciona colisores e salva referências para controle futuro
    this.paredeCollider = this.physics.add.collider(this.player, this.paredeLayer);
    this.physics.add.collider(this.player, this.limiteLayer);
    this.physics.add.collider(this.player, intransponivelLayer);
    this.physics.add.collider(this.player, intransponivel2Layer);
    this.arrastarCollider = this.physics.add.collider(this.player, this.arrastarLayer);
    this.interativoCollider = this.physics.add.collider(this.player, this.interativoLayer); // Colisor do Espelho
    this.portaCollider = this.physics.add.collider(this.player, this.portaLayer); // Colisor da Porta (Fica bloqueada!)

    // 6. Ajustar Limites do Mundo Físico e da Câmera
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 7. Configurações de Estado de Interação da Fase 1
    this.estanteEmpurrada = false;
    this.espelhoResolvido = false;
    this.isDialogueActive = false;
    this.isQuizActive = false;
    this.quizStage = 1; // Controla a etapa do quiz (1 ou 2)
    this.isPaused = false; // Controle de pausa do jogo

    // Capturar Teclas Importantes
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.keyESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    // Texto de prompt flutuante (OCULTO e com a fonte m5x7 100% nítida e alinhada!)
    this.promptText = this.add.text(0, 0, "", {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D", // Soft Gold
      backgroundColor: "#2C1A11", // Zinnwaldite Brown
      padding: { x: 6, y: 4 },
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(0.5).setVisible(false).setDepth(200);

    // =========================================================================
    // ⏱️ SISTEMA DE CRONÔMETRO DE 10 MINUTOS & ESTÁGIOS DE TENSÃO
    // =========================================================================
    
    // Inicialização do Tempo Regressivo Persistente no Registro do Phaser
    if (!this.registry.has("tempoRestante")) {
      this.registry.set("tempoRestante", 600); // 10 minutos = 600 segundos
    }
    this.tempoFase = this.registry.get("tempoRestante");
    this.speedMultiplier = 1; // Multiplicador dinâmico de velocidade (reduzido no Estágio 4)
    this.estagioAtual = null; // Rastreia o estágio de tensão ativo para transições suaves

    // Painel de UI do Cronômetro (Caixa Retrô Minimalista no canto superior direito)
    this.timerBg = this.add.graphics();
    this.timerBg.fillStyle(0x2C1A11, 0.9); // Zinnwaldite Brown
    this.timerBg.lineStyle(1, 0xE3C18D, 1); // Borda Soft Gold
    this.timerBg.fillRect(205, 10, 105, 22);
    this.timerBg.strokeRect(205, 10, 105, 22);
    this.timerBg.setScrollFactor(0).setDepth(190);

    // Texto do Cronômetro (Formato MM:SS, 100% Nítido em 16px)
    const minutosIniciais = Math.floor(this.tempoFase / 60);
    const segundosIniciais = this.tempoFase % 60;
    const textoFormatado = "Tempo: " + String(minutosIniciais).padStart(2, '0') + ":" + String(segundosIniciais).padStart(2, '0');
    
    this.timerText = this.add.text(257, 21, textoFormatado, {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D",
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(191);

    // Overlay de Tint para Estágios de Tensão (Evita crash de cameras.main.setTint)
    this.screenTintOverlay = this.add.graphics();
    this.screenTintOverlay.setScrollFactor(0).setDepth(98).setVisible(false);

    // Overlay Vermelho para Pulso de Batimentos Cardíacos (Estágio 4)
    this.redOverlay = this.add.graphics();
    this.redOverlay.fillStyle(0xff0000, 0.25);
    this.redOverlay.fillRect(0, 0, 320, 240);
    this.redOverlay.setScrollFactor(0).setDepth(99).setVisible(false);
    this.redOverlay.setAlpha(0);
    this.heartbeatTween = null;

    // Evento de Tempo recorrente segundo a segundo (Sem pausar em diálogos/quizzes!)
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.tickSegundo,
      callbackScope: this,
      loop: true
    });

    // Ouvinte defensivo de encerramento da cena para limpar o ticker
    this.events.once("shutdown", () => {
      if (this.timerEvent) this.timerEvent.destroy();
    });

    // Aplica os efeitos de ambientação imediatamente ao carregar a cena
    this.atualizarEfeitosEstagio();
  }

  update() {
    // Escuta tecla ESC para pausar/despausar o jogo
    if (Phaser.Input.Keyboard.JustDown(this.keyESC)) {
      this.togglePause();
      return;
    }

    // Se o jogo estiver pausado, congela o ciclo e escuta o menu
    if (this.isPaused) {
      this.player.setVelocity(0);
      if (Phaser.Input.Keyboard.JustDown(this.keyM)) {
        this.scene.start("MainMenu");
      }
      return;
    }

    // Se o quiz estiver ativo, congela tudo e escuta as teclas 1 e 2 (Opções integradas no dialogue box!)
    if (this.isQuizActive) {
      this.player.setVelocity(0);
      
      if (Phaser.Input.Keyboard.JustDown(this.key1)) {
        this.processarRespostaQuiz(1);
      } else if (Phaser.Input.Keyboard.JustDown(this.key2)) {
        this.processarRespostaQuiz(2);
      }
      return;
    }

    // Se o diálogo estiver ativo, congela a movimentação física e aguarda a tecla E para avançar
    if (this.isDialogueActive) {
      this.player.setVelocity(0);
      
      // Mantém a animação de repouso (idle) correta durante o diálogo
      if (this.player.lastDirection === "side") {
        this.player.setFlipX(this.player.lastFlipX);
        this.player.anims.play("idle-side", true);
      } else if (this.player.lastDirection === "up") {
        this.player.anims.play("idle-up", true);
      } else {
        this.player.anims.play("idle-down", true);
      }

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.advanceDialogue();
      }
      return;
    }

    // Movimentação normal da personagem
    this.player.update();

    // Gerenciador de Proximidade e Interações
    let pertoDeInteracao = false;

    if (!this.estanteEmpurrada) {
      // Estante está localizada nas colunas 3, 4, 5 (x entre 32 e 112) e Y < 85.
      if (this.player.y < 85 && this.player.x > 32 && this.player.x < 112) {
        pertoDeInteracao = true;
        this.promptText.setText("[E] Empurrar Estante")
          .setPosition(80, 52)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.iniciarQuizEstante(); // Inicia o minigame de força psicológica!
        }
      }
    } else if (!this.espelhoResolvido) {
      // O espelho está agora exposto nas colunas 4 e 5 (x entre 56 e 96) e Y < 85
      if (this.player.y < 85 && this.player.x > 56 && this.player.x < 96) {
        pertoDeInteracao = true;
        this.promptText.setText("[E] Olhar no Espelho")
          .setPosition(80, 52)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.iniciarCenaEspelho();
        }
      }
    }

    // Interação com a Porta de Saída (Trancada antes da epifania, Portal para o Outro Mundo depois!)
    // A porta de saída fica nas colunas 8 e 9 (x entre 112 e 176, y < 85)
    if (this.player.x > 112 && this.player.x < 176 && this.player.y > 32 && this.player.y < 85) {
      pertoDeInteracao = true;
      if (!this.espelhoResolvido) {
        this.promptText.setText("[E] Abrir Porta")
          .setPosition(144, 52)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.iniciarInteracaoPortaTrancada();
        }
      } else {
        this.promptText.setText("[E] Ir para o Outro Mundo")
          .setPosition(144, 52)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.iniciarTransicaoOutroMundo();
        }
      }
    }

    // Se o jogador se afastar, esconde o prompt
    if (!pertoDeInteracao) {
      this.promptText.setVisible(false);
    }
  }

  // TELA DE PAUSA: Interrompe o jogo com overlay elegante, controles de volume e ações de sessão
  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // Congela o player
      this.player.setVelocity(0);

      this.pauseElements = [];
      this.pauseDragging = null;

      // Caixa de Pausa retrô minimalista clássica
      const box = this.add.graphics().setScrollFactor(0).setDepth(200);
      box.fillStyle(0x2C1A11, 0.95); // Zinnwaldite Brown
      box.lineStyle(1.5, 0xE3C18D, 1); // Borda Soft Gold
      box.fillRect(16, 14, 288, 212);
      box.strokeRect(16, 14, 288, 212);
      this.pauseElements.push(box);

      // Título da Pausa (m5x7 fica nítido apenas em múltiplos de 16px)
      const titulo = this.add.text(160, 40, "JOGO PAUSADO", {
        fontSize: "32px",
        fontStyle: "normal",
        color: "#E3C18D",
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
      this.pauseElements.push(titulo);

      // Controle de volume da Trilha Sonora
      this.criarSliderPausa("Música", 64, 80, this.registry.get("musicVolume"), (valor) => {
        this.registry.set("musicVolume", valor);
        const musica = this.sound.get("musica_fundo");
        if (musica) musica.setVolume(valor);
      });

      // Controle de volume do Som do Jogo (efeitos sonoros a serem adicionados futuramente)
      this.criarSliderPausa("Som do Jogo", 98, 114, this.registry.get("sfxVolume"), (valor) => {
        this.registry.set("sfxVolume", valor);
      });

      // Botão - Continuar
      this.criarBotaoPausa("Continuar", 142, () => {
        this.togglePause();
      });

      // Botão - Reiniciar (reinicia a fase do zero, com o cronômetro completo)
      this.criarBotaoPausa("Reiniciar", 170, () => {
        this.registry.set("tempoRestante", 600);
        this.isPaused = false;
        this.scene.restart();
      });

      // Botão - Menu Inicial
      this.criarBotaoPausa("Menu Inicial", 198, () => {
        this.isPaused = false;
        this.scene.start("MainMenu");
      });

      // Escuta global de arraste para os sliders de volume
      this.pausePointerMoveHandler = (pointer) => {
        if (this.pauseDragging) this.pauseDragging.updateFromPointer(pointer);
      };
      this.pausePointerUpHandler = () => {
        this.pauseDragging = null;
      };
      this.input.on("pointermove", this.pausePointerMoveHandler);
      this.input.on("pointerup", this.pausePointerUpHandler);
    } else {
      // Remove as escutas globais de arraste
      if (this.pausePointerMoveHandler) {
        this.input.off("pointermove", this.pausePointerMoveHandler);
        this.pausePointerMoveHandler = null;
      }
      if (this.pausePointerUpHandler) {
        this.input.off("pointerup", this.pausePointerUpHandler);
        this.pausePointerUpHandler = null;
      }
      this.pauseDragging = null;

      // Destrói de forma defensiva todos os elementos visuais de pausa
      if (this.pauseElements) {
        this.pauseElements.forEach((el) => {
          if (el && el.destroy) el.destroy();
        });
      }
      this.pauseElements = [];
    }
  }

  // AUXILIAR: Cria um slider horizontal de volume (arrastável e clicável) no menu de pausa
  criarSliderPausa(label, yLabel, yBar, valorInicial, onChange) {
    const barX = 30;
    const barWidth = 260;
    const barHeight = 8;

    const labelText = this.add.text(barX, yLabel, `${label}: ${Math.round(valorInicial * 100)}%`, {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D",
      fontFamily: "m5x7",
      resolution: 4
    }).setScrollFactor(0).setDepth(201);

    const barGraphics = this.add.graphics().setScrollFactor(0).setDepth(201);

    const desenhar = (valor) => {
      barGraphics.clear();
      barGraphics.fillStyle(0x000000, 0.4);
      barGraphics.fillRect(barX, yBar, barWidth, barHeight);
      barGraphics.lineStyle(1, 0xE3C18D, 1);
      barGraphics.strokeRect(barX, yBar, barWidth, barHeight);
      barGraphics.fillStyle(0xE3C18D, 1);
      barGraphics.fillRect(barX, yBar, barWidth * valor, barHeight);
    };

    desenhar(valorInicial);

    barGraphics.setInteractive(
      new Phaser.Geom.Rectangle(barX, yBar - 6, barWidth, barHeight + 12),
      Phaser.Geom.Rectangle.Contains
    );

    const sliderObj = {
      updateFromPointer: (pointer) => {
        const valor = Phaser.Math.Clamp((pointer.x - barX) / barWidth, 0, 1);
        desenhar(valor);
        labelText.setText(`${label}: ${Math.round(valor * 100)}%`);
        onChange(valor);
      }
    };

    barGraphics.on("pointerdown", (pointer) => {
      this.pauseDragging = sliderObj;
      sliderObj.updateFromPointer(pointer);
    });

    this.pauseElements.push(labelText, barGraphics);
  }

  // AUXILIAR: Cria um botão de ação do menu de pausa
  criarBotaoPausa(texto, y, onClick) {
    const x = 160;
    const width = 200;
    const height = 22;

    const graphics = this.add.graphics().setScrollFactor(0).setDepth(201);
    this.desenharBotaoQuiz(graphics, x, y, width, height, false, false);
    graphics.setInteractive(
      new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    const label = this.add.text(x, y, texto, {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D",
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    graphics.on("pointerover", () => {
      this.desenharBotaoQuiz(graphics, x, y, width, height, true, false);
      label.setColor("#ffffff");
    });
    graphics.on("pointerout", () => {
      this.desenharBotaoQuiz(graphics, x, y, width, height, false, false);
      label.setColor("#E3C18D");
    });
    graphics.on("pointerdown", () => {
      this.desenharBotaoQuiz(graphics, x, y, width, height, false, true);
      label.setColor("#ffffff");
      this.time.delayedCall(100, onClick);
    });

    this.pauseElements.push(graphics, label);
  }

  // MINIGAME: Quiz de Força Narrativa para Empurrar a Estante
  iniciarQuizEstante() {
    const falasIntro = [
      "Protagonista: Esta estante é pesada demais... Não tenho forças.",
      "Nêmesis: A estante guarda mentiras que tentam prender você.",
      "Nêmesis: Para ganhar força, responda à sua consciência:"
    ];

    this.startDialogue(falasIntro, () => {
      this.quizStage = 1; // Começa na primeira pergunta
      this.iniciarFaseQuizPergunta();
    });
  }

  iniciarFaseQuizPergunta() {
    this.isQuizActive = true;

    // Destrói caixas antigas de diálogo se houver
    this.limparQuiz();

    // 1. Desenha a moldura de diálogo de etapa estilizada na base (y=130) com altura de 100px para acomodar texto nativo de 16px
    this.dialogueBox = this.add.graphics();
    this.dialogueBox.fillStyle(0x2C1A11, 0.95);  // Zinnwaldite Brown com opacidade
    this.dialogueBox.lineStyle(1.5, 0xE3C18D, 1); // Borda Soft Gold
    this.dialogueBox.fillRect(10, 130, 300, 100); 
    this.dialogueBox.strokeRect(10, 130, 300, 100);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setDepth(100);

    // 2. Define o texto do Quiz completo (Pergunta + Opções no mesmo bloco do dialogueBox!)
    let questionText = "";
    if (this.quizStage === 1) {
      questionText = "Nêmesis: [ETAPA 1/2]\nO controle financeiro e a humilhação em público são demonstrações de cuidado e amor?\n\n[1] Sim, é proteção.\n[2] Não, é abuso psicológico.";
    } else {
      questionText = "Nêmesis: [ETAPA 2/2]\nSob ameaça em um abuso, qual a atitude mais segura para quebrar o ciclo?\n\n[1] Ligar 180 ou ir à DEAM por proteção.\n[2] Acalmar o agressor e esperar ele mudar.";
    }

    // 3. Adiciona o texto no bloco com resolução 2 para nitidez absoluta em 16px nativos
    this.dialogueText = this.add.text(18, 135, questionText, {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D", // Dourado Nêmesis
      wordWrap: { width: 284 },
      fontFamily: "m5x7",
      resolution: 4
    }).setScrollFactor(0).setDepth(101);
  }

  processarRespostaQuiz(opcao) {
    this.limparQuiz();
    this.isQuizActive = false;

    if (this.quizStage === 1) {
      if (opcao === 2) {
        // CORRETO ETAPA 1!
        const falasSucesso1 = [
          "Nêmesis: Exatamente. Controle e ciúme possessivo nunca serão amor.",
          "Nêmesis: São formas de abuso psicológico.",
          "Protagonista: Ele mentiu para me enfraquecer... Sinto minha mente clarear!",
          "Nêmesis: Excelente. Agora, responda ao dilema final:"
        ];

        this.startDialogue(falasSucesso1, () => {
          this.quizStage = 2; // Avança para a segunda pergunta
          this.iniciarFaseQuizPergunta();
        });
      } else {
        // INCORRETO ETAPA 1!
        const falasErro1 = [
          "Nêmesis: Reflita... O amor apoia e liberta, nunca prende ou diminui.",
          "Nêmesis: Tente novamente com atenção."
        ];

        this.startDialogue(falasErro1, () => {
          this.iniciarFaseQuizPergunta(); // Reinicia a pergunta 1
        });
      }
    } else {
      // ETAPA 2
      if (opcao === 1) {
        // CORRETO ETAPA 2!
        const falasSucesso2 = [
          "Nêmesis: Correto. O silêncio e o isolamento apenas fortalecem o agressor.",
          "Nêmesis: Ligar 180 ou ir à DEAM é seu direito legal e garantia de proteção.",
          "Protagonista: Não estou sozinha e não me calo mais! Tenho forças para sair!"
        ];

        this.startDialogue(falasSucesso2, () => {
          // Transição Suave (Phaser Tween) para mover a estante de lugar!
          this.arrastarEstanteComTransicao();
        });
      } else {
        // INCORRETO ETAPA 2!
        const falasErro2 = [
          "Nêmesis: Cuidado... Sofrer calada ou esperar mudança apenas prolonga o perigo.",
          "Nêmesis: Buscar ajuda e proteção externa é o passo mais seguro. Reflita."
        ];

        this.startDialogue(falasErro2, () => {
          this.iniciarFaseQuizPergunta(); // Reinicia a pergunta 2
        });
      }
    }
  }

  limparQuiz() {
    // Destrói de forma defensiva e anula referências para evitar dupla destruição
    if (this.dialogueBox && this.dialogueBox.destroy) this.dialogueBox.destroy();
    this.dialogueBox = null;

    if (this.dialogueText && this.dialogueText.destroy) this.dialogueText.destroy();
    this.dialogueText = null;
  }

  arrastarEstanteComTransicao() {
    // Toca a vibração de câmera constante enquanto empurra
    const shakeEvent = this.time.addEvent({
      delay: 50,
      callback: () => {
        this.cameras.main.shake(50, 0.005);
      },
      loop: true
    });

    // Phaser Tween para mover a estante suavemente por 1.5 segundos
    this.tweens.add({
      targets: this.arrastarLayer,
      x: this.arrastarLayer.x - 32, // Move 32 pixels para a esquerda
      duration: 1500,
      ease: "Power2", // Ease suave
      onComplete: () => {
        shakeEvent.destroy(); // Para o tremor de terra
        this.estanteEmpurrada = true;
        
        // Mensagem flutuante rápida de sucesso com alto contraste e plano (sem contornos ou sombras)
        const popText = this.add.text(80, 52, "Estante Movida!", {
          fontSize: "16px",
          fontStyle: "normal",
          color: "#E3C18D", // Dourado Soft Gold sólido
          backgroundColor: "#2C1A11", // Zinnwaldite Brown de alto contraste
          padding: { x: 8, y: 4 },
          fontFamily: "m5x7",
          resolution: 4
        }).setOrigin(0.5).setDepth(150);
        
        // Micro-animação premium de flutuação vertical em fade-out
        this.tweens.add({
          targets: popText,
          y: popText.y - 16,
          alpha: 0,
          duration: 2000,
          ease: "Power1",
          onComplete: () => {
            if (popText && popText.destroy) popText.destroy();
          }
        });
      }
    });
  }

  iniciarCenaEspelho() {
    const falas = [
      "Protagonista: Odeio olhar para mim mesma... Ele tem razão sobre meu corpo.",
      "Nêmesis: A voz dele não define quem você é. Lembre-se de sua essência.",
      "Protagonista: Eu sou sim uma mulher linda! Ele mentiu para me controlar!",
      "Nêmesis: Você quebrou a primeira corrente.",
      "Nêmesis: O amor-próprio é a sua primeira armadura."
    ];

    this.startDialogue(falas, () => {
      this.espelhoResolvido = true;
      
      // Efeito de clarão brilhante na câmera simbolizando a vitória
      this.cameras.main.flash(800, 255, 255, 255);
      
      // Remove o colisor físico do espelho para permitir aproximação total
      if (this.interativoCollider) {
        this.physics.world.removeCollider(this.interativoCollider);
      }

      this.exibirMensagemEpifania();
    });
  }

  iniciarTransicaoOutroMundo() {
    const falasTransicao = [
      "Protagonista: As correntes invisíveis finalmente desapareceram...",
      "Protagonista: Posso sentir a luz e o ar puro do outro lado desta porta.",
      "Nêmesis: Você confrontou a escuridão da mente e venceu.",
      "Nêmesis: Dê o primeiro passo. A liberdade real aguarda por você além deste quarto.",
      "Protagonista: Sim. É hora de recomeçar a minha história no Outro Mundo."
    ];

    this.startDialogue(falasTransicao, () => {
      // Efeito cinematográfico de fade-out suave para o branco (luz/liberdade)
      this.cameras.main.fadeOut(1500, 255, 255, 255);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        if (this.timerEvent) {
          this.timerEvent.destroy();
        }
        this.registry.set("resultadoFinal", "sucesso");
        this.scene.start("GameOver");
      });
    });
  }

  // Interação da Porta Trancada Narrativa (Exigência!)
  iniciarInteracaoPortaTrancada() {
    const falasPorta = [
      "Protagonista: A porta da sala está trancada por pesadas correntes...",
      "Protagonista: Sinto que são correntes invisíveis, presas aos meus medos.",
      "Nêmesis: As portas da liberdade física só se abrem após rompermos as correntes da mente.",
      "Nêmesis: Olhe ao redor. A estante no quarto esconde verdades que você precisa enfrentar no espelho."
    ];

    this.startDialogue(falasPorta, null);
  }

  startDialogue(lines, callback) {
    this.isDialogueActive = true;
    this.dialogueLines = lines;
    this.dialogueIndex = 0;
    this.dialogueCallback = callback;

    // Congela a velocidade física
    this.player.setVelocity(0);

    // Desenha a moldura de diálogo profissional na base e o retrato
    this.desenharCaixaDeDialogoProfissional();
    this.desenharAvatarProfissional("NÊM", 0x18453B, 0xE3C18D);

    // Texto de diálogo (Tamanho 16px nativo, Resolução 2!)
    this.dialogueText = this.add.text(64, 162, "", {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#ffffff",
      wordWrap: { width: 235 }, // Largura reduzida para caber ao lado do retrato
      fontFamily: "m5x7",
      resolution: 4
    }).setScrollFactor(0).setDepth(101);

    // 📢 INFORMATIVO DO CANTO INFERIOR: "[E] Próximo" piscando suavemente (16px nativo)
    this.dialogueNextLabel = this.add.text(295, 220, "[E] Próximo", {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D",
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(102);

    // Efeito de pulso piscante no informativo
    this.tweens.add({
      targets: this.dialogueNextLabel,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      loop: -1
    });

    this.advanceDialogue();
  }

  advanceDialogue() {
    if (this.dialogueIndex < this.dialogueLines.length) {
      const line = this.dialogueLines[this.dialogueIndex];

      // Formatação e cores do diálogo
      if (line.startsWith("Nêmesis:")) {
        this.dialogueText.setColor("#E3C18D"); // Soft Gold para Nêmesis
        
        // Redesenha o avatar completo para Nêmesis
        this.desenharAvatarProfissional("NÊM", 0x18453B, 0xE3C18D);
        
        // Remove o prefixo do texto de fala para ficar mais limpo
        this.dialogueText.setText(line.substring(9));
      } else {
        this.dialogueText.setColor("#ffffff"); // Branco para a Protagonista
        
        // Redesenha o avatar completo para a Protagonista (mostrando a cabecinha de 10px recortada!)
        this.desenharAvatarProfissional("PROT", 0x476861, 0xffffff);

        // Remove o prefixo do texto de fala para ficar mais limpo
        this.dialogueText.setText(line.substring(14));
      }

      this.dialogueIndex++;
    } else {
      // Destruição das interfaces ao fechar o diálogo
      if (this.dialogueBox && this.dialogueBox.destroy) this.dialogueBox.destroy();
      this.dialogueBox = null;

      if (this.dialogueText && this.dialogueText.destroy) this.dialogueText.destroy();
      this.dialogueText = null;

      if (this.avatarBox && this.avatarBox.destroy) this.avatarBox.destroy();
      this.avatarBox = null;

      if (this.avatarLabel && this.avatarLabel.destroy) this.avatarLabel.destroy();
      this.avatarLabel = null;

      if (this.avatarImage && this.avatarImage.destroy) this.avatarImage.destroy();
      this.avatarImage = null;

      if (this.avatarMaskShape && this.avatarMaskShape.destroy) this.avatarMaskShape.destroy();
      this.avatarMaskShape = null;

      if (this.dialogueNextLabel && this.dialogueNextLabel.destroy) this.dialogueNextLabel.destroy();
      this.dialogueNextLabel = null;

      this.isDialogueActive = false;

      if (this.dialogueCallback) {
        this.dialogueCallback();
      }
    }
  }

  // AUXILIAR: Desenha a caixa de diálogo com profundidade e cantos decorativos
  desenharCaixaDeDialogoProfissional() {
    this.dialogueBox = this.add.graphics();
    
    // Fundo Principal Zinnwaldite Brown com Opacidade de 0.9 (Semi-transparente elegante)
    this.dialogueBox.fillStyle(0x2C1A11, 0.9);
    this.dialogueBox.fillRect(10, 155, 300, 75);

    // Moldura Externa Fina em Dourado Soft Gold (1.5px de espessura)
    this.dialogueBox.lineStyle(1.5, 0xE3C18D, 1);
    this.dialogueBox.strokeRect(10, 155, 300, 75);

    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setDepth(100);
  }

  // AUXILIAR: Desenha a moldura e renderiza o retrato (Imagem cortada para a Protagonista, Imagem de alta res para NÊM)
  desenharAvatarProfissional(nome, corFundo, corBorda) {
    // Destrói avatares antigos para evitar duplicidade
    if (this.avatarBox && this.avatarBox.destroy) this.avatarBox.destroy();
    if (this.avatarLabel && this.avatarLabel.destroy) this.avatarLabel.destroy();
    if (this.avatarImage && this.avatarImage.destroy) this.avatarImage.destroy();
    if (this.avatarMaskShape && this.avatarMaskShape.destroy) this.avatarMaskShape.destroy();
    
    this.avatarLabel = null;
    this.avatarImage = null;
    this.avatarMaskShape = null;

    this.avatarBox = this.add.graphics();
    
    // Fundo do Retrato
    this.avatarBox.fillStyle(corFundo, 1);
    this.avatarBox.fillRect(15, 162, 41, 41);
    
    // Borda Principal
    this.avatarBox.lineStyle(1.5, corBorda, 1);
    this.avatarBox.strokeRect(15, 162, 41, 41);

    this.avatarBox.setScrollFactor(0);
    this.avatarBox.setDepth(101);

    // 1. Criamos a máscara que limita a exibição exatamente ao interior da moldura (15, 162, 41, 41)
    this.avatarMaskShape = this.add.graphics();
    this.avatarMaskShape.fillStyle(0xffffff);
    this.avatarMaskShape.fillRect(15, 162, 41, 41);
    this.avatarMaskShape.setScrollFactor(0);
    this.avatarMaskShape.setVisible(false); // Mantém invisível para não desenhar cor sólida na tela

    const mask = this.avatarMaskShape.createGeometryMask();

    if (nome === "PROT") {
      // 2. Sprite da Protagonista deslocada em Y para alinhar a cabeça ao centro do quadrado.
      this.avatarImage = this.add.image(35.5, 198, "player", 0);
      this.avatarImage.setScrollFactor(0).setDepth(102);
      this.avatarImage.setScale(3.5); // Escala para o rosto ficar perfeitamente nítido e dimensionado
      this.avatarImage.setMask(mask); // Aplica a máscara geométrica
    } else if (nome === "NÊM") {
      // 3. Retrato de alta resolução da Nêmesis (2048x2048) reduzido e centralizado perfeitamente
      this.avatarImage = this.add.image(35.5, 182.5, "nemesis_avatar");
      this.avatarImage.setScrollFactor(0).setDepth(102);
      this.avatarImage.setScale(41 / 2048); // Reduz de 2048px para 41px exatos!
      this.avatarImage.setMask(mask); // Aplica a máscara geométrica
    } else {
      // Fallback para outros nomes
      this.avatarLabel = this.add.text(35, 182, nome, {
        fontSize: "16px",
        fontStyle: "normal",
        color: corBorda,
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    }
  }

  // AUXILIAR: Desenha os botões do quiz/pausa no centro via código (Sem esticar imagens)
  desenharBotaoQuiz(graphics, x, y, width, height, hover, active) {
    graphics.clear();
    
    if (active) {
      graphics.fillStyle(0x476861, 0.95); // Deep Space Sparkle
      graphics.lineStyle(1.5, 0xffffff, 1); // Borda Branca
    } else if (hover) {
      graphics.fillStyle(0x18453B, 0.95); // MSU Green
      graphics.lineStyle(1.5, 0xE3C18D, 1); // Borda Soft Gold
    } else {
      graphics.fillStyle(0x2C1A11, 0.95); // Zinnwaldite Brown
      graphics.lineStyle(1.5, 0xE3C18D, 0.6); // Borda Soft Gold suave
    }
    
    // Desenha o botão retangular centralizado
    graphics.fillRect(x - width/2, y - height/2, width, height);
    graphics.strokeRect(x - width/2, y - height/2, width, height);
  }

  exibirMensagemEpifania() {
    const epifaniaText = this.add.text(160, 120, "Epifania Alcançada!\n\nVocê quebrou as correntes da mente.\nAproxime-se da porta para ir ao Outro Mundo.", {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D",
      align: "center",
      fontFamily: "m5x7",
      backgroundColor: "#2C1A11",
      padding: { x: 12, y: 12 },
      resolution: 4
    }).setOrigin(0.5).setDepth(150);

    // some após 5 segundos
    this.time.delayedCall(5000, () => {
      if (epifaniaText && epifaniaText.destroy) epifaniaText.destroy();
    });
  }

  // =========================================================================
  // ⏱️ MÉTODOS DO CRONÔMETRO E CONTROLE DE ESTÁGIOS DE TENSÃO
  // =========================================================================

  tickSegundo() {
    if (this.isPaused) {
      return;
    }

    this.tempoFase--;
    this.registry.set("tempoRestante", this.tempoFase);

    // Formatação de minutos/segundos
    const minutos = Math.floor(this.tempoFase / 60);
    const segundos = this.tempoFase % 60;
    const strMinutos = String(minutos).padStart(2, '0');
    const strSegundos = String(segundos).padStart(2, '0');
    
    // Efeito visual de dois-pontos piscando
    const caractereSeparador = segundos % 2 === 0 ? ":" : " ";
    this.timerText.setText(`Tempo: ${strMinutos}${caractereSeparador}${strSegundos}`);

    this.atualizarEfeitosEstagio();

    if (this.tempoFase <= 0) {
      if (this.timerEvent) {
        this.timerEvent.destroy();
      }
      this.fimDoTempoAbuso();
    }
  }

  atualizarEfeitosEstagio() {
    // 1. Determina qual deve ser o novo estágio ativo baseado no tempo restante
    let novoEstagio = 1;
    if (this.tempoFase > 450) {
      novoEstagio = 1;
    } else if (this.tempoFase > 300) {
      novoEstagio = 2;
    } else if (this.tempoFase > 120) {
      novoEstagio = 3;
    } else {
      novoEstagio = 4;
    }

    // 2. Se for a primeira carga (estagioAtual === null), desenha a cor correspondente sem transição
    if (this.estagioAtual === null) {
      this.estagioAtual = novoEstagio;
      this.screenTintOverlay.clear();
      
      let cor = 0x000000;
      let alphaAlvo = 0;
      
      if (novoEstagio === 2) { cor = 0xfffacd; alphaAlvo = 0.12; }
      else if (novoEstagio === 3) { cor = 0xffb87a; alphaAlvo = 0.16; }
      else if (novoEstagio === 4) { cor = 0xff4d4d; alphaAlvo = 0.20; }
      
      if (novoEstagio > 1) {
        this.screenTintOverlay.fillStyle(cor, 1);
        this.screenTintOverlay.fillRect(0, 0, 320, 240);
        this.screenTintOverlay.setVisible(true);
        this.screenTintOverlay.setAlpha(alphaAlvo);
      } else {
        this.screenTintOverlay.setVisible(false);
      }
    }
    // 3. Se o estágio mudou durante o jogo, dispara a transição suave de fade out/in (2.5 segundos totais)
    else if (this.estagioAtual !== novoEstagio) {
      const estagioAnterior = this.estagioAtual;
      this.estagioAtual = novoEstagio;
      
      // Desativa batimentos se saímos do estágio 4 por algum motivo
      if (estagioAnterior === 4 && novoEstagio < 4) {
        if (this.heartbeatTween) {
          this.heartbeatTween.destroy();
          this.heartbeatTween = null;
        }
        this.redOverlay.setVisible(false);
      }

      // Interação especial de tremor e diálogo no início do Estágio 3 (299 segundos)
      if (novoEstagio === 3) {
        this.cameras.main.shake(600, 0.006);
        this.startDialogue([
          "Protagonista: O ambiente está ficando sufocante... Sinto que o tempo está contra mim.",
          "Nêmesis: A pressão psicológica está se intensificando. Não deixe o ciclo de abusos se fechar!"
        ], null);
      }

      // Fade-out suave do filtro anterior (1.0 segundo)
      this.tweens.add({
        targets: this.screenTintOverlay,
        alpha: 0,
        duration: 1000,
        ease: "Linear",
        onComplete: () => {
          this.screenTintOverlay.clear();
          
          let cor = 0x000000;
          let alphaAlvo = 0;
          
          if (novoEstagio === 2) { cor = 0xfffacd; alphaAlvo = 0.12; }
          else if (novoEstagio === 3) { cor = 0xffb87a; alphaAlvo = 0.16; }
          else if (novoEstagio === 4) { cor = 0xff4d4d; alphaAlvo = 0.20; }
          
          if (novoEstagio > 1) {
            this.screenTintOverlay.fillStyle(cor, 1);
            this.screenTintOverlay.fillRect(0, 0, 320, 240);
            this.screenTintOverlay.setVisible(true);
            
            // Fade-in suave do novo filtro colorido (1.5 segundos)
            this.tweens.add({
              targets: this.screenTintOverlay,
              alpha: alphaAlvo,
              duration: 1500,
              ease: "Linear"
            });
          } else {
            this.screenTintOverlay.setVisible(false);
          }
        }
      });
    }

    // 4. Efeitos contínuos que rodam a cada segundo dentro do estágio ativo
    if (this.estagioAtual === 4 && this.tempoFase > 0) {
      // Redução de 15% na velocidade da protagonista (Opção B)
      this.speedMultiplier = 0.85;

      // Piscar cor do texto e borda do timer em vermelho/ouro a cada segundo
      if (this.tempoFase % 2 === 0) {
        this.timerText.setColor("#ff3333");
        this.timerBg.clear();
        this.timerBg.fillStyle(0x2C1A11, 0.9);
        this.timerBg.lineStyle(1.5, 0xff3333, 1);
        this.timerBg.fillRect(205, 10, 105, 22);
        this.timerBg.strokeRect(205, 10, 105, 22);
      } else {
        this.timerText.setColor("#E3C18D");
        this.timerBg.clear();
        this.timerBg.fillStyle(0x2C1A11, 0.9);
        this.timerBg.lineStyle(1, 0xE3C18D, 1);
        this.timerBg.fillRect(205, 10, 105, 22);
        this.timerBg.strokeRect(205, 10, 105, 22);
      }

      // Efeito de Pulsação de Batimento Cardíaco (Overlay vermelho pulsando)
      if (!this.heartbeatTween) {
        this.redOverlay.setVisible(true);
        this.heartbeatTween = this.tweens.add({
          targets: this.redOverlay,
          alpha: { from: 0.02, to: 0.4 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut"
        });
      }
    } else {
      // Velocidade normal nos demais estágios
      this.speedMultiplier = 1;
    }
  }

  fimDoTempoAbuso() {
    this.physics.world.pause();
    this.player.setVelocity(0);
    this.registry.set("resultadoFinal", "timeout");
    
    // Efeito cinematográfico de fade-out para o preto e transição
    this.cameras.main.fadeOut(1500, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("GameOver");
    });
  }
}
