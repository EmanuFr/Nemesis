import { Scene } from "phaser";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  create() {
    //player
    this.player = this.physics.add.sprite(160, 120, "player");
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("player", {
        start: 0,
        end: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("player", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "idle",
      frames: [{ key: "player", frame: 4 }], // Pegando apenas UM quadro
      frameRate: 10,
    });

    //colisão
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    //movimentação
    this.cursors = this.input.keyboard.createCursorKeys();

    this.cursorsW = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.W,
    );
    this.cursorsA = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.A,
    );
    this.cursorsS = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.S,
    );
    this.cursorsD = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.D,
    );
  }

  update() {
    this.player.body.setVelocity(0);

    let dirX = 0;
    let dirY = 0;

    if (this.cursors.left.isDown || this.cursorsA.isDown) dirX = -1;
    else if (this.cursors.right.isDown || this.cursorsD.isDown) dirX = 1;

    if (this.cursors.up.isDown || this.cursorsW.isDown) dirY = -1;
    else if (this.cursors.down.isDown || this.cursorsS.isDown) dirY = 1;

    const velocityVector = new Phaser.Math.Vector2(dirX, dirY);

    velocityVector.normalize();

    const velocidadeBase = 100;

    this.player.body.setVelocity(
      velocityVector.x * velocidadeBase,
      velocityVector.y * velocidadeBase,
    );

    if (dirX === -1) {
      this.player.anims.play("left", true);
    } else if (dirX === 1) {
      this.player.anims.play("right", true);
    }

    if (dirX === 0 && dirY === 0) {
      this.player.anims.play("idle", true);
    }
  }
}
