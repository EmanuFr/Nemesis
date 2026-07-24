import { Boot } from "./scenes/Boot";
import { Sala } from "./scenes/Sala";
import { Escritorio } from "./scenes/Escritorio";
import { QuartoCasal } from "./scenes/QuartoCasal";
import { SalaDeEstar } from "./scenes/SalaDeEstar";
import { GameOver } from "./scenes/GameOver";
import { MainMenu } from "./scenes/MainMenu";
import { Preloader } from "./scenes/Preloader";
import { AUTO, Game, Physics } from "phaser";

const config = {
  type: AUTO,
  width: 320,
  height: 240,
  parent: "game-container",
  backgroundColor: "#2C1A11",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        y: 0,
      },
      debug: false,
    },
  },
  scene: [Boot, Preloader, MainMenu, Sala, Escritorio, QuartoCasal, SalaDeEstar, GameOver],
};

const StartGame = (parent) => {
  return new Game({ ...config, parent });
};

export default StartGame;
