
"use strict";

// =====================================================
// CEMENTERIO PIXEL - CONFIGURACIÓN GENERAL
// =====================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const remainingElement = document.getElementById("remaining");
const startMessage = document.getElementById("startMessage");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const musicButton = document.getElementById("musicButton");
const gameStatus = document.getElementById("gameStatus");

const backgroundMusic = document.getElementById("backgroundMusic");
const screamerAudio = document.getElementById("screamerAudio");
const screamerOverlay = document.getElementById("screamerOverlay");

const WIDTH = 960;
const HEIGHT = 540;
const TARGET_CREATURES = 25;

canvas.width = WIDTH;
canvas.height = HEIGHT;

let score = 0;
let gameStarted = false;
let gameRunning = false;
let musicEnabled = false;
let animationFrame = null;
let lastFrameTime = 0;
let nextScreamerTime = 0;
let screamerActive = false;
let screamerTimeout = null;
let lastScreamerAt = 0;

let creatures = [];
let particles = [];
let backgroundImage = new Image();
let backgroundLoaded = false;

// =====================================================
// FONDO DEL CEMENTERIO
// =====================================================

backgroundImage.src = "cementerio.png";

backgroundImage.onload = () => {
    backgroundLoaded = true;
};

backgroundImage.onerror = () => {
    backgroundLoaded = false;
    console.warn(
        "No se encontró cementerio.png. Se utilizará el fondo dibujado."
    );
};

function drawBackground() {
    if (backgroundLoaded) {
        const imageRatio = backgroundImage.width / backgroundImage.height;
        const canvasRatio = WIDTH / HEIGHT;

        let drawWidth;
        let drawHeight;
        let offsetX;
        let offsetY;

        if (imageRatio > canvasRatio) {
            drawHeight = HEIGHT;
            drawWidth = HEIGHT * imageRatio;
            offsetX = (WIDTH - drawWidth) / 2;
            offsetY = 0;
        } else {
            drawWidth = WIDTH;
            drawHeight = WIDTH / imageRatio;
            offsetX = 0;
            offsetY = (HEIGHT - drawHeight) / 2;
        }

        ctx.drawImage(
            backgroundImage,
            offsetX,
            offsetY,
            drawWidth,
            drawHeight
        );

        // Oscurecer el fondo para dar ambiente nocturno.
        ctx.fillStyle = "rgba(8, 6, 24, 0.43)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    } else {
        drawFallbackBackground();
    }

    drawFog();
    drawVignette();
}

function drawFallbackBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, "#11152c");
    gradient.addColorStop(0.55, "#28203a");
    gradient.addColorStop(1, "#080b13");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Luna
    ctx.fillStyle = "#ded9ef";
    ctx.beginPath();
    ctx.arc(775, 92, 37, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#bcb4d8";
    ctx.beginPath();
    ctx.arc(790, 80, 33, 0, Math.PI * 2);
    ctx.fill();

    // Estrellas
    for (let i = 0; i < 45; i++) {
        const x = (i * 137 + 43) % WIDTH;
        const y = (i * 61 + 17) % 250;

        ctx.fillStyle = i % 3 === 0 ? "#e5c9ff" : "#aaa9d2";
        ctx.fillRect(x, y, i % 4 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2);
    }

    // Siluetas de árboles.
    for (let i = 0; i < 9; i++) {
        const x = i * 125 + 10;
        const treeHeight = 130 + (i % 3) * 28;

        ctx.fillStyle = "#11131e";
        ctx.fillRect(x, HEIGHT - treeHeight, 12, treeHeight);

        ctx.beginPath();
        ctx.moveTo(x - 42, HEIGHT - treeHeight + 65);
        ctx.lineTo(x + 6, HEIGHT - treeHeight - 25);
        ctx.lineTo(x + 51, HEIGHT - treeHeight + 65);
        ctx.closePath();
        ctx.fill();
    }

    // Suelo
    ctx.fillStyle = "#171b24";
    ctx.fillRect(0, 390, WIDTH, 150);

    // Lápidas
    for (let i = 0; i < 8; i++) {
        const x = i * 132 + 20;
        const y = 410 + (i % 2) * 30;

        ctx.fillStyle = "#3c3d50";
        ctx.fillRect(x, y, 48, 70);
        ctx.fillRect(x + 8, y - 10, 32, 10);

        ctx.fillStyle = "#5b5b70";
        ctx.fillRect(x + 7, y + 9, 3, 42);

        ctx.fillStyle = "#9691ae";
        ctx.fillRect(x + 18, y + 17, 12, 3);
        ctx.fillRect(x + 22, y + 13, 4, 12);
    }
}

function drawFog() {
    const fog = ctx.createLinearGradient(0, 360, 0, HEIGHT);
    fog.addColorStop(0, "rgba(119, 111, 163, 0)");
    fog.addColorStop(0.55, "rgba(113, 103, 145, 0.09)");
    fog.addColorStop(1, "rgba(151, 129, 174, 0.13)");

    ctx.fillStyle = fog;
    ctx.fillRect(0, 330, WIDTH, 210);
}

