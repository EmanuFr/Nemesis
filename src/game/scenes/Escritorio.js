import { Scene } from "phaser";
import Player from "../../player.js";
import TensaoTimer from "../systems/TensaoTimer.js";
import { resetarTodoProgresso } from "../systems/Progresso.js";

export class Escritorio extends Scene {
  constructor() {
    super("Escritorio");
  }

  create() {
    // 1. Criar o objeto do Mapa (JSON do Tiled)
    const map = this.make.tilemap({ key: "mapa-escritorio" });

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

    // 3. Criar as Camadas na ordem correta de visualização (Suporta a ordem de sobreposição do Tiled!)
    const chaoLayer = map.createLayer("Chao", todosTilesets, offsetX, 0);
    this.paredeLayer = map.createLayer("Parede", todosTilesets, offsetX, 0);
    this.limiteLayer = map.createLayer("Limite do mapa", todosTilesets, offsetX, 0);
    const cadeirasBaixoLayer = map.createLayer("Cadeiras_baixo", todosTilesets, offsetX, 0);
    const intransponivelLayer = map.createLayer("Intransponivel", todosTilesets, offsetX, 0);
    const cadeirasCimaLayer = map.createLayer("Cadeiras_cima", todosTilesets, offsetX, 0);
    const transponivelLayer = map.createLayer("Transponivel", todosTilesets, offsetX, 0);
    this.gavetaLayer = map.createLayer("Gaveta", todosTilesets, offsetX, 0);
    const intransponivel2Layer = map.createLayer("Intransponivel 2", todosTilesets, offsetX, 0);
    this.portaLayer = map.createLayer("Porta", todosTilesets, offsetX, 0);
    this.interativoLayer = map.createLayer("Interativo", todosTilesets, offsetX, 0);
    this.portaProximoNivelLayer = map.createLayer("Porta_proximo_nivel", todosTilesets, offsetX, 0);

    // 4. Configurar Profundidade Visual (Z-Index correspondendo exatamente ao Tiled!)
    chaoLayer.setDepth(10);
    this.paredeLayer.setDepth(20);
    this.limiteLayer.setDepth(30);
    // As cadeiras usam duas camadas pra dar profundidade: a parte de trás (encostada na mesa) fica
    // atrás da mesa, e a parte da frente (assento) fica na frente — mesma ordem usada no Tiled.
    cadeirasBaixoLayer.setDepth(35);
    intransponivelLayer.setDepth(40);
    cadeirasCimaLayer.setDepth(45);
    transponivelLayer.setDepth(50);
    this.gavetaLayer.setDepth(60);
    intransponivel2Layer.setDepth(65);
    this.interativoLayer.setDepth(80);

    // Instanciação da Protagonista (nasce na frente da porta de entrada, colunas 7-8/linha 9 — área
    // livre de móveis; o spawn antigo em col3/linha11 ficou preso dentro da mobília nova)
    this.player = new Player(this, 168, 150);
    this.player.setDepth(95);

    // A porta de baixo fica ACIMA da protagonista de propósito: dá a ilusão de ela passar por trás do
    // batente (ali só os pés cruzam a soleira). A porta pro próximo nível fica dentro de uma faixa de
    // parede sólida — a protagonista precisa chegar bem perto (quase o corpo todo) pra interagir, então
    // manter essa porta acima dela cobriria o personagem inteiro. Por isso ela fica ABAIXO da protagonista.
    this.portaLayer.setDepth(100);
    this.portaProximoNivelLayer.setDepth(90);

    // 5. Configurar Colisões Físicas (a Porta é apenas visual/transponível nesta fase)
    this.paredeLayer.setCollisionByExclusion([-1]);
    this.limiteLayer.setCollisionByExclusion([-1]);
    cadeirasBaixoLayer.setCollisionByExclusion([-1]);
    intransponivelLayer.setCollisionByExclusion([-1]);
    cadeirasCimaLayer.setCollisionByExclusion([-1]);
    intransponivel2Layer.setCollisionByExclusion([-1]);
    this.gavetaLayer.setCollisionByExclusion([-1]);

    this.physics.add.collider(this.player, this.paredeLayer);
    this.physics.add.collider(this.player, this.limiteLayer);
    this.physics.add.collider(this.player, cadeirasBaixoLayer);
    this.physics.add.collider(this.player, intransponivelLayer);
    this.physics.add.collider(this.player, cadeirasCimaLayer);
    this.physics.add.collider(this.player, intransponivel2Layer);
    this.gavetaCollider = this.physics.add.collider(this.player, this.gavetaLayer);

    // Se a gaveta já foi destrancada em uma visita anterior, reaplica o visual "aberto" e libera a
    // colisão imediatamente (a camada é recriada do zero a cada vez que a cena é montada)
    if (this.gavetaAberta) {
      this.aplicarVisualGavetaAberta();
    }

    // 6. Ajustar Limites do Mundo Físico e da Câmera (tela inteira, já que o cômodo cabe nela)
    this.physics.world.setBounds(0, 0, 320, 240);
    this.cameras.main.setBounds(0, 0, 320, 240);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // 7. Configurações de Estado de Interação da Fase 3 (Patrimonial) — lidas do registro global pra que
    // o progresso não se perca ao voltar de outro cômodo e essa cena ser recriada do zero.
    this.papelMontado = this.registry.get("papelMontado") || false;
    this.gavetaAberta = this.registry.get("gavetaAberta") || false;
    this.isDialogueActive = false;
    this.isPuzzleActive = false;
    this.aguardandoFecharCarta = false;
    this.isPaused = false;

    // Fragmentos da carta rasgada (montados na ordem certa, formam a carta legível)
    this.fragmentosCarta = [
      "Eu cuido de tudo por aqui: as contas, os documentos, o dinheiro.",
      "Você não entende dessas coisas, é melhor deixar tudo comigo.",
      "A senha da gaveta é 1807. Não precisa se preocupar com nada."
    ];
    // Trechos curtos visíveis nos pedaços de papel arrastáveis (o texto completo só aparece depois de montada)
    this.previaCarta = [
      "Eu cuido de tudo...",
      "Você não entende...",
      "A senha da gaveta..."
    ];
    this.senhaGaveta = "1807";

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

    if (this.isPuzzleActive) {
      this.player.setVelocity(0);
      this.player.stopWalkSound();

      if (this.aguardandoFecharCarta && Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.fecharCarta();
      }
      return;
    }

    this.player.update();

    let pertoDeInteracao = false;

    // Carta rasgada sobre a mesa (mesa em cols5-10 -> jogador se aproxima por baixo)
    if (!this.papelMontado) {
      if (this.player.x > 112 && this.player.x < 224 && this.player.y > 124 && this.player.y < 160) {
        pertoDeInteracao = true;
        this.promptText.setText("[E] Examinar os Papéis")
          .setPosition(168, 116)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.iniciarQuizPapel();
        }
      }
    }

