import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {}

  preload() {
    this.load.setPath("assets");

    this.load.spritesheet("player", "protagonista_temp.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    this.scene.start("MainMenu");
  }
}