function drawVignette() {
    const gradient = ctx.createRadialGradient(
        WIDTH / 2,
        HEIGHT / 2,
        80,
        WIDTH / 2,
        HEIGHT / 2,
        610
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 8, 0.48)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

// =====================================================
// UTILIDADES
// =====================================================

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function distanceBetween(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

function updateScore() {
    scoreElement.textContent = score;
    remainingElement.textContent = creatures.filter(
        creature => !creature.squashing && !creature.dead
    ).length;
}

// =====================================================
// PARTÍCULAS MÁGICAS
// =====================================================

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = random(-2.4, 2.4);
        this.vy = random(-3, 1.2);
        this.life = random(18, 38);
        this.maxLife = this.life;
        this.size = randomInt(2, 5);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.035;
        this.life--;
    }

    draw() {
        if (this.life <= 0) return;

        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.fillRect(
            Math.round(this.x),
            Math.round(this.y),
            this.size,
            this.size
        );
        ctx.globalAlpha = 1;
    }
}

function createParticles(x, y, color, amount = 12) {
    for (let i = 0; i < amount; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// =====================================================
// CRIATURAS
// =====================================================

const CREATURE_TYPES = ["ghost", "pumpkin", "bat", "zombie", "cat"];

const PALETTES = {
    ghost: ["#e8e1ff", "#d7ccf6", "#fff0f8", "#bba7e8"],
    pumpkin: ["#f59a45", "#ffb957", "#dc6b37", "#ffcf76"],
    bat: ["#7566a7", "#a99ad9", "#53466e", "#d8c6ff"],
    zombie: ["#80a96d", "#a4c58a", "#4b6e4c", "#c5d9a5"],
    cat: ["#d5a1c4", "#f2c4dc", "#a976b0", "#f9d9e9"]
};

class Creature {
    constructor(x, y, type, size, color, speedX, speedY) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = size;
        this.color = color;
        this.speedX = speedX;
        this.speedY = speedY;

        this.radius = size * 0.53;
        this.squashing = false;
        this.squashTimer = 0;
        this.dead = false;
        this.animationOffset = random(0, Math.PI * 2);
        this.blinkTimer = randomInt(100, 260);
        this.blinking = false;
        this.hitFlash = 0;
    }

    update(delta) {
        if (this.dead) return;

        if (this.squashing) {
            this.squashTimer -= delta;

            if (this.squashTimer <= 0) {
                this.dead = true;
            }
            return;
        }

        const step = delta / 16.67;

        this.x += this.speedX * step;
        this.y += this.speedY * step;

        // Mantener a las criaturas dentro del área de juego.
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.speedX = Math.abs(this.speedX);
        }

        if (this.x + this.radius > WIDTH) {
            this.x = WIDTH - this.radius;
            this.speedX = -Math.abs(this.speedX);
        }

        if (this.y - this.radius < 145) {
            this.y = 145 + this.radius;
            this.speedY = Math.abs(this.speedY);
        }

        if (this.y + this.radius > HEIGHT - 25) {
            this.y = HEIGHT - 25 - this.radius;
            this.speedY = -Math.abs(this.speedY);
        }

        this.blinkTimer -= step;

        if (this.blinkTimer <= 0) {
            this.blinking = !this.blinking;
            this.blinkTimer = this.blinking ? 7 : randomInt(90, 230);
        }

        if (this.hitFlash > 0) {
            this.hitFlash -= step;
        }
    }

    draw() {
        if (this.dead) return;

        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));

        const bob = this.squashing ? 0 : Math.sin(
            performance.now() * 0.003 + this.animationOffset
        ) * 1.4;

        ctx.translate(0, bob);

        let squashX = 1;
        let squashY = 1;

        if (this.squashing) {
            const progress = Math.max(0, this.squashTimer / 240);
            squashX = 1 + (1 - progress) * 0.48;
            squashY = 0.15 + progress * 0.85;
        }

        ctx.scale(squashX, squashY);

        // Sombra de la criatura.
        ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
        ctx.fillRect(
            -this.size * 0.43,
            this.size * 0.39,
            this.size * 0.86,
            this.size * 0.18
        );

        switch (this.type) {
            case "ghost":
                this.drawGhost();
                break;
            case "pumpkin":
                this.drawPumpkin();
                break;
            case "bat":
                this.drawBat();
                break;
            case "zombie":
                this.drawZombie();
                break;
            case "cat":
                this.drawCat();
                break;
        }

        // Destello al chocar.
        if (this.hitFlash > 0) {
            ctx.globalAlpha = Math.min(0.45, this.hitFlash * 0.1);
            ctx.fillStyle = "#9defff";
            ctx.fillRect(
                -this.size * 0.5,
                -this.size * 0.5,
                this.size,
                this.size
            );
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }

    // -------------------------------------------------
    // FANTASMA
    // -------------------------------------------------

    drawGhost() {
        const u = this.size / 12;

        ctx.fillStyle = "#9d8ec9";
        ctx.fillRect(-4 * u, -4 * u, 8 * u, 7 * u);

        ctx.fillStyle = this.color;
        ctx.fillRect(-4.5 * u, -4.3 * u, 9 * u, 6.8 * u);
        ctx.fillRect(-5 * u, -2.1 * u, 1.2 * u, 2.3 * u);
        ctx.fillRect(3.8 * u, -2.1 * u, 1.2 * u, 2.3 * u);

        // Parte inferior ondulada.
        ctx.fillStyle = "#d7c9f6";
        ctx.fillRect(-4.5 * u, 2 * u, 2 * u, 1 * u);
        ctx.fillRect(-1 * u, 2 * u, 2 * u, 1 * u);
        ctx.fillRect(2.5 * u, 2 * u, 2 * u, 1 * u);

        // Mejillas.
        ctx.fillStyle = "#f8a9cb";
        ctx.fillRect(-3.3 * u, -0.4 * u, 1.1 * u, 0.7 * u);
        ctx.fillRect(2.2 * u, -0.4 * u, 1.1 * u, 0.7 * u);

        // Ojos.
        ctx.fillStyle = "#342647";
        if (!this.blinking) {
            ctx.fillRect(-2.7 * u, -2.2 * u, 1.3 * u, 1.8 * u);
            ctx.fillRect(1.5 * u, -2.2 * u, 1.3 * u, 1.8 * u);

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-2.3 * u, -1.9 * u, 0.4 * u, 0.4 * u);
            ctx.fillRect(1.9 * u, -1.9 * u, 0.4 * u, 0.4 * u);
        } else {
            ctx.fillRect(-2.7 * u, -1.6 * u, 1.3 * u, 0.3 * u);
            ctx.fillRect(1.5 * u, -1.6 * u, 1.3 * u, 0.3 * u);
        }

        // Boca.
        ctx.fillStyle = "#55364e";
        ctx.fillRect(-0.8 * u, 0.1 * u, 1.6 * u, 1.1 * u);

        // Moñito.
        ctx.fillStyle = "#ec91c9";
        ctx.fillRect(-1 * u, -4.9 * u, 1 * u, 1 * u);
        ctx.fillRect(0, -4.9 * u, 1 * u, 1 * u);
        ctx.fillRect(-0.2 * u, -4.6 * u, 0.5 * u, 0.5 * u);

        // Brillo de la cabeza.
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.5;
        ctx.fillRect(-2.8 * u, -3.5 * u, 1.1 * u, 0.4 * u);
        ctx.globalAlpha = 1;
    }

    // -------------------------------------------------
    // CALABAZA
    // -------------------------------------------------

    drawPumpkin() {
        const u = this.size / 12;

        // Tallo.
        ctx.fillStyle = "#567f49";
        ctx.fillRect(-0.9 * u, -5.5 * u, 1.8 * u, 2 * u);
        ctx.fillRect(-0.2 * u, -6 * u, 1.1 * u, 1 * u);

        // Cuerpo y segmentos.
        ctx.fillStyle = "#bd622f";
        ctx.fillRect(-4.6 * u, -3.8 * u, 9.2 * u, 7.2 * u);

        ctx.fillStyle = this.color;
        ctx.fillRect(-3.8 * u, -4.3 * u, 7.6 * u, 7.1 * u);
        ctx.fillRect(-4.7 * u, -2.5 * u, 1.2 * u, 4.3 * u);
        ctx.fillRect(3.5 * u, -2.5 * u, 1.2 * u, 4.3 * u);

        ctx.fillStyle = "#ffc86c";
        ctx.fillRect(-2.6 * u, -3.7 * u, 1 * u, 5.8 * u);
        ctx.fillRect(1.6 * u, -3.7 * u, 1 * u, 5.8 * u);

        // Ojos triangulares.
        ctx.fillStyle = "#ffef9a";
        ctx.beginPath();
        ctx.moveTo(-3 * u, -2 * u);
        ctx.lineTo(-1 * u, -1 * u);
        ctx.lineTo(-3 * u, 0);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(3 * u, -2 * u);
        ctx.lineTo(1 * u, -1 * u);
        ctx.lineTo(3 * u, 0);
        ctx.closePath();
        ctx.fill();

        // Boca sonriente.
        ctx.fillStyle = "#4a2631";
        ctx.fillRect(-2.7 * u, 0.8 * u, 5.4 * u, 1.3 * u);
        ctx.fillRect(-1.9 * u, 0.2 * u, 1 * u, 0.7 * u);
        ctx.fillRect(0.9 * u, 0.2 * u, 1 * u, 0.7 * u);

        ctx.fillStyle = "#fff0b5";
        ctx.fillRect(-1.2 * u, 0.8 * u, 0.8 * u, 0.5 * u);
        ctx.fillRect(0.5 * u, 0.8 * u, 0.8 * u, 0.5 * u);
    }

    // -------------------------------------------------
    // MURCIÉLAGO
    // -------------------------------------------------

    drawBat() {
        const u = this.size / 12;

        // Alas.
        ctx.fillStyle = "#332b4e";

        ctx.beginPath();
        ctx.moveTo(-1 * u, -1 * u);
        ctx.lineTo(-6 * u, -4 * u);
        ctx.lineTo(-5 * u, -1 * u);
        ctx.lineTo(-6 * u, 2 * u);
        ctx.lineTo(-2 * u, 1.5 * u);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(1 * u, -1 * u);
        ctx.lineTo(6 * u, -4 * u);
        ctx.lineTo(5 * u, -1 * u);
        ctx.lineTo(6 * u, 2 * u);
        ctx.lineTo(2 * u, 1.5 * u);
        ctx.closePath();
        ctx.fill();

        // Interior de las alas.
        ctx.fillStyle = "#8e6ca9";
        ctx.fillRect(-4.7 * u, -1.8 * u, 1.2 * u, 2.3 * u);
        ctx.fillRect(3.5 * u, -1.8 * u, 1.2 * u, 2.3 * u);

        // Orejas.
        ctx.fillStyle = "#403255";
        ctx.fillRect(-3.5 * u, -5.5 * u, 1.5 * u, 3 * u);
        ctx.fillRect(2 * u, -5.5 * u, 1.5 * u, 3 * u);

        ctx.fillStyle = "#b98cc9";
        ctx.fillRect(-3 * u, -4.8 * u, 0.5 * u, 1.4 * u);
        ctx.fillRect(2.5 * u, -4.8 * u, 0.5 * u, 1.4 * u);

        // Cabeza.
        ctx.fillStyle = this.color;
        ctx.fillRect(-3.8 * u, -3.7 * u, 7.6 * u, 5.7 * u);

        // Mejillas.
        ctx.fillStyle = "#e89cce";
        ctx.fillRect(-3 * u, 0.2 * u, 1.2 * u, 0.7 * u);
        ctx.fillRect(1.8 * u, 0.2 * u, 1.2 * u, 0.7 * u);

        // Ojos.
        ctx.fillStyle = "#f7f0ff";
        ctx.fillRect(-2.5 * u, -2.2 * u, 1.5 * u, 1.5 * u);
        ctx.fillRect(1 * u, -2.2 * u, 1.5 * u, 1.5 * u);

        ctx.fillStyle = "#d35c9c";
        ctx.fillRect(-2 * u, -1.8 * u, 0.8 * u, 0.9 * u);
        ctx.fillRect(1.3 * u, -1.8 * u, 0.8 * u, 0.9 * u);

        // Colmillitos.
        ctx.fillStyle = "#fff1ed";
        ctx.fillRect(-1.8 * u, 1 * u, 0.7 * u, 1.2 * u);
        ctx.fillRect(1.1 * u, 1 * u, 0.7 * u, 1.2 * u);
    }

    // -------------------------------------------------
    // ZOMBI DETALLADO
    // -------------------------------------------------

    drawZombie() {
        const u = this.size / 12;

        // Zapatos.
        ctx.fillStyle = "#20222b";
        ctx.fillRect(-3.8 * u, 4.6 * u, 3.1 * u, 1.1 * u);
        ctx.fillRect(0.7 * u, 4.6 * u, 3.1 * u, 1.1 * u);

        // Piernas.
        ctx.fillStyle = "#353e3c";
        ctx.fillRect(-3 * u, 2.1 * u, 2 * u, 3 * u);
        ctx.fillRect(1 * u, 2.1 * u, 2 * u, 3 * u);

        // Pantalón rasgado.
        ctx.fillStyle = "#566b53";
        ctx.fillRect(-3 * u, 2.8 * u, 2 * u, 1.2 * u);
        ctx.fillRect(1 * u, 2.8 * u, 2 * u, 1.2 * u);

        ctx.fillStyle = "#293b33";
        ctx.fillRect(-2.6 * u, 3.7 * u, 1.1 * u, 0.5 * u);
        ctx.fillRect(1.6 * u, 3.5 * u, 0.9 * u, 0.8 * u);

        // Brazos largos.
        ctx.fillStyle = "#739767";
        ctx.fillRect(-4.7 * u, -1 * u, 1.5 * u, 3.6 * u);
        ctx.fillRect(3.2 * u, -1 * u, 1.5 * u, 3.6 * u);

        // Manos.
        ctx.fillStyle = "#a0bd81";
        ctx.fillRect(-5 * u, 1.9 * u, 1.8 * u, 1.2 * u);
        ctx.fillRect(3.3 * u, 1.9 * u, 1.8 * u, 1.2 * u);

        // Dedos cuadrados.
        ctx.fillRect(-5.1 * u, 2.7 * u, 0.5 * u, 1 * u);
        ctx.fillRect(-4.1 * u, 2.7 * u, 0.5 * u, 1 * u);
        ctx.fillRect(3.6 * u, 2.7 * u, 0.5 * u, 1 * u);
        ctx.fillRect(4.6 * u, 2.7 * u, 0.5 * u, 1 * u);

        // Camiseta vieja.
        ctx.fillStyle = "#5a4764";
        ctx.fillRect(-3.5 * u, -1.6 * u, 7 * u, 4.4 * u);

        // Parches de la ropa.
        ctx.fillStyle = "#352d43";
        ctx.fillRect(-3.3 * u, 0.6 * u, 2.1 * u, 1.8 * u);
        ctx.fillRect(1.5 * u, -0.7 * u, 1.5 * u, 2.4 * u);

        ctx.fillStyle = "#b6a3bd";
        ctx.fillRect(-2.7 * u, 1 * u, 1.1 * u, 0.4 * u);
        ctx.fillRect(-2.2 * u, 1.4 * u, 0.4 * u, 0.8 * u);

        // Cuello.
        ctx.fillStyle = "#759a68";
        ctx.fillRect(-1.3 * u, -2.7 * u, 2.6 * u, 1.4 * u);

        // Orejas.
        ctx.fillStyle = "#6e9366";
        ctx.fillRect(-4 * u, -5.2 * u, 1.2 * u, 2.1 * u);
        ctx.fillRect(2.8 * u, -5.2 * u, 1.2 * u, 2.1 * u);

        // Cabeza y sombras.
        ctx.fillStyle = "#456346";
        ctx.fillRect(-3.8 * u, -7 * u, 7.6 * u, 7 * u);

        ctx.fillStyle = "#83a975";
        ctx.fillRect(-3.1 * u, -6.5 * u, 5.9 * u, 5.5 * u);

        ctx.fillStyle = "#648b5d";
        ctx.fillRect(-3.5 * u, -2.1 * u, 2 * u, 1 * u);
        ctx.fillRect(1.6 * u, -6 * u, 1.1 * u, 2.2 * u);

        // Pelo despeinado.
        ctx.fillStyle = "#202a27";
        ctx.fillRect(-4 * u, -7.5 * u, 2 * u, 1.4 * u);
        ctx.fillRect(-2.7 * u, -8.4 * u, 2.1 * u, 1.7 * u);
        ctx.fillRect(-0.8 * u, -7.8 * u, 2 * u, 1.2 * u);
        ctx.fillRect(1.1 * u, -8.3 * u, 2.4 * u, 1.5 * u);
        ctx.fillRect(3 * u, -7.3 * u, 1.1 * u, 1.3 * u);

        ctx.fillStyle = "#46534a";
        ctx.fillRect(-2.3 * u, -7.9 * u, 1.1 * u, 0.5 * u);
        ctx.fillRect(1.8 * u, -7.7 * u, 1 * u, 0.5 * u);

        // Cuencas.
        ctx.fillStyle = "#354634";
        ctx.fillRect(-2.8 * u, -5.4 * u, 2.3 * u, 2.1 * u);
        ctx.fillRect(0.7 * u, -5.4 * u, 2.3 * u, 2.1 * u);

        // Ojos amarillos y rojos.
        ctx.fillStyle = "#f9efb4";
        if (!this.blinking) {
            ctx.fillRect(-2.4 * u, -5 * u, 1.5 * u, 1.4 * u);
            ctx.fillRect(1.1 * u, -5 * u, 1.5 * u, 1.4 * u);

            ctx.fillStyle = "#d74752";
            ctx.fillRect(-1.9 * u, -4.7 * u, 0.8 * u, 0.9 * u);
            ctx.fillRect(1.5 * u, -4.7 * u, 0.8 * u, 0.9 * u);

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-2.1 * u, -4.9 * u, 0.4 * u, 0.4 * u);
            ctx.fillRect(1.4 * u, -4.9 * u, 0.4 * u, 0.4 * u);
        } else {
            ctx.fillStyle = "#263329";
            ctx.fillRect(-2.5 * u, -4.3 * u, 1.7 * u, 0.3 * u);
            ctx.fillRect(1.1 * u, -4.3 * u, 1.7 * u, 0.3 * u);
        }

        // Cejas.
        ctx.fillStyle = "#2a3529";
        ctx.fillRect(-2.9 * u, -5.9 * u, 2.4 * u, 0.5 * u);
        ctx.fillRect(0.7 * u, -5.6 * u, 2.4 * u, 0.5 * u);

        // Nariz.
        ctx.fillStyle = "#52764e";
        ctx.fillRect(-0.6 * u, -3.8 * u, 1.2 * u, 1.1 * u);

        // Boca abierta.
        ctx.fillStyle = "#241820";
        ctx.fillRect(-2.1 * u, -2.7 * u, 4.2 * u, 1.7 * u);

        // Dientes.
        ctx.fillStyle = "#eee6cf";
        ctx.fillRect(-1.6 * u, -2.7 * u, 1 * u, 0.6 * u);
        ctx.fillRect(0.4 * u, -2.7 * u, 1 * u, 0.6 * u);
        ctx.fillRect(-0.6 * u, -1.5 * u, 1 * u, 0.5 * u);

        // Cicatriz.
        ctx.fillStyle = "#a74750";
        ctx.fillRect(1.8 * u, -6.4 * u, 0.5 * u, 1.1 * u);
        ctx.fillRect(1.2 * u, -5.8 * u, 1.5 * u, 0.4 * u);

        // Herida de la mejilla.
        ctx.fillStyle = "#b94f5c";
        ctx.fillRect(-3.1 * u, -2.4 * u, 0.7 * u, 0.9 * u);

        // Botones de la camiseta.
        ctx.fillStyle = "#d6c28a";
        ctx.fillRect(-0.3 * u, -0.4 * u, 0.6 * u, 0.6 * u);
        ctx.fillRect(-0.3 * u, 0.9 * u, 0.6 * u, 0.6 * u);

        // Contorno pixelado.
        ctx.strokeStyle = "#253327";
        ctx.lineWidth = Math.max(1, u * 0.4);
        ctx.strokeRect(-3.8 * u, -7 * u, 7.6 * u, 7 * u);
    }

    // -------------------------------------------------
    // GATITO FANTASMAL
    // -------------------------------------------------

    drawCat() {
        const u = this.size / 12;

        // Orejas.
        ctx.fillStyle = "#7b5b86";
        ctx.fillRect(-4 * u, -5.6 * u, 2.4 * u, 3.5 * u);
        ctx.fillRect(1.6 * u, -5.6 * u, 2.4 * u, 3.5 * u);

        ctx.fillStyle = "#f0a3c8";
        ctx.fillRect(-3.3 * u, -4.9 * u, 1.1 * u, 1.9 * u);
        ctx.fillRect(2.2 * u, -4.9 * u, 1.1 * u, 1.9 * u);

        // Cuerpo.
        ctx.fillStyle = "#8d6b99";
        ctx.fillRect(-3.7 * u, -2.5 * u, 7.4 * u, 5.5 * u);

        ctx.fillStyle = this.color;
        ctx.fillRect(-4 * u, -3 * u, 8 * u, 5.3 * u);

        // Patitas.
        ctx.fillStyle = "#b98bbd";
        ctx.fillRect(-3.5 * u, 1.8 * u, 2 * u, 1.8 * u);
        ctx.fillRect(1.5 * u, 1.8 * u, 2 * u, 1.8 * u);

        // Cola.
        ctx.fillStyle = "#b88bc2";
        ctx.fillRect(3.1 * u, 1.4 * u, 1.5 * u, 1 * u);
        ctx.fillRect(4.1 * u, 0.1 * u, 1.1 * u, 1.7 * u);
        ctx.fillRect(3.5 * u, -0.4 * u, 1.5 * u, 0.9 * u);

        // Mejillas.
        ctx.fillStyle = "#f7a8cf";
        ctx.fillRect(-3 * u, -0.1 * u, 1.2 * u, 0.8 * u);
        ctx.fillRect(1.8 * u, -0.1 * u, 1.2 * u, 0.8 * u);

        // Ojos.
        if (!this.blinking) {
            ctx.fillStyle = "#eaffb2";
            ctx.fillRect(-2.5 * u, -2.1 * u, 1.6 * u, 1.7 * u);
            ctx.fillRect(0.9 * u, -2.1 * u, 1.6 * u, 1.7 * u);

            ctx.fillStyle = "#55364e";
            ctx.fillRect(-1.9 * u, -2.1 * u, 0.5 * u, 1.7 * u);
            ctx.fillRect(1.5 * u, -2.1 * u, 0.5 * u, 1.7 * u);

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-2.2 * u, -2 * u, 0.4 * u, 0.4 * u);
            ctx.fillRect(1.2 * u, -2 * u, 0.4 * u, 0.4 * u);
        } else {
            ctx.fillStyle = "#55364e";
            ctx.fillRect(-2.5 * u, -1.4 * u, 1.6 * u, 0.3 * u);
            ctx.fillRect(0.9 * u, -1.4 * u, 1.6 * u, 0.3 * u);
        }

        // Nariz.
        ctx.fillStyle = "#f5a4c8";
        ctx.fillRect(-0.4 * u, -0.4 * u, 0.8 * u, 0.6 * u);

        // Boca.
        ctx.fillStyle = "#68435e";
        ctx.fillRect(-0.8 * u, 0.3 * u, 0.5 * u, 0.5 * u);
        ctx.fillRect(0.3 * u, 0.3 * u, 0.5 * u, 0.5 * u);
        ctx.fillRect(-0.2 * u, 0.7 * u, 0.5 * u, 0.5 * u);

        // Bigotes.
        ctx.fillStyle = "#f7e9ff";
        ctx.fillRect(-4.1 * u, -0.2 * u, 1.5 * u, 0.2 * u);
        ctx.fillRect(-4.1 * u, 0.6 * u, 1.5 * u, 0.2 * u);
        ctx.fillRect(2.6 * u, -0.2 * u, 1.5 * u, 0.2 * u);
        ctx.fillRect(2.6 * u, 0.6 * u, 1.5 * u, 0.2 * u);

        // Collar y campanita.
        ctx.fillStyle = "#f5c56d";
        ctx.fillRect(-2.6 * u, 1.1 * u, 5.2 * u, 0.5 * u);
        ctx.fillStyle = "#ffe8a4";
        ctx.fillRect(-0.3 * u, 1.5 * u, 0.6 * u, 0.6 * u);
    }
}

