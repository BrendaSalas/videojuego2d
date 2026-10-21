
"use strict";

// =============================================
// CONFIGURACIÓN
// =============================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const remainingElement = document.getElementById("remaining");
const startMessage = document.getElementById("startMessage");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const musicButton = document.getElementById("musicButton");

const backgroundMusic = document.getElementById("backgroundMusic");
const screamerAudio = document.getElementById("screamerAudio");

const W = 320;
const H = 180;
const TOTAL = 25;
const SCALE = 3;

let creatures = [];
let score = 0;
let gameRunning = false;
let lastTime = 0;

let mouse = { x: 0, y: 0, inside: false };
let musicEnabled = false;

backgroundMusic.volume = 0.25;
screamerAudio.volume = 0.5;

// Canvas interno de resolución pixel art.
canvas.width = W * SCALE;
canvas.height = H * SCALE;

let screamer = {
    active: false,
    timer: 0,
    nextIn: 45
};

// =============================================
// FUNCIONES AUXILIARES
// =============================================

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function choose(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function rect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(
        Math.round(x),
        Math.round(y),
        Math.round(width),
        Math.round(height)
    );
}

// Ajustar el tamaño visible sin cambiar las coordenadas internas.
function resizeCanvas() {
    const frame = canvas.parentElement;
    const availableWidth = frame.clientWidth;
    const availableHeight = frame.clientHeight;

    if (!availableWidth || !availableHeight) return;

    const aspect = W / H;
    let displayWidth = availableWidth;
    let displayHeight = displayWidth / aspect;

    if (displayHeight > availableHeight) {
        displayHeight = availableHeight;
        displayWidth = displayHeight * aspect;
    }

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);

// =============================================
// FONDO DEL CEMENTERIO
// =============================================

function drawBackground() {
    rect(0, 0, W, H, "#101329");
    rect(0, 0, W, 70, "#17152f");
    rect(0, 65, W, 45, "#20203c");

    // Luna.
    rect(244, 16, 24, 24, "#e9e4c8");
    rect(240, 21, 24, 16, "#e9e4c8");
    rect(249, 12, 15, 32, "#e9e4c8");
    rect(258, 17, 9, 8, "#c6c4bc");
    rect(254, 29, 7, 6, "#c6c4bc");

    // Estrellas.
    for (let i = 0; i < 35; i++) {
        const x = (i * 47 + 13) % W;
        const y = (i * 29 + 5) % 62;

        rect(
            x,
            y,
            i % 4 === 0 ? 2 : 1,
            i % 4 === 0 ? 2 : 1,
            i % 3 === 0 ? "#ff83c5" : "#d8d8f4"
        );
    }

    // Nubes.
    rect(22, 21, 34, 7, "#24223f");
    rect(30, 15, 19, 8, "#24223f");
    rect(68, 39, 28, 6, "#201d39");
    rect(76, 34, 15, 7, "#201d39");
    rect(177, 26, 33, 6, "#24223f");
    rect(185, 21, 16, 6, "#24223f");

    // Montañas.
    rect(0, 68, W, 25, "#171b31");

    for (let i = 0; i < 8; i++) {
        const x = i * 45 - 10;
        rect(x + 8, 62, 20, 10, "#171b31");
        rect(x, 72, 38, 14, "#171b31");
    }

    // Árboles lejanos.
    for (let i = 0; i < 7; i++) {
        const x = i * 52 - 6;

        rect(x + 10, 49, 5, 49, "#101522");
        rect(x + 1, 48, 22, 8, "#101522");
        rect(x + 4, 39, 16, 10, "#101522");
        rect(x + 8, 32, 8, 9, "#101522");
    }

    // Suelo y camino.
    rect(0, 91, W, 89, "#20252d");
    rect(0, 97, W, 83, "#292c35");
    rect(0, 105, W, 75, "#303039");

    rect(128, 92, 61, 88, "#49434a");
    rect(136, 92, 45, 88, "#514750");

    rect(143, 97, 4, 8, "#645664");
    rect(163, 110, 5, 5, "#645664");
    rect(148, 128, 6, 4, "#645664");
    rect(168, 151, 5, 5, "#645664");

    // Charcos.
    rect(18, 136, 35, 7, "#191e29");
    rect(24, 133, 22, 3, "#3a4148");
    rect(220, 157, 39, 6, "#191e29");
    rect(226, 154, 23, 3, "#42404b");

    // Lápidas.
    drawGrave(24, 96, "#696575");
    drawGrave(66, 111, "#5a5968");
    drawGrave(218, 102, "#666071");
    drawGrave(272, 118, "#575567");
    drawGrave(102, 91, "#4b4d60");

    drawCross(12, 105);
    drawCross(246, 93);
    drawDeadTree(8, 89);
    drawDeadTree(300, 91);

    drawFence(0, 124, 5);
    drawFence(263, 130, 4);

    drawPumpkin(54, 151, 0.8);
    drawPumpkin(288, 145, 0.9);

    for (let i = 0; i < 45; i++) {
        const x = (i * 37 + 11) % W;
        const y = 113 + ((i * 19) % 62);

        rect(x, y, 2, 4, i % 2 ? "#54634b" : "#68714c");
    }

    rect(0, 163, 48, 4, "#42404d");
    rect(42, 167, 56, 3, "#42404d");
    rect(217, 166, 55, 4, "#42404d");
    rect(270, 162, 50, 3, "#42404d");
}

