class Menu extends Phaser.Scene {

    constructor() {
        super("Menu");
    }

    preload() {
        this.load.audio(
            "bgMusic",
            "assets/audio/mozart_kleineNachtmusik.mp3"
        );
    }

    create() {

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // =========================
        // BACKGROUND
        // =========================
        this.add.rectangle(
            centerX,
            centerY,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.7
        );

        // =========================
        // TITLE
        // =========================
        this.add.text(
            centerX,
            centerY - 180,
            "Raumschiff Alphabet",
            {
                fontSize: "64px",
                color: "#ffffff"
            }
        ).setOrigin(0.5);

        // =========================
        // AUDIO STATE (NOT CREATED YET)
        // =========================
        this.music = null;

        // =========================
        // FIRST USER GESTURE → UNLOCK + START MUSIC
        // =========================
this.input.once("pointerdown", async () => {

    if (this.sound.context?.state === "suspended") {
        await this.sound.context.resume();
    }

    const music = this.sound.add("bgMusic", {
        loop: true,
        volume: 0.18
    });

    music.play();

    this.registry.set("bgMusicInstance", music);

    console.log("Background music started");
});
        // =========================
        // LEVEL BUTTONS
        // =========================
        this.createButton(
            centerX,
            centerY - 40,
            "▶ Level 1",
            () => this.scene.start("Level1")
        );

        this.createButton(
            centerX,
            centerY + 40,
            "▶ Level 2",
            () => this.scene.start("Level2")
        );

        this.createButton(
            centerX,
            centerY + 120,
            "▶ Level 3",
            () => {
                console.log("Level 3 not implemented yet");
            }
        );
    }

    // ==========================================
    // BUTTON FACTORY
    // ==========================================
    createButton(x, y, text, callback) {

        const btn = this.add.text(
            x,
            y,
            text,
            {
                fontSize: "40px",
                color: "#00ffcc",
                backgroundColor: "#111111",
                padding: { x: 20, y: 10 }
            }
        )
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        btn.on("pointerover", () => {
            btn.setStyle({ color: "#ffffff" });
            btn.setScale(1.1);
        });

        btn.on("pointerout", () => {
            btn.setStyle({ color: "#00ffcc" });
            btn.setScale(1);
        });

        btn.on("pointerdown", callback);

        return btn;
    }
}