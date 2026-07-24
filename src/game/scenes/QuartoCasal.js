import { Scene } from "phaser";
import Player from "../../player.js";
import TensaoTimer from "../systems/TensaoTimer.js";
import { resetarTodoProgresso } from "../systems/Progresso.js";

export class QuartoCasal extends Scene {
  constructor() {
    super("QuartoCasal");
  }

  create() {
    // 1. Criar o objeto do Mapa (JSON do Tiled)
    const map = this.make.tilemap({ key: "mapa-quarto-casal" });

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
    this.portaProximoNivelLayer = map.createLayer("Porta_proximo_nivel", todosTilesets, offsetX, 0);

    // 4. Configurar Profundidade Visual
    chaoLayer.setDepth(10);
    this.paredeLayer.setDepth(20);
    this.limiteLayer.setDepth(30);
    intransponivelLayer.setDepth(40);
    transponivelLayer.setDepth(50);
    intransponivel2Layer.setDepth(60);
    this.interativoLayer.setDepth(80);

    // Instanciação da Protagonista (spawna perto da porta de entrada, vinda do Escritório)
    this.player = new Player(this, 120, 160);
    this.player.setDepth(95);

    // A porta de baixo fica ACIMA da protagonista (ilusão de passar por trás do batente, só os pés
    // cruzam a soleira). A porta pro próximo nível fica dentro de uma faixa de parede sólida — a
    // protagonista precisa chegar bem perto pra interagir, então essa porta fica ABAIXO dela (evita
    // cobrir o corpo inteiro, mesmo problema já corrigido na porta equivalente do Escritório).
    this.portaLayer.setDepth(100);
    this.portaProximoNivelLayer.setDepth(90);

    // 5. Configurar Colisões Físicas (a Porta é apenas visual/transponível, igual no Escritório)
    this.paredeLayer.setCollisionByExclusion([-1]);
    this.limiteLayer.setCollisionByExclusion([-1]);
    intransponivelLayer.setCollisionByExclusion([-1]);
    intransponivel2Layer.setCollisionByExclusion([-1]);

    this.physics.add.collider(this.player, this.paredeLayer);
    this.physics.add.collider(this.player, this.limiteLayer);
    this.physics.add.collider(this.player, intransponivelLayer);
    this.physics.add.collider(this.player, intransponivel2Layer);

    // Cama de casal: imagem avulsa (fora do grid de tiles), encostada na parede de cima e na parede
    // do canto direito (canto superior direito do quarto), reduzida para caber proporcionalmente.
    const camaX = 238;
    const camaY = 96;
    this.add.image(camaX, camaY, "cama_casal").setScale(52 / 450).setDepth(40);

    // Colisão física da cama (retângulo invisível um pouco menor que a imagem)
    const camaZone = this.add.zone(camaX, camaY, 48, 60);
    this.physics.add.existing(camaZone, true);
    this.physics.add.collider(this.player, camaZone);

    // Zona de interação (mais generosa que a colisão, para funcionar mesmo logo após o empurrão físico)
    this.camaInteracaoArea = { x1: camaX - 55, x2: camaX + 55, y1: camaY - 65, y2: camaY + 65 };

    // Estado de progresso da Fase 4 — lido do registro global pra não se perder ao voltar de outro
    // cômodo e essa cena ser recriada do zero.
    this.camaExaminada = this.registry.get("camaExaminada") || false;
    this.temPilulas = this.registry.get("temPilulas") || false;
    this.temTranca = this.registry.get("temTranca") || false;
    this.portaTravada = this.registry.get("portaTravada") || false;

    // Área de sombra ao redor da cama (efeito visual + gatilho da lentidão) — some permanentemente
    // assim que a porta é trancada por dentro, então só é recriada se isso ainda não aconteceu.
    if (!this.portaTravada) {
      this.sombraCama = this.add.graphics().setDepth(15);
      this.sombraCama.fillStyle(0x000000, 0.35);
      this.sombraCama.fillEllipse(camaX, camaY, 94, 122);
      this.sombraArea = { x1: camaX - 47, x2: camaX + 47, y1: camaY - 61, y2: camaY + 61 };
    } else {
      this.sombraCama = null;
      this.sombraArea = null;
    }

    // Solução da Fase 4: a cartela de pílulas (escondida perto da estante) e a tranca solta (perto da
    // porta) precisam ser coletadas; usar a tranca na porta por dentro faz a sombra da cama desaparecer.
    this.pilulasPos = { x: 64, y: 186 };
    this.pilulasArea = {
      x1: this.pilulasPos.x - 14, x2: this.pilulasPos.x + 14,
      y1: this.pilulasPos.y - 14, y2: this.pilulasPos.y + 14
    };
    if (!this.temPilulas) {
      this.pilulasIcon = this.add.image(this.pilulasPos.x, this.pilulasPos.y, "cartela_pilulas")
        .setScale(0.25)
        .setDepth(41);
    }

    this.trancaPos = { x: 110, y: 195 };
    this.trancaArea = {
      x1: this.trancaPos.x - 14, x2: this.trancaPos.x + 14,
      y1: this.trancaPos.y - 14, y2: this.trancaPos.y + 14
    };
    if (!this.temTranca) {
      this.trancaIcon = this.add.image(this.trancaPos.x, this.trancaPos.y, "tranca_solta")
        .setScale(0.25)
        .setDepth(41);
    }

    // 6. Ajustar Limites do Mundo Físico e da Câmera (tela inteira, já que o cômodo cabe nela)
    this.physics.world.setBounds(0, 0, 320, 240);
    this.cameras.main.setBounds(0, 0, 320, 240);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 7. Configurações de Estado de Interação da Fase 4 (Sexual)
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

    // Área de sombra ao redor da cama: reduz a velocidade enquanto combina com o multiplicador de tensão
    // (some quando a porta é trancada pelo lado de dentro, ver trancarPorta())
    const dentroDaSombra = this.sombraArea && this.player.x > this.sombraArea.x1 && this.player.x < this.sombraArea.x2 &&
      this.player.y > this.sombraArea.y1 && this.player.y < this.sombraArea.y2;
    const multiplicadorTensao = (this.tensao && this.tensao.estagioAtual === 4) ? 0.85 : 1;
    this.speedMultiplier = dentroDaSombra ? multiplicadorTensao * 0.4 : multiplicadorTensao;

    this.player.update();

    let pertoDeInteracao = false;

    // Cama de casal: examinar/refletir sobre o cômodo
    if (this.player.x > this.camaInteracaoArea.x1 && this.player.x < this.camaInteracaoArea.x2 &&
      this.player.y > this.camaInteracaoArea.y1 && this.player.y < this.camaInteracaoArea.y2) {
      pertoDeInteracao = true;
      this.promptText.setText("[E] Examinar a Cama")
        .setPosition(238, 56)
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.promptText.setVisible(false);
        this.iniciarExameCama();
      }
    }