function drawGrave(x, y, color) {
    rect(x, y + 8, 27, 20, "#171923");
    rect(x + 2, y + 3, 23, 21, color);
    rect(x + 6, y, 15, 8, color);
    rect(x + 9, y - 3, 9, 7, color);
    rect(x + 5, y + 7, 17, 2, "#8d8797");
    rect(x + 12, y + 12, 3, 7, "#373545");
    rect(x + 8, y + 21, 13, 3, "#3c3b49");
}

function drawCross(x, y) {
    rect(x + 7, y, 5, 26, "#777080");
    rect(x, y + 7, 19, 5, "#777080");
    rect(x + 8, y + 1, 2, 23, "#a29aaa");
}

function drawDeadTree(x, y) {
    rect(x + 9, y + 8, 5, 48, "#27222e");
    rect(x + 2, y + 17, 9, 4, "#27222e");
    rect(x, y + 8, 4, 12, "#27222e");
    rect(x + 12, y + 23, 12, 4, "#27222e");
    rect(x + 21, y + 14, 4, 12, "#27222e");
    rect(x + 5, y + 3, 4, 13, "#27222e");
}

function drawFence(x, y, posts) {
    rect(x, y + 8, posts * 8, 3, "#48404e");
    rect(x, y + 18, posts * 8, 3, "#48404e");

    for (let i = 0; i < posts; i++) {
        rect(x + i * 8, y, 3, 22, "#655568");
        rect(x + i * 8 - 1, y, 5, 4, "#88718a");
    }
}

function drawPumpkin(x, y, scale = 1) {
    const s = scale;

    rect(x, y + 3 * s, 15 * s, 10 * s, "#d96c32");
    rect(x + 3 * s, y, 9 * s, 16 * s, "#f18a38");
    rect(x + 6 * s, y - 2 * s, 4 * s, 4 * s, "#4b7044");

    rect(x + 3 * s, y + 6 * s, 3 * s, 3 * s, "#292036");
    rect(x + 10 * s, y + 6 * s, 3 * s, 3 * s, "#292036");
    rect(x + 6 * s, y + 10 * s, 5 * s, 2 * s, "#292036");
}

// =============================================
// CLASE CREATURE
// =============================================

class Creature {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;

        // Tamaños más pequeños.
        this.size = random(4.5, 7);
        this.speed = random(18, 34);

        this.dx = choose([-1, 1]) * this.speed;
        this.dy = choose([-1, 1]) * this.speed;

        this.phase = random(0, Math.PI * 2);
        this.alive = true;
        this.squashTimer = 0;
        this.flashTimer = 0;

