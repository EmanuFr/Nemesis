import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {}

  preload() {
    this.load.setPath("assets");

    // Sprite Sheets da Protagonista
    this.load.spritesheet("player", "Idle.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    this.load.spritesheet("playerWalk", "Walk.png", {
      frameWidth: 32,
      frameHeight: 32,
    });

    // 1. Carregar o arquivo de Mapa (JSON do Tiled)
    this.load.tilemapTiledJSON("mapa-sala", "Tiled/Sala.tmj");

    // 2. Carregar as Imagens dos Tilesets
    this.load.image("portas_janelas", "Top-Down_Retro_Interior/TopDownHouse_DoorsAndWindows.png");
    this.load.image("portas_abertas", "Top-Down_Retro_Interior/TopDownHouse_FloorsAndWalls_OpenDoors.png");
    this.load.image("chao_paredes", "Top-Down_Retro_Interior/TopDownHouse_FloorsAndWalls.png");
    this.load.image("moveis_1", "Top-Down_Retro_Interior/TopDownHouse_FurnitureState1.png");
    this.load.image("moveis_2", "Top-Down_Retro_Interior/TopDownHouse_FurnitureState2.png");
    this.load.image("itens_pequenos", "Top-Down_Retro_Interior/TopDownHouse_SmallItems.png");

    // 3. Carregar Recursos de UI fornecidos pelo Usuário
    this.load.image("nemesis_avatar", "Rosto nemesis.png");
    this.load.image("button_retro", "../UI/Freebuttons/LongButtons.png");
    this.load.spritesheet("button_retro_sheet", "../UI/Freebuttons/LongButtons.png", {
      frameWidth: 64,
      frameHeight: 16
    });

    // 4. Carregar a Trilha Sonora do Jogo
    this.load.audio("musica_fundo", "Songs/Trilha sonora .m4a");
  }

  create() {
    // Valores padrão de volume (persistidos globalmente no registro do Phaser)
    if (!this.registry.has("musicVolume")) this.registry.set("musicVolume", 0.5);
    if (!this.registry.has("sfxVolume")) this.registry.set("sfxVolume", 0.5);

    // Inicia a trilha sonora em loop, tocando através de todas as cenas do jogo
    if (!this.sound.get("musica_fundo")) {
      const musica = this.sound.add("musica_fundo", {
        loop: true,
        volume: this.registry.get("musicVolume")
      });
      musica.play();
    }

    this.scene.start("MainMenu");
  }
}
