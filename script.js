"use strict";

// ==========================================
// CONFIGURACIÓN GENERAL
// ==========================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const statusElement = document.getElementById("status");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const musicButton = document.getElementById("musicButton");
const startOverlay = document.getElementById("startOverlay");

const backgroundMusic = document.getElementById("backgroundMusic");
const screamerAudio = document.getElementById("screamerAudio");

const W = canvas.width;
const H = canvas.height;
const TOTAL_CREATURES = 25;

const rand = (min, max) => Math.random() * (max - min) + min;
const choose = array => array[Math.floor(Math.random() * array.length)];

let creatures = [];
let score = 0;
let gameRunning = false;
let musicEnabled = false;
let lastTime = 0;
let animationId = null;

// ==========================================
// AUDIO
// ==========================================

backgroundMusic.volume = 0.25;
screamerAudio.volume = 0.65;

async function startMusic() {
    try {
        await backgroundMusic.play();
        musicEnabled = true;
        musicButton.textContent = "♫ SILENCIAR MÚSICA";
    } catch (error) {
        console.warn("No se pudo reproducir la música:", error);
        musicEnabled = false;
        musicButton.textContent = "♫ ACTIVAR MÚSICA";
    }
}

function stopMusic() {
    backgroundMusic.pause();
    musicEnabled = false;
    musicButton.textContent = "♫ ACTIVAR MÚSICA";
}

musicButton.addEventListener("click", () => {
    if (musicEnabled) {
        stopMusic();
    } else {
        startMusic();
    }
});

function playScreamerSound() {
    screamerAudio.pause();
    screamerAudio.currentTime = 0;

    screamerAudio.play().catch(error => {
        console.warn("No se pudo reproducir el grito.", error);
    });
}

// ==========================================
// CLASE DE LAS CRIATURAS
// ==========================================

class Creature {
    constructor() {
        this.respawn(true);
    }

    respawn(initial = false) {
        this.x = rand(10, W - 10);
        this.y = rand(30, H - 10);

        this.size = rand(5, 8);
        this.radius = this.size * 0.8;

        this.type = choose([
            "ghost",
            "pumpkin",
            "bat",
            "zombie",
            "cat"
        ]);

        this.color = choose({
            ghost: ["#e7e1ff", "#b8f5ed", "#e8c8ff"],
            pumpkin: ["#ff8738", "#ffb347", "#df6225"],
            bat: ["#8e75c9", "#b29ae9", "#7061a8"],
            zombie: ["#78c76a", "#91b96b", "#65a85e"],
            cat: ["#c4b8a5", "#d5d0c8", "#9f91a8"]
        }[this.type]);

        this.originalColor = this.color;

        const angle = rand(0, Math.PI * 2);
        const speed = rand(12, 27);

        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.mode = choose(["normal", "diagonal", "circular"]);
        this.phase = rand(0, Math.PI * 2);
        this.age = 0;
        this.life = rand(8, 22);
        this.flash = 0;
        this.squashed = 0;
    }

    update(dt) {
        this.age += dt;

        if (this.flash > 0) {
            this.flash -= dt;
        }

        if (this.squashed > 0) {
            this.squashed -= dt;

            if (this.squashed <= 0) {
                this.respawn();
            }

            return;
        }

        if (this.mode === "circular") {
            this.phase += dt * 1.8;
            this.x += Math.cos(this.phase) * 18 * dt;
            this.y += Math.sin(this.phase) * 18 * dt;
        } else {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }

        // Rebote en los límites
        if (this.x < this.radius || this.x > W - this.radius) {
            this.vx *= -1;
            this.x = Math.max(
                this.radius,
                Math.min(W - this.radius, this.x)
            );
        }

        if (this.y < 24 || this.y > H - this.radius) {
            this.vy *= -1;
            this.y = Math.max(
                24,
                Math.min(H - this.radius, this.y)
            );
        }

        // Cambiar de movimiento periódicamente
        if (this.age > this.life) {
            this.mode = choose(["normal", "diagonal", "circular"]);
            this.age = 0;
            this.life = rand(8, 22);

            if (this.mode !== "circular") {
                this.vx = rand(-25, 25);
                this.vy = rand(-25, 25);

                if (Math.abs(this.vx) < 8) this.vx = 12;
                if (Math.abs(this.vy) < 8) this.vy = -12;
            }
        }
    }