        this.baseColor = this.getColor();
    }

    getColor() {
        const palettes = {
            ghost: ["#fff0dc", "#c9f0ef", "#ded0ff", "#f3d9f1"],
            pumpkin: ["#f49a48", "#e77a37", "#ffb45f", "#d96936"],
            bat: ["#8c7aa9", "#625778", "#a48bc2", "#574d71"],
            zombie: ["#a4c98a", "#c0d68b", "#83b98b", "#d1c68d"],
            cat: ["#bcb5b0", "#d5bda7", "#888fa8", "#d8d5ce"]
        };

        return choose(palettes[this.type]);
    }

    update(dt) {
        if (!this.alive) {
            this.squashTimer -= dt;

            if (this.squashTimer <= 0) {
                this.respawn();
            }

            return;
        }

        this.phase += dt * 4;

        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }

        this.x += this.dx * dt;
        this.y += this.dy * dt;

        if (this.x < this.size) {
            this.x = this.size;
            this.dx = Math.abs(this.dx);
        }

        if (this.x > W - this.size) {
            this.x = W - this.size;
            this.dx = -Math.abs(this.dx);
        }

        if (this.y < 53) {
            this.y = 53;
            this.dy = Math.abs(this.dy);
        }

        if (this.y > H - this.size - 2) {
            this.y = H - this.size - 2;
            this.dy = -Math.abs(this.dy);
        }
    }

    draw() {
        if (!this.alive) return;

        const bob = Math.sin(this.phase) * 1.2;
        const x = Math.round(this.x);
        const y = Math.round(this.y + bob);
        const s = this.size;

        const color = this.flashTimer > 0
            ? "#0000ff"
            : this.baseColor;

        rect(x - s + 1, y + s - 1, s * 2 - 1, 2, "#171923");

        switch (this.type) {
            case "ghost":
                this.drawGhost(x, y, s, color);
                break;
            case "pumpkin":
                this.drawCreaturePumpkin(x, y, s, color);
                break;
            case "bat":
                this.drawBat(x, y, s, color);
                break;
            case "zombie":
                this.drawZombie(x, y, s, color);
                break;
            case "cat":
                this.drawCat(x, y, s, color);
                break;
        }
    }

    drawGhost(x, y, s, color) {
        // Cuerpo y borde sombreado.
        rect(x - s + 1, y - s + 1, s * 2 - 2, s * 2, "#a5a6c5");
        rect(x - s + 1, y - s, s * 2 - 2, s * 2 - 1, color);
        rect(x - s + 3, y - s - 2, s * 2 - 6, 4, "#fff7ed");

        // Ondas de la parte inferior.
        rect(x - s + 1, y + s - 3, 3, 4, color);
        rect(x - 2, y + s - 2, 4, 4, color);
        rect(x + s - 4, y + s - 3, 3, 4, color);

        // Ojos y mejillas.
        rect(x - 4, y - 2, 2, 3, "#26243b");
        rect(x + 2, y - 2, 2, 3, "#26243b");
        rect(x - 5, y + 2, 2, 1, "#ff83c5");
        rect(x + 3, y + 2, 2, 1, "#ff83c5");
        rect(x - 1, y + 3, 2, 1, "#a77b94");
    }

    drawCreaturePumpkin(x, y, s, color) {
        // Calabaza redondeada.
        rect(x - s + 2, y - s + 1, s * 2 - 4, s * 2 - 2, "#a84d32");
        rect(x - s + 1, y - s + 2, s * 2 - 2, s * 2 - 4, color);
        rect(x - s + 3, y - s, 3, s * 2, "#ffbc63");
        rect(x + 1, y - s, 3, s * 2, "#e88a3d");

        // Tallo.
        rect(x - 1, y - s - 3, 3, 4, "#7a9955");
        rect(x + 1, y - s - 4, 3, 2, "#a4c98a");

        // Ojos triangulares pixelados y sonrisa.
        rect(x - 4, y - 2, 3, 3, "#38243b");
        rect(x + 2, y - 2, 3, 3, "#38243b");
        rect(x - 3, y + 3, 6, 2, "#38243b");
        rect(x - 1, y + 3, 2, 1, "#ffdb82");
    }

    drawBat(x, y, s, color) {
        // Alas.
        rect(x - s - 2, y - 3, 5, 4, color);
        rect(x - s - 3, y, 4, 4, color);
        rect(x + s - 3, y - 3, 5, 4, color);
        rect(x + s - 1, y, 4, 4, color);

        // Cuerpo.
        rect(x - 3, y - 4, 6, 9, "#393047");
        rect(x - 2, y - 5, 4, 3, color);

        // Orejas.
        rect(x - 3, y - 7, 2, 3, color);
        rect(x + 1, y - 7, 2, 3, color);

        // Ojos brillantes.
        rect(x - 2, y - 2, 1, 2, "#ff83c5");
        rect(x + 1, y - 2, 1, 2, "#ff83c5");
        rect(x - 1, y + 2, 2, 1, "#d7c2ee");
    }

    drawZombie(x, y, s, color) {
        // Cabeza.
        rect(x - s + 1, y - s + 1, s * 2 - 2, s * 2 - 1, "#435d4d");
        rect(x - s + 2, y - s, s * 2 - 4, s * 2 - 1, color);

        // Cabello.
        rect(x - s + 1, y - s - 2, s * 2 - 2, 3, "#51445b");
        rect(x - s + 2, y - s - 4, 3, 3, "#51445b");

        // Ojos.
        rect(x - 4, y - 2, 3, 3, "#303043");
        rect(x + 2, y - 2, 3, 3, "#303043");
        rect(x - 3, y - 1, 1, 1, "#ff83c5");
        rect(x + 3, y - 1, 1, 1, "#fff2ce");

        // Boca y cicatriz.
        rect(x - 3, y + 4, 6, 2, "#38433b");
        rect(x - 5, y + 1, 2, 1, "#6b8058");
        rect(x + 3, y + 5, 2, 1, "#6b8058");
    }

    drawCat(x, y, s, color) {
        // Orejas.
        rect(x - s + 2, y - s - 3, 4, 5, "#665e70");
        rect(x + s - 6, y - s - 3, 4, 5, "#665e70");
        rect(x - s + 3, y - s - 2, 2, 3, "#d58ca8");
        rect(x + s - 5, y - s - 2, 2, 3, "#d58ca8");

        // Cabeza.
        rect(x - s + 1, y - s + 1, s * 2 - 2, s * 2 - 1, "#665e70");
        rect(x - s + 2, y - s + 1, s * 2 - 4, s * 2 - 2, color);

        // Ojos.
        rect(x - 4, y - 2, 3, 3, "#343247");
        rect(x + 2, y - 2, 3, 3, "#343247");
        rect(x - 3, y - 2, 1, 2, "#c4ffd0");
        rect(x + 3, y - 2, 1, 2, "#c4ffd0");

        // Nariz, boca y bigotes.
        rect(x - 1, y + 2, 2, 2, "#e58aa9");
        rect(x - 2, y + 4, 4, 1, "#5c455b");
        rect(x - s - 2, y + 2, 3, 1, "#e8d7d0");
        rect(x + s - 1, y + 2, 3, 1, "#e8d7d0");

        // Cola pixelada.
        rect(x + s - 1, y + 4, 3, 2, color);
        rect(x + s + 1, y + 2, 2, 3, color);
    }

    containsPoint(x, y) {
        if (!this.alive) return false;

        const dx = x - this.x;
        const dy = y - this.y;

        return Math.hypot(dx, dy) < this.size + 3;
    }

    squashCreature() {
        if (!this.alive) return;

        this.alive = false;
        this.squashTimer = 0.45;

        score++;
        updateCounters();
    }

    respawn() {
        this.x = random(10, W - 10);
        this.y = random(55, H - 10);

        this.dx = choose([-1, 1]) * this.speed;
        this.dy = choose([-1, 1]) * this.speed;

        this.alive = true;
        this.flashTimer = 0;
        this.baseColor = this.getColor();
    }

    bounceFrom(other) {
        if (!this.alive || !other.alive) return;

        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const distance = Math.hypot(dx, dy);
        const minDistance = this.size + other.size;

        if (distance >= minDistance || distance === 0) return;

        const nx = dx / distance;
        const ny = dy / distance;

        const overlap = minDistance - distance;

        this.x -= nx * overlap / 2;
        this.y -= ny * overlap / 2;
        other.x += nx * overlap / 2;
        other.y += ny * overlap / 2;

        const relativeX = this.dx - other.dx;
        const relativeY = this.dy - other.dy;
        const velocity = relativeX * nx + relativeY * ny;

        if (velocity > 0) return;

        this.dx -= velocity * nx;
        this.dy -= velocity * ny;
        other.dx += velocity * nx;
        other.dy += velocity * ny;

        this.flashTimer = 0.18;
        other.flashTimer = 0.18;
    }
}

