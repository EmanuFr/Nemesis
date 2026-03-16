import { Scene } from "phaser";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    this.add
      .text(160, 120, "MENU INICIAL\nClique para jogar", {
        color: "#ffffff",
        resolution: 40,
      })
      .setOrigin(0.5);
    this.input.once("pointerdown", () => {
      this.scene.start("Game");
    });
  }
}
