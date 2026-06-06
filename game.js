const config = {

    type: Phaser.AUTO,

    parent: "game-container",

    backgroundColor: "#000000",

    scale: {

        mode: Phaser.Scale.FIT,

        autoCenter: Phaser.Scale.CENTER_BOTH,

        width: 1280,

        height: 720
    },

    physics: {

        default: "arcade",

        arcade: {
            debug: false
        }
    },

    scene: [Menu, Level1, Level2]
};

new Phaser.Game(config);