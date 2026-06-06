class Level1 extends Phaser.Scene {

    constructor() {
        super("Level1");
    }

    preload() {

        // Assets
        this.load.image("ship", "assets/img/ship.png");
        this.load.image("asteroid", "assets/img/asteroid.png");
        this.load.image("background", "assets/img/starry-night.png");

        // Letter sounds
        const letters = "abcdefghijklmnopqrstuvwxyz";
        for (let c of letters) {
            this.load.audio(c, `assets/audio/${c}.mp3`);
        }

        // Feedback sounds
        this.load.audio("super", "assets/audio/super.wav");
        this.load.audio("gut", "assets/audio/gut.wav");
        this.load.audio("toll", "assets/audio/toll.wav");
    }

    create() {

        // Background
        const bg = this.add.image(
            this.scale.width / 2,
            this.scale.height / 2,
            "background"
        );

        bg.setDisplaySize(
            this.scale.width,
            this.scale.height
        );

        // Audio unlock
        this.input.once("pointerdown", () => {
            this.sound.unlock();
        });

        this.index = 0;

        this.asteroids = this.add.group();
        this.labels = this.add.group();
        this.bullets = this.add.group();

        // Ship
        this.ship = this.physics.add.sprite(
            this.scale.width / 2,
            this.scale.height - 80,
            "ship"
        );

        this.ship.setDisplaySize(130, 130);
        this.ship.setCollideWorldBounds(true);

        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();

        this.spaceKey = this.input.keyboard.addKey(32);
        this.spaceKey.on("down", this.shoot, this);

        this.loadRound();
    }

    // ==========================================
    // ROUND SYSTEM
    // ==========================================

    loadRound() {

        this.clearRound();

        if (this.index >= LEVEL1.length) {

            this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                "FERTIG!",
                {
                    fontSize: "60px",
                    color: "#ffffff"
                }
            ).setOrigin(0.5);

            return;
        }

        this.current = LEVEL1[this.index];

        const positions = this.generatePositions(12);

        let i = 0;

        // correct letters
        for (let l of this.current.variants) {
            this.spawnAsteroid(positions[i], l, true);
            i++;
        }

        // wrong letters
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            .split("")
            .filter(l => l !== this.current.target);

        while (i < positions.length) {
            this.spawnAsteroid(
                positions[i],
                Phaser.Utils.Array.GetRandom(alphabet),
                false
            );
            i++;
        }

        // play letter audio
        this.time.delayedCall(400, () => {
            this.sound.play(this.current.target.toLowerCase());
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
    // ASTEROID SPAWN
    // ==========================================

    spawnAsteroid(pos, text, correct) {

        const size = Phaser.Math.Between(70, 110);

        const asteroid = this.physics.add.sprite(
            pos.x,
            pos.y,
            "asteroid"
        );

        asteroid.setDisplaySize(size, size);

        asteroid.setVelocity(
            Phaser.Math.FloatBetween(-50, 50),
            Phaser.Math.FloatBetween(-50, 50)
        );

        asteroid.setBounce(0);
        asteroid.setCollideWorldBounds(false);

        asteroid.correct = correct;
        asteroid.radius = size * 0.45;

        // glow-like effect
        asteroid.setBlendMode(Phaser.BlendModes.ADD);
        asteroid.setAlpha(0.9);

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
    // UPDATE LOOP
    // ==========================================

    update() {

        // ship movement
        if (this.cursors.left.isDown) this.ship.x -= 6;
        if (this.cursors.right.isDown) this.ship.x += 6;

        this.ship.x = Phaser.Math.Clamp(
            this.ship.x,
            60,
            this.scale.width - 60
        );

        // sync labels
        this.asteroids.getChildren().forEach(a => {
            if (a.label) {
                a.label.x = a.x;
                a.label.y = a.y;
            }
        });

        // wrap asteroids (space field)
        this.asteroids.getChildren().forEach(a => {

            if (!a.active) return;

            if (a.x < -50) a.x = this.scale.width + 50;
            if (a.x > this.scale.width + 50) a.x = -50;

            if (a.y < -50) a.y = this.scale.height + 50;
            if (a.y > this.scale.height + 50) a.y = -50;
        });

        // bullets + collisions
        this.bullets.getChildren().forEach(b => {

            if (b.y < -50) {
                b.destroy();
                return;
            }

            this.asteroids.getChildren().forEach(a => {

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

                        a.label.destroy();
                        a.destroy();

                        const remaining = this.asteroids
                            .getChildren()
                            .filter(x => x.correct);

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