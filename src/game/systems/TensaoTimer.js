// Cronômetro global de 10 minutos e estágios de tensão ambiental, compartilhado por todos os cômodos do jogo.
// O tempo persiste em scene.registry (chave "tempoRestante"), então continua contando ao trocar de cena/cômodo.
export default class TensaoTimer {
  constructor(scene) {
    this.scene = scene;

    if (!scene.registry.has("tempoRestante")) {
      scene.registry.set("tempoRestante", 600); // 10 minutos = 600 segundos
    }
    this.tempoFase = scene.registry.get("tempoRestante");
    scene.speedMultiplier = 1; // Lido pelo Player para o multiplicador de velocidade
    this.estagioAtual = null;
    this.heartbeatTween = null;

    // Painel de UI do Cronômetro (Caixa Retrô Minimalista no canto superior direito)
    this.timerBg = scene.add.graphics();
    this.timerBg.fillStyle(0x2C1A11, 0.9);
    this.timerBg.lineStyle(1, 0xE3C18D, 1);
    this.timerBg.fillRect(205, 10, 105, 22);
    this.timerBg.strokeRect(205, 10, 105, 22);
    this.timerBg.setScrollFactor(0).setDepth(190);

    const minutosIniciais = Math.floor(this.tempoFase / 60);
    const segundosIniciais = this.tempoFase % 60;
    const textoFormatado = "Tempo: " + String(minutosIniciais).padStart(2, '0') + ":" + String(segundosIniciais).padStart(2, '0');

    this.timerText = scene.add.text(257, 21, textoFormatado, {
      fontSize: "16px",
      fontStyle: "normal",
      color: "#E3C18D",
      fontFamily: "m5x7",
      resolution: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(191);

    // Overlay de Tint para Estágios de Tensão
    this.screenTintOverlay = scene.add.graphics();
    this.screenTintOverlay.setScrollFactor(0).setDepth(98).setVisible(false);

    // Overlay Vermelho para Pulso de Batimentos Cardíacos (Estágio 4)
    this.redOverlay = scene.add.graphics();
    this.redOverlay.fillStyle(0xff0000, 0.25);
    this.redOverlay.fillRect(0, 0, 320, 240);
    this.redOverlay.setScrollFactor(0).setDepth(99).setVisible(false);
    this.redOverlay.setAlpha(0);

    this.timerEvent = scene.time.addEvent({
      delay: 1000,
      callback: this.tickSegundo,
      callbackScope: this,
      loop: true
    });

    scene.events.once("shutdown", () => {
      if (this.timerEvent) this.timerEvent.destroy();
    });

    this.atualizarEfeitosEstagio();
  }

  tickSegundo() {
    const scene = this.scene;
    if (scene.isPaused) return;

    this.tempoFase--;
    scene.registry.set("tempoRestante", this.tempoFase);

    const minutos = Math.floor(this.tempoFase / 60);
    const segundos = this.tempoFase % 60;
    const strMinutos = String(minutos).padStart(2, '0');
    const strSegundos = String(segundos).padStart(2, '0');

    const caractereSeparador = segundos % 2 === 0 ? ":" : " ";
    this.timerText.setText(`Tempo: ${strMinutos}${caractereSeparador}${strSegundos}`);

    this.atualizarEfeitosEstagio();

    if (this.tempoFase <= 0) {
      if (this.timerEvent) this.timerEvent.destroy();
      this.fimDoTempoAbuso();
    }
  }

  atualizarEfeitosEstagio() {
    const scene = this.scene;

    let novoEstagio = 1;
    if (this.tempoFase > 450) novoEstagio = 1;
    else if (this.tempoFase > 300) novoEstagio = 2;
    else if (this.tempoFase > 120) novoEstagio = 3;
    else novoEstagio = 4;

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
    } else if (this.estagioAtual !== novoEstagio) {
      const estagioAnterior = this.estagioAtual;
      this.estagioAtual = novoEstagio;

      if (estagioAnterior === 4 && novoEstagio < 4) {
        if (this.heartbeatTween) {
          this.heartbeatTween.destroy();
          this.heartbeatTween = null;
        }
        this.redOverlay.setVisible(false);
      }

      if (novoEstagio === 3) {
        scene.cameras.main.shake(600, 0.006);
        if (scene.startDialogue) {
          scene.startDialogue([
            "Protagonista: O ambiente está ficando sufocante... Sinto que o tempo está contra mim.",
            "Nêmesis: A pressão psicológica está se intensificando. Não deixe o ciclo de abusos se fechar!"
          ], null);
        }
      }

      scene.tweens.add({
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

            scene.tweens.add({
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

    if (this.estagioAtual === 4 && this.tempoFase > 0) {
      scene.speedMultiplier = 0.85;

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

      if (!this.heartbeatTween) {
        this.redOverlay.setVisible(true);
        this.heartbeatTween = scene.tweens.add({
          targets: this.redOverlay,
          alpha: { from: 0.02, to: 0.4 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut"
        });
      }
    } else {
      scene.speedMultiplier = 1;
    }
  }

  fimDoTempoAbuso() {
    const scene = this.scene;
    scene.physics.world.pause();
    scene.player.setVelocity(0);
    scene.registry.set("resultadoFinal", "timeout");

    scene.cameras.main.fadeOut(1500, 0, 0, 0);
    scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      scene.scene.start("GameOver");
    });
  }
}