// =====================================================
// CREACIÓN Y REPOSICIÓN DE CRIATURAS
// =====================================================

function createCreature() {
    const type = CREATURE_TYPES[randomInt(0, CREATURE_TYPES.length - 1)];
    const palette = PALETTES[type];
    const size = randomInt(16, 24);

    const x = random(size + 10, WIDTH - size - 10);
    const y = random(170, HEIGHT - size - 35);

    let speedX = random(-1.25, 1.25);
    let speedY = random(-0.95, 0.95);

    if (Math.abs(speedX) < 0.35) {
        speedX = speedX < 0 ? -0.45 : 0.45;
    }

    if (Math.abs(speedY) < 0.25) {
        speedY = speedY < 0 ? -0.35 : 0.35;
    }

    return new Creature(
        x,
        y,
        type,
        size,
        palette[randomInt(0, palette.length - 1)],
        speedX,
        speedY
    );
}

function maintainCreatures() {
    creatures = creatures.filter(creature => !creature.dead);

    while (
        creatures.filter(
            creature => !creature.squashing && !creature.dead
        ).length < TARGET_CREATURES
    ) {
        creatures.push(createCreature());
    }

    updateScore();
}

function resetCreatures() {
    creatures = [];
    particles = [];

    for (let i = 0; i < TARGET_CREATURES; i++) {
        creatures.push(createCreature());
    }

    // Separar las criaturas al iniciar para reducir superposiciones.
    for (let pass = 0; pass < 5; pass++) {
        handleCollisions(true);
    }

    updateScore();
}

