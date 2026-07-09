import { Physics } from "phaser";

export default class Player extends Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // 1. Construtor base
    super(scene, x, y, "player");

    // 2. Adiciona à cena e física
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 3. Limites do mundo
    this.setCollideWorldBounds(true);

    // Escalonamento da Protagonista para corrigir a proporção em relação aos móveis (ex: fogão)
    this.setScale(1.5);

    // 4. Caixa de Colisão Otimizada (Hitbox Circular Compacta nos pés)
    // Reduzimos o raio para 5 pixels (10 de diâmetro) para que na escala 1.5x ela fique com 15px reais.
    // Centralizamos horizontalmente (offset X = 11) e subimos levemente em Y (offset Y = 20) para encostar perfeitamente nos sapatos,
    // permitindo que o jogador chegue bem perto dos objetos antes de colidir de verdade.
    this.body.setCircle(5, 11, 20);



    // 5. Captura inputs
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.cursorsW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.cursorsA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.cursorsS = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.cursorsD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // 6. Criação Segura das Animações Globais
    // O Player se autogestão. Se a animação não existir no cache global, ele a cria.
    this.createPlayerAnimations(scene);

    this.lastDirection = "down";
    this.lastFlipX = false;
  }

  createPlayerAnimations(scene) {
    // Criação segura de animações de Idle (no spritesheet "player" que é o Idle)
    if (!scene.anims.exists("idle-down")) {
      scene.anims.create({
        key: "idle-down",
        frames: scene.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    if (!scene.anims.exists("idle-up")) {
      scene.anims.create({
        key: "idle-up",
        frames: scene.anims.generateFrameNumbers("player", { start: 4, end: 7 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    if (!scene.anims.exists("idle-side")) {
      scene.anims.create({
        key: "idle-side",
        frames: scene.anims.generateFrameNumbers("player", { start: 8, end: 11 }),
        frameRate: 6,
        repeat: -1,
      });
    }

    // Criação segura de animações de Caminhada (no spritesheet "playerWalk" que é o Walk)
    if (!scene.anims.exists("walk-side")) {
      scene.anims.create({
        key: "walk-side",
        frames: scene.anims.generateFrameNumbers("playerWalk", { start: 12, end: 17 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!scene.anims.exists("walk-up")) {
      scene.anims.create({
        key: "walk-up",
        frames: scene.anims.generateFrameNumbers("playerWalk", { start: 6, end: 11 }),
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!scene.anims.exists("walk-down")) {
      scene.anims.create({
        key: "walk-down",
        frames: scene.anims.generateFrameNumbers("playerWalk", { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1,
      });
    }
  }

  update() {
    this.setVelocity(0);

    let dirX = 0;
    let dirY = 0;

    if (this.cursors.left.isDown || this.cursorsA.isDown) dirX = -1;
    else if (this.cursors.right.isDown || this.cursorsD.isDown) dirX = 1;

    if (this.cursors.up.isDown || this.cursorsW.isDown) dirY = -1;
    else if (this.cursors.down.isDown || this.cursorsS.isDown) dirY = 1;

    const velocityVector = new Phaser.Math.Vector2(dirX, dirY);
    velocityVector.normalize();

    // Suporte para multiplicador de velocidade controlado pela cena (ex: pânico do Estágio 4)
    const multiplicador = this.scene.speedMultiplier !== undefined ? this.scene.speedMultiplier : 1;
    const velocidadeBase = 75 * multiplicador;

    // Aplica a velocidade resultante ao corpo do sprite
    this.setVelocity(
      velocityVector.x * velocidadeBase,
      velocityVector.y * velocidadeBase
    );

    if (dirX === -1) {
      this.setFlipX(true);
      this.anims.play("walk-side", true);
      this.lastDirection = "side";
      this.lastFlipX = true;
    } else if (dirX === 1) {
      this.setFlipX(false);
      this.anims.play("walk-side", true);
      this.lastDirection = "side";
      this.lastFlipX = false;
    } else if (dirY === -1) {
      this.anims.play("walk-up", true);
      this.lastDirection = "up";
    } else if (dirY === 1) {
      this.anims.play("walk-down", true);
      this.lastDirection = "down";
    }

    if (dirX === 0 && dirY === 0) {
      if (this.lastDirection === "side") {
        this.setFlipX(this.lastFlipX);
        this.anims.play("idle-side", true);
      } else if (this.lastDirection === "up") {
        this.anims.play("idle-up", true);
      } else {
        this.anims.play("idle-down", true);
      }
    }
  }
}