// =============================================
// CREAR CRIATURAS
// =============================================

function createCreatures() {
    const types = ["ghost", "pumpkin", "bat", "zombie", "cat"];

    creatures = [];

    for (let i = 0; i < TOTAL; i++) {
        creatures.push(
            new Creature(
                random(12, W - 12),
                random(55, H - 12),
                types[i % types.length]
            )
        );
    }
}

function updateCounters() {
    scoreElement.textContent = String(score).padStart(2, "0");

    remainingElement.textContent = creatures.filter(
        creature => creature.alive
    ).length;
}

// =============================================
// AUDIO
// =============================================

async function startMusic() {
    try {
        await backgroundMusic.play();
        musicEnabled = true;
        musicButton.textContent = "♫ SILENCIAR MÚSICA";
    } catch (error) {
        console.warn("No se pudo reproducir la música.", error);
    }
}

function stopMusic() {
    backgroundMusic.pause();
    musicEnabled = false;
    musicButton.textContent = "♫ ACTIVAR MÚSICA";
}

function playScreamerSound() {
    screamerAudio.currentTime = 0;
    screamerAudio.play().catch(() => {});
}

musicButton.addEventListener("click", () => {
    if (musicEnabled) {
        stopMusic();
    } else {
        startMusic();
    }
});

// =============================================
// SCREAMER
// =============================================