// =====================================================
// COLISIONES Y REBOTES
// =====================================================

function handleCollisions(separatingOnly = false) {
    for (let i = 0; i < creatures.length; i++) {
        const a = creatures[i];

        if (a.dead || a.squashing) continue;

        for (let j = i + 1; j < creatures.length; j++) {
            const b = creatures[j];

            if (b.dead || b.squashing) continue;

            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let distance = Math.hypot(dx, dy);

            const minimumDistance = a.radius + b.radius;

            if (distance >= minimumDistance) continue;

            if (distance === 0) {
                dx = 0.01;
                dy = 0.01;
                distance = Math.hypot(dx, dy);
            }

            const nx = dx / distance;
            const ny = dy / distance;
            const overlap = minimumDistance - distance;

            // Separar las criaturas para que no queden pegadas.
            a.x -= nx * overlap * 0.5;
            a.y -= ny * overlap * 0.5;
            b.x += nx * overlap * 0.5;
            b.y += ny * overlap * 0.5;

            if (separatingOnly) continue;

            // Colisión elástica aproximada entre masas iguales.
            const relativeX = a.speedX - b.speedX;
            const relativeY = a.speedY - b.speedY;
            const closingSpeed = relativeX * nx + relativeY * ny;

            if (closingSpeed > 0) {
                a.speedX -= closingSpeed * nx;
                a.speedY -= closingSpeed * ny;

                b.speedX += closingSpeed * nx;
                b.speedY += closingSpeed * ny;
            }

            // Destello azul breve al tocarse.
            a.hitFlash = 4;
            b.hitFlash = 4;
        }
    }
}

