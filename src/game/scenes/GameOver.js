import { Scene } from "phaser";

export class GameOver extends Scene {
  constructor() {
    super("GameOver");
  }

  create() {
    // 1. Fundo Temático Solene (Zinnwaldite Brown)
    this.cameras.main.setBackgroundColor("#2C1A11");

    // 2. Moldura Clássica e Elegante (Soft Gold)
    const moldura = this.add.graphics();
    moldura.lineStyle(1.5, 0xE3C18D, 0.7); // 70% de opacidade
    moldura.strokeRect(8, 8, 304, 224);

    // Recupera o resultado da partida (padrão "sucesso")
    const resultado = this.registry.get("resultadoFinal") || "sucesso";

    if (resultado === "sucesso") {
      // =======================================================================
      // TELA DE VITÓRIA: O OUTRO MUNDO
      // =======================================================================
      
      const titleText = this.add.text(160, 48, "O OUTRO MUNDO", {
        fontSize: "48px",
        fontStyle: "normal",
        color: "#E3C18D", // Soft Gold
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5);

      const subtitleText = this.add.text(160, 80, "A Jornada da Liberdade", {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#ffffff",
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5);

      const line1 = this.add.text(160, 110, "Você rompeu as amarras invisíveis", {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#ffffff",
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5);

      const line2 = this.add.text(160, 126, "da mente e atravessou o portal.", {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#ffffff",
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5);

      const line3 = this.add.text(160, 142, "Uma nova história cheia de luz, respeito", {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#ffffff",
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5);

      const line4 = this.add.text(160, 158, "e paz se inicia. Você é livre.", {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#E3C18D", // Dourado
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5);

      // Caixa de Botão
      const buttonBg = this.add.graphics();
      buttonBg.fillStyle(0x2C1A11, 0.95);
      buttonBg.lineStyle(1.5, 0xE3C18D, 1);
      buttonBg.fillRect(40, 182, 240, 26);
      buttonBg.strokeRect(40, 182, 240, 26);
      buttonBg.setDepth(10);

      const promptText = this.add.text(160, 195, "Clique ou ESPAÇO para o Menu", {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#E3C18D",
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5).setDepth(11);

      this.tweens.add({
        targets: [promptText, buttonBg],
        alpha: 0.4,
        duration: 1000,
        yoyo: true,
        loop: -1
      });

      // Eventos para voltar ao menu inicial
      this.input.once("pointerdown", () => {
        this.registry.set("tempoRestante", 600); // Reseta o tempo
        this.scene.start("MainMenu");
      });

      this.input.keyboard.once("keydown-SPACE", () => {
        this.registry.set("tempoRestante", 600); // Reseta o tempo
        this.scene.start("MainMenu");
      });

    } else {
      // =======================================================================
      // TELA DE TIMEOUT: O CICLO SE FECHOU
      // =======================================================================

      const titleText = this.add.text(160, 48, "O CICLO SE FECHOU", {
        fontSize: "32px", // Menor para caber confortavelmente
        fontStyle: "normal",
        color: "#ff3333", // Vermelho Alerta
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5);

      const subtitleText = this.add.text(160, 80, "Estatística de Violência Doméstica", {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#ffffff",
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5);

      const line1 = this.add.text(160, 110, "A cada 10 minutos, uma mulher se torna", {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#ffffff",
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5);

      const line2 = this.add.text(160, 126, "vítima de agressão física no Brasil.", {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#ffffff",
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5);

      const line3 = this.add.text(160, 142, "O tempo acabou antes de você conseguir", {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#ffffff",
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5);

      const line4 = this.add.text(160, 158, "romper o ciclo de abusos. Ligue 180.", {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#ff3333", // Destaque Vermelho
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5);

      // Caixa de Botão
      const buttonBg = this.add.graphics();
      buttonBg.fillStyle(0x2C1A11, 0.95);
      buttonBg.lineStyle(1.5, 0xff3333, 1); // Borda Vermelha
      buttonBg.fillRect(40, 182, 240, 26);
      buttonBg.strokeRect(40, 182, 240, 26);
      buttonBg.setDepth(10);

      const promptText = this.add.text(160, 195, "Clique ou ESPAÇO para Tentar de Novo", {
        fontSize: "16px",
        fontStyle: "normal",
        color: "#ff3333",
        fontFamily: "m5x7",
        resolution: 4
      }).setOrigin(0.5).setDepth(11);

      this.tweens.add({
        targets: [promptText, buttonBg],
        alpha: 0.4,
        duration: 1000,
        yoyo: true,
        loop: -1
      });

      // Eventos para reiniciar e repor o tempo
      const recomecarPartida = () => {
        this.registry.set("tempoRestante", 600); // Reseta o tempo para 10 minutos
        this.registry.set("resultadoFinal", "sucesso"); // Reseta estado
        this.scene.start("Game"); // Reinicia a cena do quarto
      };

      this.input.once("pointerdown", recomecarPartida);
      this.input.keyboard.once("keydown-SPACE", recomecarPartida);
    }
  }
}
