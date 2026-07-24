import { Scene } from "phaser";
import Player from "../../player.js";
import TensaoTimer from "../systems/TensaoTimer.js";
import { resetarTodoProgresso } from "../systems/Progresso.js";

export class SalaDeEstar extends Scene {
  constructor() {
    super("SalaDeEstar");
  }

  create() {
    // 1. Criar o objeto do Mapa (JSON do Tiled)
    const map = this.make.tilemap({ key: "mapa-sala-de-estar" });

    // 2. Ligar os Tilesets do Tiled com as imagens carregadas no Phaser
    const tilesetPortasJanelas = map.addTilesetImage("TopDownHouse_DoorsAndWindows", "portas_janelas");
    const tilesetPortasAbertas = map.addTilesetImage("TopDownHouse_FloorsAndWalls_OpenDoors", "portas_abertas");
    const tilesetChaoParedes = map.addTilesetImage("TopDownHouse_FloorsAndWalls", "chao_paredes");
    const tilesetMoveis1 = map.addTilesetImage("TopDownHouse_FurnitureState1", "moveis_1");
    const tilesetMoveis2 = map.addTilesetImage("TopDownHouse_FurnitureState2", "moveis_2");
    const tilesetItensPequenos = map.addTilesetImage("TopDownHouse_SmallItems", "itens_pequenos");

    const todosTilesets = [
      tilesetPortasJanelas,
      tilesetPortasAbertas,
      tilesetChaoParedes,
      tilesetMoveis1,
      tilesetMoveis2,
      tilesetItensPequenos
    ];

    // O mapa (240x240) é menor que a tela (320x240): centralizamos com uma folga horizontal de 40px
    const offsetX = 40;

    // 3. Criar as Camadas na ordem correta de visualização
    const chaoLayer = map.createLayer("Chao", todosTilesets, offsetX, 0);
    this.paredeLayer = map.createLayer("Parede", todosTilesets, offsetX, 0);
    this.limiteLayer = map.createLayer("Limite do mapa", todosTilesets, offsetX, 0);
    const intransponivelLayer = map.createLayer("Intransponivel", todosTilesets, offsetX, 0);
    const transponivelLayer = map.createLayer("Transponivel", todosTilesets, offsetX, 0);
    const intransponivel2Layer = map.createLayer("Intransponivel 2", todosTilesets, offsetX, 0);
    this.portaLayer = map.createLayer("Porta", todosTilesets, offsetX, 0);
    this.interativoLayer = map.createLayer("Interativo", todosTilesets, offsetX, 0);
    this.portaRuaLayer = map.createLayer("Porta_rua", todosTilesets, offsetX, 0);

    // 4. Configurar Profundidade Visual
    chaoLayer.setDepth(10);
    this.paredeLayer.setDepth(20);
    this.limiteLayer.setDepth(30);
    intransponivelLayer.setDepth(40);
    transponivelLayer.setDepth(50);
    intransponivel2Layer.setDepth(65);
    this.interativoLayer.setDepth(80);

    // Instanciação da Protagonista (spawna perto da porta de entrada, vinda do Quarto de Casal)
    this.player = new Player(this, 168, 180);
    this.player.setDepth(95);

    // A porta de entrada fica ACIMA da protagonista (ilusão de passar por trás do batente, só os pés
    // cruzam a soleira). A porta da rua fica dentro de uma faixa de parede sólida — a protagonista
    // precisa chegar bem perto pra interagir, então essa porta fica ABAIXO dela (evita cobrir o corpo
    // inteiro, mesmo problema já corrigido na porta do Escritório).
    this.portaLayer.setDepth(100);
    this.portaRuaLayer.setDepth(90);

    // 5. Configurar Colisões Físicas (as portas são apenas visuais/transponíveis)
    this.paredeLayer.setCollisionByExclusion([-1]);
    this.limiteLayer.setCollisionByExclusion([-1]);
    intransponivelLayer.setCollisionByExclusion([-1]);
    intransponivel2Layer.setCollisionByExclusion([-1]);

    this.physics.add.collider(this.player, this.paredeLayer);
    this.physics.add.collider(this.player, this.limiteLayer);
    this.physics.add.collider(this.player, intransponivelLayer);
    this.physics.add.collider(this.player, intransponivel2Layer);

    // 6. Ajustar Limites do Mundo Físico e da Câmera (tela inteira, já que o cômodo cabe nela)
    this.physics.world.setBounds(0, 0, 320, 240);
    this.cameras.main.setBounds(0, 0, 320, 240);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 7. Configurações de Estado de Interação da Fase 5 (Moral)
    this.isDialogueActive = false;
    this.isPaused = false;

    // Capturar Teclas Importantes
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    // Texto de prompt flutuante
    this.promptText = this.add.text(0, 0, "", {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D",
      backgroundColor: "#2C1A11",
      padding: { x: 6, y: 4 },
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(0.5).setVisible(false).setDepth(200);

    // Estado de progresso da Fase 5 — lido do registro global pra não se perder ao voltar de outro
    // cômodo e essa cena ser recriada do zero.
    this.celularUsado = this.registry.get("celularUsado") || false;

    this.criarVerdades();
    this.criarCelular();
    if (!this.celularUsado) {
      this.criarPalavrasOfensivas();
    } else {
      this.palavrasOfensivas = [];
    }

    // ⏱️ Cronômetro global de 10 minutos e estágios de tensão (compartilhado entre todos os cômodos)
    this.tensao = new TensaoTimer(this);
  }

  update() {
    // Se o diálogo estiver ativo, congela a movimentação física; E avança, ESC pula direto pro fim
    if (this.isDialogueActive) {
      this.player.setVelocity(0);
      this.player.stopWalkSound();

      if (this.player.lastDirection === "side") {
        this.player.setFlipX(this.player.lastFlipX);
        this.player.anims.play("idle-side", true);
      } else if (this.player.lastDirection === "up") {
        this.player.anims.play("idle-up", true);
      } else {
        this.player.anims.play("idle-down", true);
      }

      if (Phaser.Input.Keyboard.JustDown(this.keyESC)) {
        this.dialogueIndex = this.dialogueLines.length;
        this.advanceDialogue();
        return;
      }

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.advanceDialogue();
      }
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyESC)) {
      this.sound.play("som_click", { volume: this.registry.get("sfxVolume") });
      this.togglePause();
      return;
    }

    if (this.isPaused) {
      this.player.setVelocity(0);
      this.player.stopWalkSound();
      if (Phaser.Input.Keyboard.JustDown(this.keyM)) {
        this.scene.start("MainMenu");
      }
      return;
    }

    this.player.update();

    let pertoDeInteracao = false;

    // Verdades: 3 orbes espalhados pela sala
    this.verdades.forEach((verdade) => {
      if (verdade.coletada) return;

      if (this.player.x > verdade.area.x1 && this.player.x < verdade.area.x2 &&
        this.player.y > verdade.area.y1 && this.player.y < verdade.area.y2) {
        pertoDeInteracao = true;
        this.promptText.setText("[E] Lembrar")
          .setPosition(verdade.x, verdade.y - 16)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.coletarVerdade(verdade);
        }
      }
    });