// =====================================================
// INTERACCIÓN CON EL RATÓN
// =====================================================

function getCanvasPosition(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) * (WIDTH / rect.width),
        y: (event.clientY - rect.top) * (HEIGHT / rect.height)
    };
}

canvas.addEventListener("click", event => {
    if (!gameRunning || screamerActive) return;

    const position = getCanvasPosition(event);

    // Comprobar primero las criaturas más cercanas al frente.
    for (let i = creatures.length - 1; i >= 0; i--) {
        const creature = creatures[i];

        if (creature.dead || creature.squashing) continue;

        const distance = Math.hypot(
            position.x - creature.x,
            position.y - creature.y
        );

        if (distance <= creature.radius * 1.6) {
            creature.squashing = true;
            creature.squashTimer = 240;

            score++;
            createParticles(
                creature.x,
                creature.y,
                PALETTES[creature.type][0],
                18
            );

            updateScore();
            gameStatus.textContent = "¡Has capturado un alma! ✨";

            break;
        }
    }
});

// =====================================================
// SCREAMER
// =====================================================

function scheduleNextScreamer() {
    // Próximo susto aleatorio entre 20 y 35 segundos.
    nextScreamerTime = performance.now() + random(20000, 35000);
}

function triggerScreamer() {
    if (!gameRunning || screamerActive) return;

    const now = performance.now();

    // Evitar que se active varias veces seguidas.
    if (now - lastScreamerAt < 8000) {
        scheduleNextScreamer();
        return;
    }

    lastScreamerAt = now;
    screamerActive = true;

    screamerOverlay.classList.remove("active");
    screamerOverlay.setAttribute("aria-hidden", "false");

    // Reiniciar animación CSS.
    void screamerOverlay.offsetWidth;
    screamerOverlay.classList.add("active");

    if (screamerAudio) {
        screamerAudio.pause();
        screamerAudio.currentTime = 0;
        screamerAudio.volume = 1;

        screamerAudio.play().catch(() => {
            console.warn(
                "El navegador no permitió reproducir el grito automáticamente."
            );
        });
    }

    gameStatus.textContent = "¡ALGO TE HA ENCONTRADO!";

    clearTimeout(screamerTimeout);

    screamerTimeout = setTimeout(() => {
        screamerOverlay.classList.remove("active");
        screamerOverlay.setAttribute("aria-hidden", "true");

        if (screamerAudio) {
            screamerAudio.pause();
            screamerAudio.currentTime = 0;
        }

        screamerActive = false;

        if (gameRunning) {
            gameStatus.textContent = "No estás a salvo...";
            scheduleNextScreamer();
        }
    }, 1100);
}

