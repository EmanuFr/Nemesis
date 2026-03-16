import { Scene } from "phaser";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  create() {
    this.player = this.add.rectangle(160, 120, 16, 16, 0xffffff);

    this.physics.add.existing(this.player);
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
  }
}