    // Cartela de pílulas: escondida perto da estante
    if (!this.temPilulas && this.player.x > this.pilulasArea.x1 && this.player.x < this.pilulasArea.x2 &&
      this.player.y > this.pilulasArea.y1 && this.player.y < this.pilulasArea.y2) {
      pertoDeInteracao = true;
      this.promptText.setText("[E] Pegar a Cartela de Pílulas")
        .setPosition(this.pilulasPos.x, this.pilulasPos.y - 18)
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.promptText.setVisible(false);
        this.coletarPilulas();
      }
    }

    // Tranca de porta solta: caída perto da entrada
    if (!this.temTranca && this.player.x > this.trancaArea.x1 && this.player.x < this.trancaArea.x2 &&
      this.player.y > this.trancaArea.y1 && this.player.y < this.trancaArea.y2) {
      pertoDeInteracao = true;
      this.promptText.setText("[E] Pegar a Tranca Solta")
        .setPosition(this.trancaPos.x, this.trancaPos.y - 18)
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.promptText.setVisible(false);
        this.coletarTranca();
      }
    }

    // Porta transponível: trancar (uma vez, com os dois itens em mãos) ou voltar ao Escritório
    if (this.player.x > 144 && this.player.x < 192 && this.player.y > 146 && this.player.y < 180) {
      pertoDeInteracao = true;

      if (this.temPilulas && this.temTranca && !this.portaTravada) {
        this.promptText.setText("[E] Trancar a Porta por Dentro")
          .setPosition(168, 164)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.trancarPorta();
        }
      } else {
        this.promptText.setText("[E] Voltar para o Escritório")
          .setPosition(168, 164)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.iniciarTransicaoSaida();
        }
      }
    }

    // Porta para a próxima fase (colunas 4-5, linhas 1-3): só libera depois de trancar a porta de entrada
    if (this.player.x > 98 && this.player.x < 142 && this.player.y > 56 && this.player.y < 92) {
      pertoDeInteracao = true;

      if (!this.portaTravada) {
        this.promptText.setText("[E] Porta Trancada")
          .setPosition(120, 20)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.iniciarPortaProximoNivelTrancada();
        }
      } else {
        this.promptText.setText("[E] Continuar em Frente")
          .setPosition(120, 20)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.iniciarTransicaoProximoNivel();
        }
      }
    }

    if (!pertoDeInteracao) {
      this.promptText.setVisible(false);
    }
  }

  iniciarExameCama() {
    const falas = this.camaExaminada
      ? ["Protagonista: Essa sombra sobre a cama não sai da minha cabeça."]
      : [
        "Protagonista: Ele nunca perguntava. Simplesmente decidia por mim.",
        "Nêmesis: Seu corpo é seu. Consentimento não é algo que se presume, é algo que se pede."
      ];

    this.camaExaminada = true;
    this.registry.set("camaExaminada", true);
    this.startDialogue(falas, null);
  }

  coletarPilulas() {
    this.temPilulas = true;
    this.registry.set("temPilulas", true);
    if (this.pilulasIcon) {
      this.pilulasIcon.destroy();
      this.pilulasIcon = null;
    }
    this.sound.play("som_click", { volume: this.registry.get("sfxVolume") });

    const falas = [
      "Protagonista: Uma cartela de pílulas... escondida, como se fosse vergonha minha guardar isso comigo."
    ];
    this.startDialogue(falas, null);
  }

  coletarTranca() {
    this.temTranca = true;
    this.registry.set("temTranca", true);
    if (this.trancaIcon) {
      this.trancaIcon.destroy();
      this.trancaIcon = null;
    }
    this.sound.play("som_click", { volume: this.registry.get("sfxVolume") });

    const falas = [
      "Protagonista: Uma tranca solta. Talvez eu ainda possa decidir quem entra aqui."
    ];
    this.startDialogue(falas, null);
  }

  trancarPorta() {
    const falas = [
      "Protagonista: Ninguém entra aqui sem que eu permita.",
      "Nêmesis: Seu corpo é o seu primeiro e mais sagrado território. O consentimento é a única regra."
    ];

    this.startDialogue(falas, () => {
      this.portaTravada = true;
      this.registry.set("portaTravada", true);
      this.sound.play("som_click", { volume: this.registry.get("sfxVolume") });

      if (this.sombraCama) {
        this.sombraCama.destroy();
        this.sombraCama = null;
      }
      this.sombraArea = null;
    });
  }

  iniciarTransicaoSaida() {
    const falas = [
      "Protagonista: Vou voltar até o escritório por um instante."
    ];

    this.startDialogue(falas, () => {
      this.sound.play("som_porta", { volume: this.registry.get("sfxVolume") });

      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("Escritorio");
      });
    });
  }

  iniciarPortaProximoNivelTrancada() {
    const falas = [
      "Protagonista: Essa porta não abre. Acho que ainda preciso me sentir segura aqui antes.",
      "Nêmesis: Tranque a porta por dentro. Só então siga em frente."
    ];

    this.startDialogue(falas, null);
  }

  iniciarTransicaoProximoNivel() {
    const falas = [
      "Protagonista: Agora eu decido quem entra. Posso seguir em frente.",
      "Nêmesis: Cada porta que você abre é um passo a mais fora do ciclo."
    ];

    this.startDialogue(falas, () => {
      this.sound.play("som_porta", { volume: this.registry.get("sfxVolume") });

      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("SalaDeEstar");
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