// =====================================================
// MÚSICA AMBIENTAL
// =====================================================

async function toggleMusic() {
    if (!backgroundMusic) return;

    if (musicEnabled) {
        backgroundMusic.pause();
        musicEnabled = false;
        musicButton.textContent = "♫ Activar música";
        return;
    }

    try {
        backgroundMusic.volume = 0.45;
        await backgroundMusic.play();

        musicEnabled = true;
        musicButton.textContent = "♫ Silenciar música";
    } catch (error) {
        musicEnabled = false;
        musicButton.textContent = "♫ Reintentar música";
        console.warn(
            "No se pudo reproducir la música. Revisa audio/terror.mp3.",
            error
        );
    }
}

musicButton.addEventListener("click", toggleMusic);

// =====================================================
// INICIO, PAUSA Y REINICIO
// =====================================================

function startGame() {
    if (gameRunning) return;

    gameStarted = true;
    gameRunning = true;

    startMessage.classList.add("hidden");
    startMessage.setAttribute("aria-hidden", "true");

    startButton.textContent = "Entrar al cementerio";

    gameStatus.textContent = "Las criaturas están despiertas...";
    lastFrameTime = performance.now();

    scheduleNextScreamer();

    if (!musicEnabled) {
        toggleMusic();
    }

    if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
    }

    animationFrame = requestAnimationFrame(gameLoop);
}

