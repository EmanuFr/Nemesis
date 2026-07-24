import { Scene } from "phaser";
import { resetarTodoProgresso } from "../systems/Progresso.js";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    // Imagem de fundo da tela inicial (substitui o fundo marrom sólido)
    const fundo = this.add.image(160, 120, "tela_inicial").setDepth(-10);
    fundo.setDisplaySize(320, 240);

    // Moldura elegante em dourado (Soft Gold)
    const moldura = this.add.graphics();
    moldura.lineStyle(1.5, 0xE3C18D, 0.7); // 70% de opacidade
    moldura.strokeRect(8, 8, 304, 224);

    // Título em tamanho de destaque pixel art (m5x7, 48px)
    const titleText = this.add.text(160, 80, "NÊMESIS", {
      fontSize: "48px",
      fontStyle: "normal",
      color: "#E3C18D", // Soft Gold
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(0.5);

    // Subtítulo descritivo
    const subtitleText = this.add.text(160, 115, "Rompa o Ciclo", {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#ffffff",
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(0.5);

    // Prompt interativo com caixa de UI desenhada via código (Minimalista e Solene)
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(0x2C1A11, 0.95); // Zinnwaldite Brown
    buttonBg.lineStyle(1.5, 0xE3C18D, 1); // Borda Soft Gold
    buttonBg.fillRect(40, 172, 240, 26);
    buttonBg.strokeRect(40, 172, 240, 26);
    buttonBg.setDepth(10);

    const prompt = this.add.text(160, 185, "Clique ou ESPAÇO para Iniciar", {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D", // Dourado Soft Gold para harmonia total
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(0.5).setDepth(11);

    // Efeito de pulso piscante no prompt e no botão
    this.tweens.add({
      targets: [prompt, buttonBg],
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      loop: -1
    });

    // Eventos de escuta para transição suave para a cena do jogo
    this.input.once("pointerdown", () => {
      this.sound.play("som_click", { volume: this.registry.get("sfxVolume") });
      this.iniciarNovoJogo();
    });

    this.input.keyboard.once("keydown-SPACE", () => {
      this.sound.play("som_click", { volume: this.registry.get("sfxVolume") });
      this.iniciarNovoJogo();
    });
  }

  // Zera todo o progresso salvo no registro global antes de começar — evita que uma partida nova
  // "herde" o progresso de uma anterior (ex: jogador venceu, voltou ao menu e clicou em Iniciar de novo)
  iniciarNovoJogo() {
    resetarTodoProgresso(this.registry);
    this.scene.start("Sala");
  }
}