    draw() {
        if (this.squashed > 0) {
            ctx.fillStyle = "#f3b5e8";
            ctx.fillRect(
                this.x - this.size,
                this.y,
                this.size * 2,
                2
            );

            ctx.fillStyle = "#fff";
            ctx.fillRect(this.x - 2, this.y, 2, 1);
            return;
        }

        const s = this.size;
        const x = Math.round(this.x);
        const y = Math.round(this.y);

        ctx.save();
        ctx.translate(x, y);

        // Flash azul durante las colisiones
        ctx.fillStyle = this.flash > 0
            ? "#0000ff"
            : this.originalColor;

        if (this.type === "ghost") {
            ctx.fillRect(-s, -s, s * 2, s * 2);
            ctx.fillRect(-s + 2, -s - 2, s * 2 - 4, 2);

            ctx.clearRect(-s + 2, s - 2, 3, 3);
            ctx.clearRect(2, s - 2, 3, 3);

            ctx.fillStyle = "#20172d";
            ctx.fillRect(-s + 2, -2, 2, 3);
            ctx.fillRect(2, -2, 2, 3);

            ctx.fillStyle = "#fff";
            ctx.fillRect(-s + 3, -2, 1, 1);
            ctx.fillRect(3, -2, 1, 1);
        }

        if (this.type === "pumpkin") {
            ctx.fillRect(-s, -s + 2, s * 2, s * 2 - 2);
            ctx.fillRect(-s + 2, -s, s * 2 - 4, s * 2);

            ctx.fillStyle = "#496b38";
            ctx.fillRect(-1, -s - 3, 3, 4);

            ctx.fillStyle = "#21132b";
            ctx.fillRect(-s + 2, -2, 3, 3);
            ctx.fillRect(2, -2, 3, 3);
            ctx.fillRect(-2, 3, 4, 2);
        }

        if (this.type === "bat") {
            ctx.fillRect(-s, -2, s * 2, s);
            ctx.fillRect(-s - 4, -s, 4, s);
            ctx.fillRect(s, -s, 4, s);
            ctx.fillRect(-s + 1, -s - 2, 3, 3);
            ctx.fillRect(s - 4, -s - 2, 3, 3);

            ctx.fillStyle = "#ff6b6b";
            ctx.fillRect(-3, -1, 2, 2);
            ctx.fillRect(2, -1, 2, 2);
        }

        if (this.type === "zombie") {
            ctx.fillRect(-s + 1, -s, s * 2 - 2, s * 2);
            ctx.fillRect(-s - 2, -s + 2, 3, s);
            ctx.fillRect(s - 1, -s + 2, 3, s);

            ctx.fillStyle = "#20252a";
            ctx.fillRect(-s + 2, -2, 3, 2);
            ctx.fillRect(2, -2, 3, 2);
            ctx.fillRect(-2, 3, 4, 2);
        }

        if (this.type === "cat") {
            ctx.fillRect(-s, -s + 2, s * 2, s * 2 - 2);
            ctx.fillRect(-s, -s - 3, 3, 5);
            ctx.fillRect(s - 3, -s - 3, 3, 5);

            ctx.fillStyle = "#1d1724";
            ctx.fillRect(-s + 2, -1, 2, 2);
            ctx.fillRect(2, -1, 2, 2);

            ctx.fillStyle = "#f4a6b8";
            ctx.fillRect(-1, 2, 2, 2);
        }

        ctx.restore();
    }

    squash() {
        if (this.squashed > 0) return;

        this.squashed = 0.25;
        score++;
        scoreElement.textContent = score;
    }
}

// ==========================================
// CREAR LAS CRIATURAS
// ==========================================

function createCreatures() {
    creatures = [];

    for (let i = 0; i < TOTAL_CREATURES; i++) {
        creatures.push(new Creature());
    }

    for (const creature of creatures) {
        creature.x = rand(8, W - 8);
        creature.y = rand(28, H - 8);
    }
}

// ==========================================
// FONDO PIXEL ART: CEMENTERIO NOCTURNO
// ==========================================