    // Celular: vibrando com mensagens difamatórias
    if (this.player.x > this.celularArea.x1 && this.player.x < this.celularArea.x2 &&
      this.player.y > this.celularArea.y1 && this.player.y < this.celularArea.y2) {
      pertoDeInteracao = true;

      if (this.verdadesColetadas < 3) {
        this.promptText.setText("[E] Celular (ainda vibrando)")
          .setPosition(this.celularPos.x, this.celularPos.y - 16)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.examinarCelularCedo();
        }
      } else if (!this.celularUsado) {
        this.promptText.setText("[E] Apagar as Mentiras")
          .setPosition(this.celularPos.x, this.celularPos.y - 16)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.usarCelular();
        }
      }
    }

    // Porta de entrada: sempre disponível para voltar ao Quarto de Casal
    if (this.player.x > 144 && this.player.x < 192 && this.player.y > 146 && this.player.y < 180) {
      pertoDeInteracao = true;
      this.promptText.setText("[E] Voltar para o Quarto")
        .setPosition(168, 164)
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.promptText.setVisible(false);
        this.iniciarTransicaoSaida();
      }
    }

    // Porta da rua: saída final, bloqueada pelas palavras até o celular ser resolvido
    if (this.player.x > 50 && this.player.x < 94 && this.player.y > 56 && this.player.y < 92) {
      pertoDeInteracao = true;

      if (!this.celularUsado) {
        this.promptText.setText("[E] Porta Bloqueada")
          .setPosition(72, 20)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.iniciarPortaRuaBloqueada();
        }
      } else {
        this.promptText.setText("[E] Abrir a Porta da Rua")
          .setPosition(72, 20)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.iniciarFinalDoJogo();
        }
      }
    }

    if (!pertoDeInteracao) {
      this.promptText.setVisible(false);
    }
  }

  // =========================================================================
  // ✨ VERDADES: 3 orbes brilhantes escondidos pela sala (memórias reais)
  // =========================================================================

  criarVerdades() {
    const posicoes = [
      { x: 100, y: 110 },
      { x: 230, y: 150 },
      { x: 90, y: 200 }
    ];

    const falas = [
      "Protagonista: Minha melhor amiga me disse que sentia minha falta. Ele dizia que ela só falava mal de mim.",
      "Protagonista: Minha mãe me abraçou e disse que eu sempre teria um lugar em casa. Isso é real. Isso aconteceu.",
      "Protagonista: Eu lembro de rir de verdade, sozinha, sem precisar da aprovação de ninguém."
    ];

    // Progresso individual de cada verdade, lido do registro global pra sobreviver a uma troca de cena
    const coletadasSalvas = this.registry.get("verdadesColetadasFlags") || [false, false, false];

    this.verdadesColetadas = 0;

    this.verdades = posicoes.map((pos, i) => {
      const jaColetada = coletadasSalvas[i] || false;
      if (jaColetada) this.verdadesColetadas++;

      let icon = null;
      if (!jaColetada) {
        // Desenhada em torno da origem local (0,0) e posicionada via setPosition, pra que a pulsação
        // e a rotação cresçam/girem em torno do próprio centro do orbe, sem deslocá-lo pela tela.
        icon = this.add.graphics().setDepth(41).setPosition(pos.x, pos.y);
        this.desenharVerdade(icon);

        this.tweens.add({
          targets: icon,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 700 + i * 120,
          yoyo: true,
          loop: -1,
          ease: "Sine.easeInOut"
        });

        this.tweens.add({
          targets: icon,
          angle: 360,
          duration: 5000 + i * 700,
          loop: -1,
          ease: "Linear"
        });
      }

      return {
        indice: i,
        x: pos.x,
        y: pos.y,
        icon,
        coletada: jaColetada,
        fala: falas[i],
        area: { x1: pos.x - 14, x2: pos.x + 14, y1: pos.y - 14, y2: pos.y + 14 }
      };
    });
  }

  desenharVerdade(graphics) {
    // brilho externo suave
    graphics.fillStyle(0xE3C18D, 0.2);
    graphics.fillCircle(0, 0, 12);
    graphics.fillStyle(0xE3C18D, 0.5);
    graphics.fillCircle(0, 0, 7);

    // faísca de 4 pontas por trás do núcleo, dando o efeito de "brilhante"
    graphics.fillStyle(0xffffff, 0.85);
    graphics.fillPoints([
      { x: 0, y: -11 }, { x: 2, y: -2 }, { x: 11, y: 0 }, { x: 2, y: 2 },
      { x: 0, y: 11 }, { x: -2, y: 2 }, { x: -11, y: 0 }, { x: -2, y: -2 }
    ], true);

    // núcleo brilhante
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(0, 0, 3);
  }

  coletarVerdade(verdade) {
    verdade.coletada = true;
    this.verdadesColetadas++;
    if (verdade.icon) {
      verdade.icon.destroy();
      verdade.icon = null;
    }
    this.sound.play("som_click", { volume: this.registry.get("sfxVolume") });

    const flags = this.registry.get("verdadesColetadasFlags") || [false, false, false];
    flags[verdade.indice] = true;
    this.registry.set("verdadesColetadasFlags", flags);

    this.startDialogue([verdade.fala], null);
  }

  // =========================================================================
  // 📱 CELULAR: mensagens difamatórias que precisam ser apagadas
  // =========================================================================

  criarCelular() {
    this.celularPos = { x: 120, y: 150 };

    // Desenhado em torno da origem local e posicionado via setPosition, pra que o tremor de vibração
    // (rotação) gire em torno do próprio centro do aparelho, sem deslocá-lo pela tela.
    this.celularIcon = this.add.graphics().setDepth(41).setPosition(this.celularPos.x, this.celularPos.y);
    this.desenharCelular(this.celularIcon);

    // Se as mensagens já foram apagadas numa visita anterior, o aparelho nasce parado e sem notificação
    if (!this.celularUsado) {
      this.celularVibrarTween = this.tweens.add({
        targets: this.celularIcon,
        angle: { from: -5, to: 5 },
        duration: 90,
        yoyo: true,
        loop: -1
      });

      // Ponto vermelho de notificação, pulsando por cima do aparelho enquanto as mensagens não são apagadas
      this.celularNotificacao = this.add.graphics()
        .setDepth(42)
        .setPosition(this.celularPos.x + 5, this.celularPos.y - 9);
      this.celularNotificacao.fillStyle(0xff3333, 1);
      this.celularNotificacao.fillCircle(0, 0, 2);

      this.celularNotificacaoTween = this.tweens.add({
        targets: this.celularNotificacao,
        alpha: 0.25,
        duration: 450,
        yoyo: true,
        loop: -1
      });
    }

    this.celularArea = {
      x1: this.celularPos.x - 16, x2: this.celularPos.x + 16,
      y1: this.celularPos.y - 16, y2: this.celularPos.y + 16
    };
  }

  desenharCelular(graphics) {
    // corpo do aparelho
    graphics.fillStyle(0x1a1108, 1);
    graphics.fillRoundedRect(-7, -11, 14, 22, 3);
    graphics.lineStyle(1, 0xE3C18D, 1);
    graphics.strokeRoundedRect(-7, -11, 14, 22, 3);

    // tela
    graphics.fillStyle(0x2a3a38, 1);
    graphics.fillRoundedRect(-5, -8, 10, 14, 1);

    // linhas sugerindo mensagens de texto na tela
    graphics.fillStyle(0x9fb3ac, 0.9);
    graphics.fillRect(-3, -5, 6, 1.4);
    graphics.fillRect(-3, -1.5, 4, 1.4);
    graphics.fillRect(-3, 2, 5, 1.4);

    // botão home
    graphics.fillStyle(0xE3C18D, 0.5);
    graphics.fillCircle(0, 8, 1.2);
  }

  examinarCelularCedo() {
    const falas = [
      "Protagonista: O celular não para de vibrar. Mais mensagens dele, tentando me isolar de todo mundo.",
      "Nêmesis: As mentiras dele são altas porque a sua voz é mais forte do que ele quer admitir. Encontre suas verdades primeiro."
    ];
    this.startDialogue(falas, null);
  }

  usarCelular() {
    const falas = [
      "Protagonista: \"Louca\". \"Mentirosa\". \"Exagerada\". Ele repetiu tanto que eu quase acreditei.",
      "Nêmesis: A mentira dele não apaga a sua história. A sua voz tem força.",
      "Protagonista: Eu sei o que é real. Eu vivi o que é real."
    ];

    this.startDialogue(falas, () => {
      this.celularUsado = true;
      this.registry.set("celularUsado", true);
      this.acalmarCelular();
      this.quebrarPalavrasOfensivas();
    });
  }

  // Para o tremor e a notificação vermelha: as mensagens foram apagadas, o celular sossega
  acalmarCelular() {
    if (this.celularVibrarTween) {
      this.celularVibrarTween.stop();
      this.celularVibrarTween = null;
    }
    this.celularIcon.setAngle(0);

    if (this.celularNotificacaoTween) {
      this.celularNotificacaoTween.stop();
      this.celularNotificacaoTween = null;
    }
    if (this.celularNotificacao) {
      this.celularNotificacao.destroy();
      this.celularNotificacao = null;
    }
  }

  // =========================================================================
  // 💬 PALAVRAS OFENSIVAS: bloqueiam a porta da rua até o celular ser resolvido
  // =========================================================================

  criarPalavrasOfensivas() {
    const config = [
      { texto: "LOUCA", x: 40, y: 30, angulo: -7 },
      { texto: "MENTIROSA", x: 100, y: 30, angulo: 5 },
      { texto: "EXAGERADA", x: 72, y: 48, angulo: -4 }
    ];

    this.palavrasOfensivas = config.map((c, i) => {
      const texto = this.add.text(c.x, c.y, c.texto, {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#ff3333",
        stroke: "#2C1A11",
        strokeThickness: 3,
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5).setDepth(99).setAngle(c.angulo);

      this.tweens.add({
        targets: texto,
        y: c.y - 4,
        duration: 900 + i * 150,
        yoyo: true,
        loop: -1,
        ease: "Sine.easeInOut"
      });

      return texto;
    });
  }

  quebrarPalavrasOfensivas() {
    this.cameras.main.shake(300, 0.006);
    this.sound.play("som_swap", { volume: this.registry.get("sfxVolume") });

    this.palavrasOfensivas.forEach((texto, i) => {
      this.time.delayedCall(i * 150, () => {
        this.tweens.add({
          targets: texto,
          scaleX: 0,
          scaleY: 0,
          angle: 90,
          alpha: 0,
          duration: 500,
          ease: "Back.easeIn",
          onComplete: () => texto.destroy()
        });
      });
    });
  }

  // =========================================================================
  // 🚪 PORTAS
  // =========================================================================

  iniciarPortaRuaBloqueada() {
    const falas = [
      "Protagonista: Não consigo nem enxergar a maçaneta. As palavras dele estão em todo lugar.",
      "Nêmesis: Apague as mentiras. Elas não são mais fortes do que a verdade que você carrega."
    ];

    this.startDialogue(falas, null);
  }

  iniciarTransicaoSaida() {
    const falas = [
      "Protagonista: Vou voltar até o quarto por um instante."
    ];

    this.startDialogue(falas, () => {
      this.sound.play("som_porta", { volume: this.registry.get("sfxVolume") });

      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("QuartoCasal");
      });
    });
  }

  iniciarFinalDoJogo() {
    const falas = [
      "Protagonista: A porta está livre. Nada mais me prende aqui.",
      "Nêmesis: A mentira dele não apaga a sua história. A sua voz tem força. A porta está aberta."
    ];

    this.startDialogue(falas, () => {
      this.sound.play("som_porta", { volume: this.registry.get("sfxVolume") });
      this.registry.set("resultadoFinal", "sucesso");

      this.cameras.main.flash(1800, 255, 255, 255);
      this.time.delayedCall(1800, () => {
        this.scene.start("GameOver");
      });
    });
  }

  // =========================================================================
  // 🎬 SISTEMA DE DIÁLOGO (idêntico ao usado nos outros cômodos)
  // =========================================================================

  startDialogue(lines, callback) {
    this.isDialogueActive = true;
    this.dialogueLines = lines;
    this.dialogueIndex = 0;
    this.dialogueCallback = callback;

    this.player.setVelocity(0);

    this.desenharCaixaDeDialogoProfissional();
    this.desenharAvatarProfissional("NÊM", 0x18453B, 0xE3C18D);

    this.dialogueText = this.add.text(64, 162, "", {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#ffffff",
      wordWrap: { width: 235 },
      fontFamily: "m5x7",
      resolution: 4
    }).setScrollFactor(0).setDepth(101);

    this.dialogueNextLabel = this.add.text(295, 220, "[E] Próximo", {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D",
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(102);

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
      this.sound.play("som_swap", { volume: this.registry.get("sfxVolume") });

      const line = this.dialogueLines[this.dialogueIndex];

      if (line.startsWith("Nêmesis:")) {
        this.dialogueText.setColor("#E3C18D");
        this.desenharAvatarProfissional("NÊM", 0x18453B, 0xE3C18D);
        this.dialogueText.setText(line.substring(9));
      } else {
        this.dialogueText.setColor("#ffffff");
        this.desenharAvatarProfissional("PROT", 0x476861, 0xffffff);
        this.dialogueText.setText(line.substring(14));
      }

      this.dialogueIndex++;
    } else {
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

  desenharCaixaDeDialogoProfissional() {
    this.dialogueBox = this.add.graphics();

    this.dialogueBox.fillStyle(0x2C1A11, 0.9);
    this.dialogueBox.fillRect(10, 155, 300, 75);

    this.dialogueBox.lineStyle(1.5, 0xE3C18D, 1);
    this.dialogueBox.strokeRect(10, 155, 300, 75);

    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setDepth(100);
  }

  desenharAvatarProfissional(nome, corFundo, corBorda) {
    if (this.avatarBox && this.avatarBox.destroy) this.avatarBox.destroy();
    if (this.avatarLabel && this.avatarLabel.destroy) this.avatarLabel.destroy();
    if (this.avatarImage && this.avatarImage.destroy) this.avatarImage.destroy();
    if (this.avatarMaskShape && this.avatarMaskShape.destroy) this.avatarMaskShape.destroy();

    this.avatarLabel = null;
    this.avatarImage = null;
    this.avatarMaskShape = null;

    this.avatarBox = this.add.graphics();

    this.avatarBox.fillStyle(corFundo, 1);
    this.avatarBox.fillRect(15, 162, 41, 41);

    this.avatarBox.lineStyle(1.5, corBorda, 1);
    this.avatarBox.strokeRect(15, 162, 41, 41);

    this.avatarBox.setScrollFactor(0);
    this.avatarBox.setDepth(101);

    this.avatarMaskShape = this.add.graphics();
    this.avatarMaskShape.fillStyle(0xffffff);
    this.avatarMaskShape.fillRect(15, 162, 41, 41);
    this.avatarMaskShape.setScrollFactor(0);
    this.avatarMaskShape.setVisible(false);

    const mask = this.avatarMaskShape.createGeometryMask();

    if (nome === "PROT") {
      this.avatarImage = this.add.image(35.5, 198, "player", 0);
      this.avatarImage.setScrollFactor(0).setDepth(102);
      this.avatarImage.setScale(3.5);
      this.avatarImage.setMask(mask);
    } else if (nome === "NÊM") {
      this.avatarImage = this.add.image(35.5, 182.5, "nemesis_avatar");
      this.avatarImage.setScrollFactor(0).setDepth(102);
      this.avatarImage.setScale(41 / 2048);
      this.avatarImage.setMask(mask);
    } else {
      this.avatarLabel = this.add.text(35, 182, nome, {
        fontSize: "16px",
        fontStyle: "normal",
        color: corBorda,
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(102);
    }
  }

  // =========================================================================
  // ⏸️ TELA DE PAUSA (idêntica à usada nos outros cômodos)
  // =========================================================================

  togglePause() {
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.player.setVelocity(0);

      this.pauseElements = [];
      this.pauseDragging = null;

      const box = this.add.graphics().setScrollFactor(0).setDepth(200);
      box.fillStyle(0x2C1A11, 0.95);
      box.lineStyle(1.5, 0xE3C18D, 1);
      box.fillRect(16, 14, 288, 212);
      box.strokeRect(16, 14, 288, 212);
      this.pauseElements.push(box);

      const titulo = this.add.text(160, 40, "JOGO PAUSADO", {
        fontSize: "32px",
        fontStyle: "normal",
        color: "#E3C18D",
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
      this.pauseElements.push(titulo);

      this.criarSliderPausa("Música", 64, 80, this.registry.get("musicVolume"), (valor) => {
        this.registry.set("musicVolume", valor);
        const musica = this.sound.get("musica_fundo");
        if (musica) musica.setVolume(valor);
      });

      this.criarSliderPausa("Som do Jogo", 98, 114, this.registry.get("sfxVolume"), (valor) => {
        this.registry.set("sfxVolume", valor);
        if (this.player && this.player.walkSound) this.player.walkSound.setVolume(valor);
      });

      this.criarBotaoPausa("Continuar", 142, () => {
        this.togglePause();
      });

      this.criarBotaoPausa("Reiniciar", 170, () => {
        resetarTodoProgresso(this.registry);
        this.isPaused = false;
        this.scene.start("Sala");
      });

      this.criarBotaoPausa("Menu Inicial", 198, () => {
        this.isPaused = false;
        this.scene.start("MainMenu");
      });

      this.pausePointerMoveHandler = (pointer) => {
        if (this.pauseDragging) this.pauseDragging.updateFromPointer(pointer);
      };
      this.pausePointerUpHandler = () => {
        this.pauseDragging = null;
      };
      this.input.on("pointermove", this.pausePointerMoveHandler);
      this.input.on("pointerup", this.pausePointerUpHandler);
    } else {
      if (this.pausePointerMoveHandler) {
        this.input.off("pointermove", this.pausePointerMoveHandler);
        this.pausePointerMoveHandler = null;
      }
      if (this.pausePointerUpHandler) {
        this.input.off("pointerup", this.pausePointerUpHandler);
        this.pausePointerUpHandler = null;
      }
      this.pauseDragging = null;

      if (this.pauseElements) {
        this.pauseElements.forEach((el) => {
          if (el && el.destroy) el.destroy();
        });
      }
      this.pauseElements = [];
    }
  }

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
      this.sound.play("som_click", { volume: this.registry.get("sfxVolume") });
      this.desenharBotaoQuiz(graphics, x, y, width, height, false, true);
      label.setColor("#ffffff");
      this.time.delayedCall(100, onClick);
    });

    this.pauseElements.push(graphics, label);
  }

  desenharBotaoQuiz(graphics, x, y, width, height, hover, active) {
    graphics.clear();

    if (active) {
      graphics.fillStyle(0x476861, 0.95);
      graphics.lineStyle(1.5, 0xffffff, 1);
    } else if (hover) {
      graphics.fillStyle(0x18453B, 0.95);
      graphics.lineStyle(1.5, 0xE3C18D, 1);
    } else {
      graphics.fillStyle(0x2C1A11, 0.95);
      graphics.lineStyle(1.5, 0xE3C18D, 0.6);
    }

    graphics.fillRect(x - width / 2, y - height / 2, width, height);
    graphics.strokeRect(x - width / 2, y - height / 2, width, height);
  }
}
