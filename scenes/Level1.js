class Level1 extends Phaser.Scene {

    constructor() {
        super("Level1");
    }

    // ==========================================
    // PRELOAD
    // ==========================================

    preload() {

        this.load.image("ship", "assets/img/ship.png");
        this.load.image("asteroid", "assets/img/asteroid.png");
        this.load.image("background", "assets/img/starry-night.png");

        const letters = "abcdefghijklmnopqrstuvwxyz";

        for (let c of letters) {
            this.load.audio(c, `assets/audio/${c}.mp3`);
        }

        this.load.audio("ae", "assets/audio/ae.mp3");
        this.load.audio("oe", "assets/audio/oe.mp3");
        this.load.audio("ue", "assets/audio/ue.mp3");

        this.load.audio("super", "assets/audio/super.wav");
        this.load.audio("gut", "assets/audio/gut.wav");
        this.load.audio("toll", "assets/audio/toll.wav");

        this.load.audio(
            "finde_instr",
            "assets/audio/finde_den_buchstaben.wav"
        );
    }

    // ==========================================
    // CREATE
    // ==========================================

    create() {

        const music = this.registry.get("bgMusicInstance");

        if (music && music.isPlaying) {
            // do nothing → reuse Menu music
            } else if (music) {
                music.play(0);
            }

        this.soundMap = {
            ä: "ae",
            ö: "oe",
            ü: "ue"
        };

        const bg = this.add.image(
            this.scale.width / 2,
            this.scale.height / 2,
            "background"
        );

        bg.setDisplaySize(
            this.scale.width,
            this.scale.height
        );

        this.input.once("pointerdown", () => {
            this.sound.unlock();
        });

        this.index = 0;
        this.levelOrder = this.generateRounds(8);

        this.asteroids = this.add.group();
        this.labels = this.add.group();
        this.bullets = this.add.group();

        this.ship = this.physics.add.sprite(
            this.scale.width / 2,
            this.scale.height - 80,
            "ship"
        );

        this.ship.setDisplaySize(130, 130);
        this.ship.setCollideWorldBounds(true);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.spaceKey = this.input.keyboard.addKey(32);
        this.spaceKey.on("down", this.shoot, this);

        this.promptText = this.add.text(
            20,
            20,
            "",
            {
                fontSize: "28px",
                color: "#ffffff",
    
                padding: {
                    x: 10,
                    y: 10
                }
            }
        );

        this.promptText.setShadow(2, 2, "#000000", 6, true, true);

        this.loadRound();
    }

    // ==========================================
    // ROUND GENERATION
    // ==========================================

    getLetterPool() {
        return "abcdefghijklmnopqrstuvwxyzäöü".split("");
    }

    generateRounds(count) {

        const letters = this.getLetterPool();
        const rounds = [];

        for (let i = 0; i < count; i++) {

            const target = Phaser.Utils.Array.GetRandom(letters);

            const variants = [
                target.toUpperCase(),
                target.toLowerCase()
            ];

            rounds.push({
                target,
                variants
            });
        }

        return rounds;
    }

    // ==========================================
    // LOAD ROUND
    // ==========================================

    loadRound() {

        this.clearRound();

if (this.index >= this.levelOrder.length) {

    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    this.add.text(
        centerX,
        centerY - 120,
        "LEVEL 1 GESCHAFFT!",
        {
            fontSize: "60px",
            color: "#ffffff"
        }
    ).setOrigin(0.5);

    // ======================================
    // REPLAY BUTTON
    // ======================================
    const replayBtn = this.add.text(
        centerX,
        centerY,
        "🔁 REPLAY",
        {
            fontSize: "40px",
            color: "#00ffcc",
            backgroundColor: "#000000",
            padding: { x: 20, y: 10 }
        }
    ).setOrigin(0.5).setInteractive();

    replayBtn.on("pointerdown", () => {

        this.scene.restart();
    });

    replayBtn.on("pointerover", () => replayBtn.setScale(1.1));
    replayBtn.on("pointerout", () => replayBtn.setScale(1));

    // ======================================
    // NEXT LEVEL BUTTON
    // ======================================
    const nextBtn = this.add.text(
        centerX,
        centerY + 80,
        "▶ NEXT LEVEL",
        {
            fontSize: "40px",
            color: "#ffffff",
            backgroundColor: "#222222",
            padding: { x: 20, y: 10 }
        }
    ).setOrigin(0.5).setInteractive();

    nextBtn.on("pointerdown", () => {

        this.scene.start("Level2");
    });

    nextBtn.on("pointerover", () => nextBtn.setScale(1.1));
    nextBtn.on("pointerout", () => nextBtn.setScale(1));

    return;
}
    

        this.current = this.levelOrder[this.index];
        this.current.target = this.current.target.toLowerCase();

        this.foundLetters = [];

        const positions = this.generatePositions(12);

        let i = 0;

        for (let l of this.current.variants) {
            this.spawnAsteroid(positions[i], l, true);
            i++;
        }

        const alphabet = this.getLetterPool()
            .filter(l => l !== this.current.target);

        while (i < positions.length) {

            this.spawnAsteroid(
                positions[i],
                Phaser.Utils.Array.GetRandom(alphabet),
                false
            );

            i++;
        }

        this.updatePrompt();

        // instruction audio → letter audio
        this.time.delayedCall(400, () => {

            const instr = this.sound.add("finde_instr");

            instr.once("complete", () => {

                instr.destroy();

                if (this.current) {

                    const soundKey =
                        this.soundMap[this.current.target] ||
                        this.current.target;

                this.sound.play(soundKey);
        }
            });

            instr.play();
        });
    }

    // ==========================================
    // CLEANUP
    // ==========================================

    clearRound() {

        this.asteroids.clear(true, true);
        this.labels.clear(true, true);

        this.bullets.getChildren().forEach(b => b.destroy());
        this.bullets.clear();
    }

    // ==========================================
    // ASTEROIDS
    // ==========================================

    spawnAsteroid(pos, text, correct) {

        const size = Phaser.Math.Between(70, 110);

        const asteroid = this.physics.add.sprite(
            pos.x,
            pos.y,
            "asteroid"
        );

        asteroid.setDisplaySize(size, size);

        asteroid.setScale(0.33);

        asteroid.setVelocity(
            Phaser.Math.FloatBetween(-50, 50),
            Phaser.Math.FloatBetween(-50, 50)
        );

        asteroid.setAngularVelocity(
            Phaser.Math.FloatBetween(-6, 6)
        );

        asteroid.setBounce(0);
        asteroid.setCollideWorldBounds(false);

        asteroid.correct = correct;
        asteroid.radius = size * 0.45;

        asteroid.setBlendMode(Phaser.BlendModes.ADD);
        asteroid.setAlpha(0.9);

        this.tweens.add({
            targets: asteroid,
            scaleX: 0.25,
            scaleY: 0.25,
            duration: Phaser.Math.Between(2000, 3000),
            yoyo: true,
            repeat: -1
        });

        const label = this.add.text(
            pos.x,
            pos.y,
            text,
            {
                fontSize: size * 0.5,
                color: "#111111",
                stroke: "#ffffff",
                strokeThickness: 5,
                fontStyle: "bold"
            }
        ).setOrigin(0.5);

        asteroid.label = label;

        this.asteroids.add(asteroid);
        this.labels.add(label);
    }

    // ==========================================
    // SHOOT
    // ==========================================

    shoot() {

        const bullet = this.add.rectangle(
            this.ship.x,
            this.ship.y - 60,
            8,
            20,
            0xff3333
        );

        this.physics.add.existing(bullet);

        bullet.body.setVelocityY(-900);
        bullet.body.allowGravity = false;

        this.bullets.add(bullet);
    }

    // ==========================================
    // UPDATE
    // ==========================================

    update() {

        if (this.cursors.left.isDown) this.ship.x -= 6;
        if (this.cursors.right.isDown) this.ship.x += 6;

        this.ship.x = Phaser.Math.Clamp(
            this.ship.x,
            60,
            this.scale.width - 60
        );

        // sync labels + rotation
        this.asteroids.getChildren().forEach(a => {

            if (!a.active) return;

            if (a.label) {
                a.label.x = a.x;
                a.label.y = a.y;
                a.label.angle = a.angle;
 
            }

            // horizontal wrap only
            if (a.x < -50) a.x = this.scale.width + 50;
            if (a.x > this.scale.width + 50) a.x = -50;

            if (a.y < 80) {
                a.y = 80;
                a.body.velocity.y *= -1;
            }

            if (a.y > this.scale.height - 250) {
                a.y = this.scale.height - 250;
                a.body.velocity.y *= -1;
            }
        });

        // bullets + collisions
        this.bullets.getChildren().forEach(b => {

            if (!b.active) return;

            if (b.y < -50) {
                b.destroy();
                return;
            }

            this.asteroids.getChildren().forEach(a => {

                if (!a.active || !b.active) return;

                const d = Phaser.Math.Distance.Between(
                    b.x, b.y, a.x, a.y
                );

                if (d < a.radius) {

                    b.destroy();

                    if (a.correct) {

                        this.explosion(a.x, a.y);

                        this.sound.play(
                            Phaser.Utils.Array.GetRandom([
                                "super",
                                "gut",
                                "toll"
                            ])
                        );

                        if (a.label) {

                            const letter = a.label.text;

                            if (!this.foundLetters.includes(letter)) {
                                this.foundLetters.push(letter);
                                this.updatePrompt();
                            }
                        }

                        if (a.label) a.label.destroy();
                        a.destroy();

                        const remaining = this.asteroids
                            .getChildren()
                            .filter(x => x.active && x.correct);

                        if (remaining.length === 0) {

                            this.time.delayedCall(1000, () => {
                                this.index++;
                                this.loadRound();
                            });
                        }
                    }
                }
            });
        });
    }

    updatePrompt() {

    const found =
        this.foundLetters.length > 0
            ? this.foundLetters.join(", ")
            : "-";

    this.promptText.setText(
        `Finde:\n${this.current.target.toUpperCase()}, ${this.current.target.toLowerCase()}\n\nGefunden:\n${found}`
    );
    }
    
    // ==========================================
    // EXPLOSION
    // ==========================================

    explosion(x, y) {

        for (let i = 0; i < 15; i++) {

            const p = this.add.circle(x, y, 4, 0xffff00);

            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const dist = Phaser.Math.Between(20, 80);

            this.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0,
                duration: 500,
                onComplete: () => p.destroy()
            });
        }
    }

    // ==========================================
    // POSITION GENERATION
    // ==========================================

    generatePositions(count) {

        const positions = [];

        while (positions.length < count) {

            const x = Phaser.Math.Between(120, this.scale.width - 120);
            const y = Phaser.Math.Between(80, this.scale.height - 250);

            let ok = true;

            for (let p of positions) {
                if (Phaser.Math.Distance.Between(x, y, p.x, p.y) < 130) {
                    ok = false;
                    break;
                }
            }

            if (ok) positions.push({ x, y });
        }

        return positions;
    }
}