function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#08091b");
    sky.addColorStop(0.55, "#17112c");
    sky.addColorStop(1, "#30203b");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Luna pixelada
    ctx.fillStyle = "#bcb4e6";
    ctx.fillRect(244, 13, 18, 18);

    ctx.fillStyle = "#e8e2ff";
    ctx.fillRect(247, 10, 12, 22);
    ctx.fillRect(242, 15, 20, 12);

    ctx.fillStyle = "#9d95c5";
    ctx.fillRect(253, 13, 3, 3);
    ctx.fillRect(247, 24, 4, 3);

    // Estrellas
    ctx.fillStyle = "#eee3ff";

    for (let i = 0; i < 35; i++) {
        const sx = (i * 47 + 13) % W;
        const sy = (i * 23 + 7) % 65;
        const size = i % 4 === 0 ? 2 : 1;

        ctx.fillRect(sx, sy, size, size);
    }

    // Montañas
    ctx.fillStyle = "#17142a";
    ctx.beginPath();
    ctx.moveTo(0, 76);
    ctx.lineTo(35, 48);
    ctx.lineTo(65, 76);
    ctx.lineTo(100, 42);
    ctx.lineTo(140, 76);
    ctx.lineTo(190, 53);
    ctx.lineTo(230, 78);
    ctx.lineTo(280, 45);
    ctx.lineTo(320, 73);
    ctx.lineTo(320, 120);
    ctx.lineTo(0, 120);
    ctx.closePath();
    ctx.fill();

    // Suelo
    ctx.fillStyle = "#201a2b";
    ctx.fillRect(0, 104, W, H - 104);

    ctx.fillStyle = "#32223a";
    ctx.fillRect(0, 105, W, 3);

    // Tumbas
    for (let i = 0; i < 9; i++) {
        const x = i * 39 + 4;
        const y = 91 + (i % 3) * 9;

        ctx.fillStyle = "#51445d";
        ctx.fillRect(x, y, 15, 14);
        ctx.fillRect(x + 3, y - 4, 9, 4);

        ctx.fillStyle = "#74647b";
        ctx.fillRect(x + 3, y + 2, 2, 9);

        ctx.fillStyle = "#30273c";
        ctx.fillRect(x + 7, y + 3, 2, 8);
    }

    // Cruces
    for (let i = 0; i < 4; i++) {
        const x = 20 + i * 88;
        const y = 77 + (i % 2) * 13;

        ctx.fillStyle = "#887a91";
        ctx.fillRect(x + 4, y, 3, 18);
        ctx.fillRect(x, y + 4, 11, 3);
    }

    drawTree(15, 76);
    drawTree(298, 69);
}

function drawTree(x, y) {
    ctx.fillStyle = "#17121d";
    ctx.fillRect(x, y, 5, 43);
    ctx.fillRect(x - 7, y + 5, 8, 4);
    ctx.fillRect(x - 10, y - 2, 4, 10);
    ctx.fillRect(x + 4, y + 7, 11, 4);
    ctx.fillRect(x + 11, y + 2, 4, 9);
    ctx.fillRect(x - 5, y + 18, 12, 4);
}

// ==========================================
// SCREAMER
// ==========================================

const screamer = {
    active: false,
    timer: 0,
    nextIn: rand(8, 15)
};

function updateScreamer(dt) {
    if (!gameRunning) return;

    if (screamer.active) {
        screamer.timer -= dt;

        if (screamer.timer <= 0) {
            screamer.active = false;
            screamer.nextIn = rand(8, 17);

            screamerAudio.pause();
            screamerAudio.currentTime = 0;
        }

        return;
    }

    screamer.nextIn -= dt;

    if (screamer.nextIn <= 0) {
        screamer.active = true;
        screamer.timer = 0.9;
        playScreamerSound();
    }
}

function drawScreamer() {
    if (!screamer.active) return;

    // Destello rojo
    ctx.fillStyle = "rgba(130, 0, 10, 0.82)";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W / 2, H / 2);

    const shake = Math.random() * 4 - 2;
    ctx.translate(shake, shake);

    // Sombra
    ctx.fillStyle = "#13050c";
    ctx.fillRect(-65, -68, 130, 136);

    // Cabeza
    ctx.fillStyle = "#e9ded7";
    ctx.fillRect(-48, -59, 96, 112);
    ctx.fillRect(-58, -39, 116, 75);
    ctx.fillRect(-38, -66, 76, 9);

    // Sombras de la cara
    ctx.fillStyle = "#9e8c99";
    ctx.fillRect(-38, -49, 19, 9);
    ctx.fillRect(19, -49, 19, 9);
    ctx.fillRect(-48, 26, 13, 13);
    ctx.fillRect(35, 26, 13, 13);

    // Ojos
    ctx.fillStyle = "#14040c";
    ctx.fillRect(-38, -24, 26, 30);
    ctx.fillRect(12, -24, 26, 30);

    ctx.fillStyle = "#ff102d";
    ctx.fillRect(-31, -17, 13, 16);
    ctx.fillRect(19, -17, 13, 16);

    ctx.fillStyle = "#fff1f1";
    ctx.fillRect(-28, -15, 5, 5);
    ctx.fillRect(22, -15, 5, 5);

    // Nariz
    ctx.fillStyle = "#57404d";
    ctx.fillRect(-5, 7, 10, 13);
    ctx.fillRect(-10, 16, 20, 5);

    // Boca abierta
    ctx.fillStyle = "#21020b";
    ctx.fillRect(-29, 25, 58, 27);
    ctx.fillRect(-23, 20, 46, 5);

    // Dientes
    ctx.fillStyle = "#fff3e7";
    ctx.fillRect(-23, 25, 8, 9);
    ctx.fillRect(-8, 25, 8, 9);
    ctx.fillRect(8, 25, 8, 9);
    ctx.fillRect(19, 25, 5, 9);

    // Lengua
    ctx.fillStyle = "#d42b55";
    ctx.fillRect(-9, 42, 19, 6);

    ctx.restore();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("¡¡¡TE ENCONTRÉ!!!", W / 2, 15);
}