function restartGame() {
    gameRunning = false;
    gameStarted = false;

    if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    clearTimeout(screamerTimeout);

    screamerActive = false;

    screamerOverlay.classList.remove("active");
    screamerOverlay.setAttribute("aria-hidden", "true");

    if (screamerAudio) {
        screamerAudio.pause();
        screamerAudio.currentTime = 0;
    }

    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }

    musicEnabled = false;
    musicButton.textContent = "♫ Activar música";

    score = 0;
    resetCreatures();

    // Limpiar el canvas antes de volver a mostrar el menú.
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground();
    creatures.forEach(creature => creature.draw());

    gameStatus.textContent = "Esperando la medianoche...";
    startButton.textContent = "✦ Entrar al cementerio";

    // Restablecer la pantalla centrada.
    startMessage.classList.remove("hidden");
    startMessage.style.display = "";
    startMessage.setAttribute("aria-hidden", "false");
}

startButton.addEventListener("click", () => {
    if (!gameRunning) {
        startGame();
    }
});

restartButton.addEventListener("click", restartGame);

// =====================================================
// BUCLE PRINCIPAL
// =====================================================

function gameLoop(timestamp) {
    if (!gameRunning) return;

    const delta = Math.min(timestamp - lastFrameTime || 16.67, 40);
    lastFrameTime = timestamp;

    drawBackground();

    if (!screamerActive) {
        for (const creature of creatures) {
            creature.update(delta);
        }

        handleCollisions();

        for (const creature of creatures) {
            creature.draw();
        }

        for (const particle of particles) {
            particle.update();
            particle.draw();
        }

        particles = particles.filter(particle => particle.life > 0);

        maintainCreatures();

        if (timestamp >= nextScreamerTime) {
            triggerScreamer();
        }
    }

    animationFrame = requestAnimationFrame(gameLoop);
}

// =====================================================
// INICIALIZACIÓN
// =====================================================

function initializeGame() {
    resetCreatures();

    drawBackground();

    for (const creature of creatures) {
        creature.draw();
    }

    startMessage.classList.remove("hidden");
    startMessage.setAttribute("aria-hidden", "false");

    gameStatus.textContent = "Esperando la medianoche...";
}

initializeGame();
