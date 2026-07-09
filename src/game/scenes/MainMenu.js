import { Scene } from "phaser";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    // Fundo Temático Marrom Escuro (Zinnwaldite Brown)
    this.cameras.main.setBackgroundColor("#2C1A11");

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
      this.scene.start("Game");
    });

    this.input.keyboard.once("keydown-SPACE", () => {
      this.scene.start("Game");
    });
  }
}