function resetScreamer() {
    screamer.active = false;
    screamer.timer = 0;
    screamer.nextIn = random(45, 75);

    screamerAudio.pause();
    screamerAudio.currentTime = 0;
}

function updateScreamer(dt) {
    if (!gameRunning) return;

    if (screamer.active) {
        screamer.timer -= dt;

        if (screamer.timer <= 0) {
            screamer.active = false;
            screamer.nextIn = random(45, 75);
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

    ctx.save();

    ctx.globalAlpha = 0.45;
    rect(0, 0, W, H, "#8e123e");
    ctx.globalAlpha = 1;

    const cx = W / 2;
    const cy = H / 2;

    rect(cx - 38, cy - 43, 76, 86, "#171020");
    rect(cx - 30, cy - 37, 60, 72, "#d8d1cf");
    rect(cx - 35, cy - 25, 70, 43, "#b8b0b7");

    rect(cx - 30, cy - 40, 60, 8, "#201326");
    rect(cx - 35, cy - 30, 9, 45, "#201326");
    rect(cx + 26, cy - 30, 9, 45, "#201326");

    rect(cx - 23, cy - 17, 18, 15, "#230d23");
    rect(cx + 5, cy - 17, 18, 15, "#230d23");
    rect(cx - 18, cy - 13, 7, 7, "#ff315e");
    rect(cx + 10, cy - 13, 7, 7, "#ff315e");

    rect(cx - 4, cy - 2, 8, 11, "#71616e");
    rect(cx - 21, cy + 14, 42, 22, "#240b1b");

    rect(cx - 16, cy + 15, 7, 8, "#fff0d8");
    rect(cx - 4, cy + 15, 7, 8, "#fff0d8");
    rect(cx + 8, cy + 15, 7, 8, "#fff0d8");

    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("¡TE ENCONTRÉ!", cx, 17);

    ctx.restore();
}

// =============================================
// RATÓN Y VARITA
// =============================================

function getCanvasPosition(event) {
    const bounds = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - bounds.left) / bounds.width * W,
        y: (event.clientY - bounds.top) / bounds.height * H
    };
}

canvas.addEventListener("mousemove", event => {
    const position = getCanvasPosition(event);

    mouse.x = position.x;
    mouse.y = position.y;
    mouse.inside = true;
});

canvas.addEventListener("mouseenter", () => {
    mouse.inside = true;
});

canvas.addEventListener("mouseleave", () => {
    mouse.inside = false;
});

canvas.addEventListener("click", event => {
    if (!gameRunning) return;

    const position = getCanvasPosition(event);

    for (let i = creatures.length - 1; i >= 0; i--) {
        if (creatures[i].containsPoint(position.x, position.y)) {
            creatures[i].squashCreature();
            break;
        }
    }
});

function drawCustomCursor(x, y) {
    rect(x - 1, y - 7, 3, 14, "#f4e8ce");
    rect(x - 2, y - 9, 5, 4, "#ff83c5");
    rect(x, y - 12, 2, 2, "#fff2ce");
    rect(x + 5, y - 7, 2, 2, "#9dffb0");
    rect(x - 6, y - 3, 2, 2, "#9d6bff");
}

// =============================================
// CICLO DEL JUEGO
// =============================================

function update(dt) {
    if (!gameRunning) return;

    creatures.forEach(creature => creature.update(dt));

    for (let i = 0; i < creatures.length; i++) {
        for (let j = i + 1; j < creatures.length; j++) {
            creatures[i].bounceFrom(creatures[j]);
        }
    }

    updateScreamer(dt);
}

function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(SCALE, SCALE);

    drawBackground();
    creatures.forEach(creature => creature.draw());
    drawScreamer();

    if (mouse.inside) {
        drawCustomCursor(mouse.x, mouse.y);
    }

    ctx.restore();
}

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.05);
    lastTime = timestamp;

    update(dt);
    drawScene();

    requestAnimationFrame(gameLoop);
}

// =============================================
// INICIAR Y REINICIAR
// =============================================

function startGame() {
    if (gameRunning) return;

    gameRunning = true;
    startMessage.style.display = "none";
    lastTime = performance.now();

    if (!musicEnabled) {
        startMusic();
    }
}

function restartGame() {
    score = 0;

    createCreatures();
    updateCounters();
    resetScreamer();

    gameRunning = true;
    startMessage.style.display = "none";
    lastTime = performance.now();
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);

// =============================================
// INICIALIZACIÓN
// =============================================

createCreatures();
updateCounters();
resizeCanvas();
drawScene();

requestAnimationFrame(gameLoop);