// ==========================================
// COLISIONES ENTRE CRIATURAS
// ==========================================

function checkCollisions() {
    for (let i = 0; i < creatures.length; i++) {
        const a = creatures[i];

        if (a.squashed > 0) continue;

        for (let j = i + 1; j < creatures.length; j++) {
            const b = creatures[j];

            if (b.squashed > 0) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.hypot(dx, dy);
            const minDistance = a.radius + b.radius;

            if (distance < minDistance && distance > 0) {
                const overlap = (minDistance - distance) / 2;
                const nx = dx / distance;
                const ny = dy / distance;

                a.x -= nx * overlap;
                a.y -= ny * overlap;
                b.x += nx * overlap;
                b.y += ny * overlap;

                const relativeVelocity =
                    (b.vx - a.vx) * nx +
                    (b.vy - a.vy) * ny;

                if (relativeVelocity < 0) {
                    a.vx += relativeVelocity * nx;
                    a.vy += relativeVelocity * ny;
                    b.vx -= relativeVelocity * nx;
                    b.vy -= relativeVelocity * ny;
                }

                a.flash = 0.16;
                b.flash = 0.16;
            }
        }
    }
}

// ==========================================
// ACTUALIZACIÓN Y DIBUJO
// ==========================================

function update(dt) {
    for (const creature of creatures) {
        creature.update(dt);
    }

    checkCollisions();
    updateScreamer(dt);
}

function drawScene() {
    drawBackground();

    for (const creature of creatures) {
        creature.draw();
    }

    drawScreamer();
}

// ==========================================
// BUCLE PRINCIPAL
// ==========================================

function gameLoop(timestamp) {
    if (!gameRunning) return;

    const dt = lastTime === 0
        ? 0
        : Math.min((timestamp - lastTime) / 1000, 0.04);

    lastTime = timestamp;

    update(dt);
    drawScene();

    animationId = requestAnimationFrame(gameLoop);
}

// ==========================================
// INICIAR Y REINICIAR
// ==========================================

function startGame() {
    if (gameRunning) return;

    gameRunning = true;
    startOverlay.classList.add("hidden");
    statusElement.textContent = "¡ATRAPA LAS CRIATURAS!";

    lastTime = 0;
    animationId = requestAnimationFrame(gameLoop);
}

function restartGame() {
    gameRunning = false;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    score = 0;
    scoreElement.textContent = score;

    screamer.active = false;
    screamer.timer = 0;
    screamer.nextIn = rand(8, 15);

    screamerAudio.pause();
    screamerAudio.currentTime = 0;

    createCreatures();
    drawScene();

    startOverlay.classList.remove("hidden");
    statusElement.textContent = "PRESIONA INICIAR";
    startButton.textContent = "▶ INICIAR JUEGO";

    lastTime = 0;
}

startButton.addEventListener("click", async () => {
    startGame();

    if (!musicEnabled) {
        await startMusic();
    }
});

restartButton.addEventListener("click", () => {
    restartGame();
});

// ==========================================
// ATRAPAR CRIATURAS CON EL MOUSE
// ==========================================

canvas.addEventListener("pointerdown", event => {
    if (!gameRunning || screamer.active) return;

    const rect = canvas.getBoundingClientRect();

    const mouseX =
        (event.clientX - rect.left) * (W / rect.width);

    const mouseY =
        (event.clientY - rect.top) * (H / rect.height);

    for (let i = creatures.length - 1; i >= 0; i--) {
        const creature = creatures[i];

        if (creature.squashed > 0) continue;

        const dx = mouseX - creature.x;
        const dy = mouseY - creature.y;
        const distance = Math.hypot(dx, dy);

        if (distance <= creature.radius + 4) {
            creature.squash();
            break;
        }
    }
});

// ==========================================
// INICIALIZACIÓN
// ==========================================

createCreatures();
drawScene();