    // Gaveta trancada do arquivo (jogador se aproxima por baixo)
    if (this.player.x > 220 && this.player.x < 268 && this.player.y > 70 && this.player.y < 106) {
      pertoDeInteracao = true;

      if (!this.papelMontado) {
        this.promptText.setText("[E] Gaveta Trancada")
          .setPosition(248, 68)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.iniciarGavetaTrancada();
        }
      } else if (!this.gavetaAberta) {
        this.promptText.setText("[E] Digitar Senha")
          .setPosition(248, 68)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.iniciarKeypadGaveta();
        }
      }
    }

    // Porta transponível: sempre disponível para voltar à Sala anterior (colunas 7-8, linhas 10-12 —
    // subiu 1 linha em relação à posição original no Tiled). A zona começa logo abaixo da zona da
    // carta (que vai até y=160) pra não se sobrepor a ela — os dois checks são independentes e um "E"
    // dentro da área de sobreposição acabava abrindo o quebra-cabeça da carta em vez de voltar.
    if (this.player.x > 144 && this.player.x < 192 && this.player.y > 164 && this.player.y < 200) {
      pertoDeInteracao = true;
      this.promptText.setText("[E] Voltar para o Quarto")
        .setPosition(168, 182)
        .setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
        this.promptText.setVisible(false);
        this.iniciarTransicaoSaida();
      }
    }

    // Porta para a próxima fase (colunas 1-2, linhas 1-3): a parede ali continua sólida (igual antes),
    // então a zona de interação fica só do lado de dentro, encostada no batente — igual à porta de baixo.
    if (this.player.x > 50 && this.player.x < 94 && this.player.y > 56 && this.player.y < 92) {
      pertoDeInteracao = true;

      if (!this.gavetaAberta) {
        this.promptText.setText("[E] Porta Trancada")
          .setPosition(72, 20)
          .setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
          this.promptText.setVisible(false);
          this.iniciarPortaProximoNivelTrancada();
        }
      } else {
        this.promptText.setText("[E] Continuar em Frente")
          .setPosition(72, 20)
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

  // =========================================================================
  // 📄 MINIGAME: Reconstruir a carta rasgada (arrastar e soltar) e lê-la
  // =========================================================================

  iniciarQuizPapel() {
    const falasIntro = [
      "Protagonista: Uma carta... ele rasgou tudo antes de sair.",
      "Nêmesis: Ele tentou apagar as palavras dele, mas os pedaços ainda podem ser unidos.",
      "Nêmesis: Junte os fragmentos para ler o que ele realmente disse."
    ];

    this.startDialogue(falasIntro, () => {
      this.iniciarPuzzlePapel();
    });
  }

  iniciarPuzzlePapel() {
    this.isPuzzleActive = true;
    this.puzzleElements = [];
    this.puzzlePecasCorretas = 0;

    const bg = this.add.graphics().setScrollFactor(0).setDepth(200);
    bg.fillStyle(0x2C1A11, 0.97);
    bg.lineStyle(1.5, 0xE3C18D, 1);
    bg.fillRect(10, 8, 300, 224);
    bg.strokeRect(10, 8, 300, 224);
    this.puzzleElements.push(bg);

    const titulo = this.add.text(160, 16, "Monte a Carta na Ordem Certa", {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D",
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    this.puzzleElements.push(titulo);

    // Slots-alvo lado a lado (3 colunas), numerados e ligados por setas para deixar a sequência óbvia
    const slotsPos = [{ x: 75, y: 78 }, { x: 160, y: 78 }, { x: 245, y: 78 }];
    this.puzzleSlots = [];
    slotsPos.forEach((pos, i) => {
      const numero = this.add.text(pos.x, pos.y - 38, `${i + 1}º`, {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#E3C18D",
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
      this.puzzleElements.push(numero);

      const slotGfx = this.add.graphics().setScrollFactor(0).setDepth(201);
      slotGfx.lineStyle(1.5, 0xE3C18D, 0.6);
      slotGfx.strokeRect(pos.x - 44, pos.y - 22, 88, 44);
      this.puzzleElements.push(slotGfx);
      this.puzzleSlots.push({ x: pos.x, y: pos.y, ocupado: false, indiceCorreto: i });

      if (i > 0) {
        const setaAnterior = slotsPos[i - 1];
        const seta = this.add.text((setaAnterior.x + pos.x) / 2, pos.y, "→", {
          fontSize: "16px",
          fontStyle: "normal",
          color: "#E3C18D",
          fontFamily: "m5x7",
          resolution: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        this.puzzleElements.push(seta);
      }
    });

    const dica = this.add.text(160, 118, "Leia cada trecho e arraste até o número certo", {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D",
      wordWrap: { width: 260 },
      align: "center",
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    this.puzzleElements.push(dica);

    // Pedaços de papel rasgado, cada um já mostrando um trecho da carta (embaralhados entre as 3 colunas)
    const posicoesEmbaralhadas = Phaser.Utils.Array.Shuffle([
      { x: 75, y: 190 },
      { x: 160, y: 195 },
      { x: 245, y: 190 }
    ]);

    this.puzzlePecas = [];
    this.previaCarta.forEach((previa, i) => {
      const pos = posicoesEmbaralhadas[i];
      const peca = this.add.text(pos.x, pos.y, previa, {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#2C1A11",
        backgroundColor: "#E3C18D",
        wordWrap: { width: 82 },
        align: "center",
        padding: { x: 6, y: 4 },
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(202).setInteractive({ draggable: true, useHandCursor: true });

      peca.indiceCorreto = i;
      peca.posOriginal = { x: pos.x, y: pos.y };
      this.puzzleElements.push(peca);
      this.puzzlePecas.push(peca);
    });

    this.puzzleDragHandler = (pointer, gameObject, dragX, dragY) => {
      if (this.puzzlePecas.includes(gameObject)) {
        gameObject.x = dragX;
        gameObject.y = dragY;
      }
    };

    this.puzzleDragEndHandler = (pointer, gameObject) => {
      if (!this.puzzlePecas.includes(gameObject)) return;

      const slotProximo = this.puzzleSlots.find((slot) =>
        !slot.ocupado && Phaser.Math.Distance.Between(gameObject.x, gameObject.y, slot.x, slot.y) < 26
      );

      if (slotProximo && slotProximo.indiceCorreto === gameObject.indiceCorreto) {
        gameObject.x = slotProximo.x;
        gameObject.y = slotProximo.y;
        gameObject.disableInteractive();
        slotProximo.ocupado = true;
        this.puzzlePecasCorretas++;

        if (this.puzzlePecasCorretas === this.puzzlePecas.length) {
          this.time.delayedCall(500, () => this.concluirPuzzlePapel());
        }
      } else {
        gameObject.x = gameObject.posOriginal.x;
        gameObject.y = gameObject.posOriginal.y;
      }
    };

    this.input.on("drag", this.puzzleDragHandler);
    this.input.on("dragend", this.puzzleDragEndHandler);
  }

  concluirPuzzlePapel() {
    this.limparPuzzlePapel();
    this.mostrarCartaCompleta();
  }

  limparPuzzlePapel() {
    if (this.puzzleDragHandler) this.input.off("drag", this.puzzleDragHandler);
    if (this.puzzleDragEndHandler) this.input.off("dragend", this.puzzleDragEndHandler);
    this.puzzleDragHandler = null;
    this.puzzleDragEndHandler = null;

    if (this.puzzleElements) {
      this.puzzleElements.forEach((el) => {
        if (el && el.destroy) el.destroy();
      });
    }
    this.puzzleElements = [];
    this.puzzlePecas = [];
    this.puzzleSlots = [];
  }

  // Mostra a carta já remontada, pronta para ser lida
  mostrarCartaCompleta() {
    this.isPuzzleActive = true;
    this.aguardandoFecharCarta = true;
    this.cartaElements = [];

    const bg = this.add.graphics().setScrollFactor(0).setDepth(200);
    bg.fillStyle(0x2C1A11, 0.97);
    bg.lineStyle(1.5, 0xE3C18D, 1);
    bg.fillRect(20, 20, 280, 190);
    bg.strokeRect(20, 20, 280, 190);
    this.cartaElements.push(bg);

    const texto = this.add.text(160, 36, this.fragmentosCarta.join("\n\n"), {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D",
      wordWrap: { width: 250 },
      align: "center",
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(201);
    this.cartaElements.push(texto);

    const fechar = this.add.text(295, 200, "[E] Fechar", {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D",
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(201);
    this.cartaElements.push(fechar);
  }

  fecharCarta() {
    if (this.cartaElements) {
      this.cartaElements.forEach((el) => {
        if (el && el.destroy) el.destroy();
      });
    }
    this.cartaElements = [];
    this.aguardandoFecharCarta = false;
    this.isPuzzleActive = false;
    this.papelMontado = true;
    this.registry.set("papelMontado", true);

    const falasSucesso = [
      "Protagonista: Ele tentou me fazer acreditar que eu não sabia cuidar de nada...",
      "Nêmesis: O controle financeiro não é cuidado. O que é seu, é seu direito e sua liberdade.",
      "Nêmesis: E agora você tem a senha da gaveta: 1807."
    ];

    this.startDialogue(falasSucesso, null);
  }

  // =========================================================================
  // 🗄️ INTERAÇÕES: Gaveta trancada (teclado numérico) e Porta de saída
  // =========================================================================

  iniciarGavetaTrancada() {
    const falas = [
      "Protagonista: A gaveta do arquivo está trancada com uma senha numérica.",
      "Nêmesis: Ele guardou seus documentos como se fossem posse dele.",
      "Nêmesis: Reconstrua a carta que ele rasgou. A senha está escondida nela."
    ];

    this.startDialogue(falas, null);
  }

  iniciarKeypadGaveta() {
    this.isPuzzleActive = true;
    this.keypadElements = [];
    this.senhaDigitada = "";

    const bg = this.add.graphics().setScrollFactor(0).setDepth(200);
    bg.fillStyle(0x2C1A11, 0.97);
    bg.lineStyle(1.5, 0xE3C18D, 1);
    bg.fillRect(95, 26, 130, 190);
    bg.strokeRect(95, 26, 130, 190);
    this.keypadElements.push(bg);

    const titulo = this.add.text(160, 38, "Senha da Gaveta", {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D",
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    this.keypadElements.push(titulo);

    this.keypadDisplay = this.add.text(160, 60, "_ _ _ _", {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D",
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    this.keypadElements.push(this.keypadDisplay);

    const teclas = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"];
    const startX = 118;
    const startY = 86;
    const stepX = 32;
    const stepY = 30;

    teclas.forEach((tecla, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = startX + col * stepX;
      const y = startY + row * stepY;

      const botao = this.add.text(x, y, tecla, {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#E3C18D",
        backgroundColor: "#00000055",
        padding: { x: 8, y: 6 },
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201).setInteractive({ useHandCursor: true });

      botao.on("pointerdown", () => this.teclaKeypadPressionada(tecla));
      this.keypadElements.push(botao);
    });
  }

  teclaKeypadPressionada(tecla) {
    if (tecla === "C") {
      this.senhaDigitada = "";
    } else if (tecla === "OK") {
      this.confirmarSenhaGaveta();
      return;
    } else if (this.senhaDigitada.length < 4) {
      this.senhaDigitada += tecla;
    }

    const digitos = this.senhaDigitada.padEnd(4, "_").split("");
    this.keypadDisplay.setText(digitos.join(" "));
  }

  confirmarSenhaGaveta() {
    if (this.senhaDigitada === this.senhaGaveta) {
      this.limparKeypad();
      this.isPuzzleActive = false;
      this.desbloquearGaveta();
    } else {
      this.cameras.main.shake(200, 0.01);
      this.senhaDigitada = "";
      this.keypadDisplay.setText("_ _ _ _").setColor("#ff3333");
      this.time.delayedCall(500, () => {
        if (this.keypadDisplay) this.keypadDisplay.setColor("#E3C18D");
      });
    }
  }

  limparKeypad() {
    if (this.keypadElements) {
      this.keypadElements.forEach((el) => {
        if (el && el.destroy) el.destroy();
      });
    }
    this.keypadElements = [];
    this.keypadDisplay = null;
  }

  // Troca a gaveta para o estado "aberto" (FurnitureState2 = FurnitureState1 + 234) e libera a colisão.
  // Extraído à parte para poder ser reaplicado silenciosamente ao restaurar o progresso (ver create()).
  aplicarVisualGavetaAberta() {
    const celulas = [
      { x: 12, y: 2, gid: 458 }, { x: 13, y: 2, gid: 459 },
      { x: 12, y: 3, gid: 471 }, { x: 13, y: 3, gid: 472 },
      { x: 12, y: 4, gid: 484 }, { x: 13, y: 4, gid: 485 }
    ];
    celulas.forEach((c) => this.gavetaLayer.putTileAt(c.gid + 234, c.x, c.y));

    if (this.gavetaCollider) {
      this.physics.world.removeCollider(this.gavetaCollider);
    }
  }

  desbloquearGaveta() {
    this.gavetaAberta = true;
    this.registry.set("gavetaAberta", true);
    this.cameras.main.flash(500, 255, 255, 255);

    this.aplicarVisualGavetaAberta();

    const falas = [
      "Protagonista: Meus documentos... estão todos aqui. Ele não podia mais escondê-los de mim.",
      "Nêmesis: O que é seu, é seu direito e sua liberdade. Ele nunca teve o poder de tomar isso de você."
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
        this.scene.start("Sala", { fromEscritorio: true });
      });
    });
  }

  iniciarPortaProximoNivelTrancada() {
    const falas = [
      "Protagonista: Essa porta não abre. Acho que ainda preciso resolver algo aqui.",
      "Nêmesis: Recupere o que é seu antes de seguir em frente."
    ];

    this.startDialogue(falas, null);
  }

  iniciarTransicaoProximoNivel() {
    const falas = [
      "Protagonista: Com meus documentos em mãos, posso continuar.",
      "Nêmesis: Cada porta que você abre é um passo a mais fora do ciclo."
    ];

    this.startDialogue(falas, () => {
      this.sound.play("som_porta", { volume: this.registry.get("sfxVolume") });

      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start("QuartoCasal");
      });
    });
  }

  // =========================================================================
  // 🎬 SISTEMA DE DIÁLOGO (idêntico ao usado na Sala)
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
  // ⏸️ TELA DE PAUSA (idêntica à usada na Sala)
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
