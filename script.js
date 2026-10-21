"use strict";

// ================================================
// CONFIGURACIÓN GENERAL
// ================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startOverlay = document.getElementById("startOverlay");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const musicButton = document.getElementById("musicButton");
const scoreElement = document.getElementById("score");
const remainingElement = document.getElementById("remaining");
const screamerOverlay = document.getElementById("screamerOverlay");

const backgroundMusic = document.getElementById("backgroundMusic");
const screamerAudio = document.getElementById("screamerAudio");

const W = canvas.width;
const H = canvas.height;
const TOTAL_CREATURES = 25;

let creatures = [];
let score = 0;
let gameStarted = false;
let musicEnabled = false;
let lastTime = 0;
let animationId = null;
let elapsedTime = 0;

let screamerActive = false;
let screamerTimer = 0;
let nextScreamer = randomBetween(8, 16);
let screamerCooldown = 0;

let mouseX = -100;
let mouseY = -100;
let mouseMoved = false;

backgroundMusic.volume = 0.25;
screamerAudio.volume = 0.5;

// ================================================
// FUNCIONES AUXILIARES
// ================================================

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(randomBetween(min, max + 1));
}

function choose(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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

// ================================================
// FONDO PIXEL ART DEL CEMENTERIO
// ================================================

const stars = Array.from({ length: 100 }, () => ({
    x: randomBetween(0, W),
    y: randomBetween(5, 270),
    size: Math.random() > 0.8 ? 3 : 2,
    phase: randomBetween(0, Math.PI * 2)
}));

function drawBackground() {
    // Cielo nocturno
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#100b20");
    sky.addColorStop(0.5, "#21152f");
    sky.addColorStop(1, "#101723");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Resplandor de la luna
    const moonGlow = ctx.createRadialGradient(
        750, 105, 8,
        750, 105, 180
    );

    moonGlow.addColorStop(0, "#9a83ba22");
    moonGlow.addColorStop(1, "#9a83ba00");

    ctx.fillStyle = moonGlow;
    ctx.fillRect(550, 0, 400, 300);

    // Estrellas pixeladas
    for (const star of stars) {
        const brightness =
            0.45 + 0.55 * Math.abs(Math.sin(elapsedTime * 1.5 + star.phase));

        ctx.globalAlpha = brightness;
        rect(star.x, star.y, star.size, star.size, "#d9d2ee");
    }

    ctx.globalAlpha = 1;

    // Luna
    rect(718, 57, 64, 64, "#c7c1d9");
    rect(727, 48, 46, 82, "#c7c1d9");
    rect(708, 67, 83, 46, "#c7c1d9");

    rect(735, 58, 12, 9, "#a5a0bf");
    rect(750, 78, 14, 10, "#a5a0bf");
    rect(719, 96, 11, 12, "#a5a0bf");
    rect(772, 57, 7, 8, "#eee9f5");

    // Nubes oscuras
    drawCloud(100, 92, "#20172f");
    drawCloud(450, 62, "#1a1328");
    drawCloud(820, 160, "#21152e");

    // Montañas lejanas
    rect(0, 245, W, 65, "#191529");

    ctx.fillStyle = "#191529";
    ctx.beginPath();
    ctx.moveTo(0, 267);
    ctx.lineTo(115, 190);
    ctx.lineTo(205, 266);
    ctx.lineTo(330, 205);
    ctx.lineTo(450, 274);
    ctx.lineTo(600, 218);
    ctx.lineTo(730, 271);
    ctx.lineTo(855, 205);
    ctx.lineTo(960, 260);
    ctx.lineTo(960, 340);
    ctx.lineTo(0, 340);
    ctx.fill();

    // Siluetas de árboles distantes
    drawDeadTree(80, 250, 0.9, "#151120");
    drawDeadTree(865, 248, 1.1, "#151120");
    drawDeadTree(400, 267, 0.6, "#171222");

    // Suelo del cementerio
    rect(0, 305, W, 235, "#17251f");
    rect(0, 305, W, 12, "#26372a");
    rect(0, 317, W, 5, "#1c2c23");

    // Franjas de terreno
    rect(0, 374, W, 3, "#203026");
    rect(0, 440, W, 3, "#203026");
    rect(0, 505, W, 3, "#203026");

    // Camino central
    ctx.fillStyle = "#292331";
    ctx.beginPath();
    ctx.moveTo(395, 540);
    ctx.lineTo(470, 310);
    ctx.lineTo(530, 310);
    ctx.lineTo(610, 540);
    ctx.closePath();
    ctx.fill();

    rect(468, 320, 5, 14, "#393040");
    rect(454, 367, 5, 9, "#393040");
    rect(514, 405, 6, 11, "#393040");
    rect(493, 463, 5, 13, "#393040");

    // Hierba y flores pixeladas
    for (let i = 0; i < 85; i++) {
        const x = (i * 137) % W;
        const y = 320 + ((i * 53) % 215);

        rect(x, y, 3, 7, "#315137");
        rect(x + 3, y + 2, 3, 4, "#456643");

        if (i % 7 === 0) {
            rect(x + 2, y - 3, 4, 4, "#a65a9b");
        }
    }

    // Lápidas
    drawGravestone(100, 338, 0.9);
    drawGravestone(230, 385, 1.1);
    drawGravestone(360, 332, 0.75);
    drawGravestone(610, 350, 0.95);
    drawGravestone(770, 385, 1.1);
    drawGravestone(900, 330, 0.8);
    drawGravestone(150, 465, 0.75);
    drawGravestone(335, 470, 0.85);
    drawGravestone(680, 465, 0.85);
    drawGravestone(855, 470, 0.75);

    // Cruces antiguas
    drawCross(48, 356, 0.8);
    drawCross(300, 350, 0.7);
    drawCross(705, 350, 0.8);
    drawCross(940, 415, 0.75);

    // Cercas rotas
    drawFence(0, 390, 175);
    drawFence(795, 420, 165);

    // Calabazas decorativas
    drawSmallPumpkin(75, 490);
    drawSmallPumpkin(570, 500);
    drawSmallPumpkin(820, 325);

    // Piedras
    for (let i = 0; i < 25; i++) {
        const x = (i * 181 + 25) % W;
        const y = 335 + ((i * 71) % 195);
        rect(x, y, 7, 4, "#404047");
        rect(x + 2, y - 2, 4, 3, "#50505a");
    }

    // Niebla tenue
    ctx.globalAlpha = 0.11;
    rect(0, 300, W, 22, "#b1a1c7");
    rect(0, 405, W, 13, "#a79bb8");
    rect(0, 475, W, 18, "#9a8bac");
    ctx.globalAlpha = 1;

    // Viñeta oscura
    const vignette = ctx.createRadialGradient(
        W / 2, H / 2, 100,
        W / 2, H / 2, 600
    );

    vignette.addColorStop(0, "#00000000");
    vignette.addColorStop(1, "#05030caa");

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
}

function drawCloud(x, y, color) {
    rect(x, y + 8, 65, 14, color);
    rect(x + 12, y, 25, 14, color);
    rect(x + 32, y + 3, 25, 12, color);
}

function drawDeadTree(x, y, scale, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    rect(-5, -90, 12, 90, color);
    rect(-23, -72, 20, 7, color);
    rect(-28, -92, 7, 25, color);
    rect(5, -65, 24, 7, color);
    rect(22, -84, 7, 25, color);
    rect(-14, -53, 9, 7, color);
    rect(-20, -45, 7, 18, color);
    rect(5, -95, 7, 22, color);
    rect(9, -104, 14, 7, color);

    ctx.restore();
}

function drawGravestone(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    rect(-17, -29, 34, 31, "#30353a");
    rect(-13, -39, 26, 13, "#30353a");
    rect(-10, -44, 20, 8, "#30353a");
    rect(-13, -26, 5, 24, "#45464b");
    rect(-10, -40, 16, 4, "#45464b");
    rect(-17, 1, 34, 5, "#1b211d");

    // Marcas desgastadas
    rect(4, -20, 6, 3, "#25282f");
    rect(-5, -13, 11, 2, "#25282f");

    ctx.restore();
}

function drawCross(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    rect(-4, -38, 8, 39, "#44404b");
    rect(-14, -29, 28, 7, "#44404b");
    rect(-2, -35, 3, 32, "#625469");
    rect(-10, -27, 20, 2, "#625469");

    ctx.restore();
}

function drawFence(x, y, width) {
    rect(x, y, width, 5, "#302c39");
    rect(x, y + 24, width, 5, "#302c39");

    for (let px = x; px < x + width; px += 20) {
        rect(px, y - 10, 5, 40, "#37313f");
        rect(px - 2, y - 13, 9, 5, "#494052");
    }
}

function drawSmallPumpkin(x, y) {
    rect(x + 7, y - 15, 10, 4, "#47723d");
    rect(x + 9, y - 19, 5, 6, "#557f40");

    rect(x, y - 10, 24, 16, "#a94f27");
    rect(x - 3, y - 6, 30, 9, "#d06a2f");
    rect(x + 3, y - 12, 6, 18, "#d06a2f");
    rect(x + 16, y - 12, 5, 18, "#874022");

    rect(x + 5, y - 5, 4, 4, "#f4c35c");
    rect(x + 16, y - 5, 4, 4, "#f4c35c");
    rect(x + 9, y + 1, 8, 3, "#5b241e");
}

// ================================================
// CRIATURAS
// ================================================

const TYPES = ["ghost", "pumpkin", "bat", "zombie", "cat"];

const COLORS = {
    ghost: ["#ded6ed", "#a9c9d6", "#c5b6e8"],
    pumpkin: ["#e87b36", "#d95c2b", "#f2a23b"],
    bat: ["#6d548c", "#55426e", "#8a659d"],
    zombie: ["#83b77b", "#739b65", "#a3c18b"],
    cat: ["#7d778d", "#b0a3a0", "#62586f"]
};

class Creature {
    constructor() {
        this.respawn(true);
    }

    respawn(initial = false) {
        this.type = choose(TYPES);
        this.color = choose(COLORS[this.type]);

        // Tamaños pequeños para mantener el escenario visible.
        this.size = randomBetween(10, 17);
        this.radius = this.size * 0.65;

        this.x = randomBetween(30, W - 30);
        this.y = randomBetween(285, H - 30);

        this.speed = randomBetween(22, 68);
        this.angle = randomBetween(0, Math.PI * 2);
        this.direction = Math.random() < 0.5 ? -1 : 1;

        this.moveType = choose(["horizontal", "diagonal", "circle", "float"]);
        this.phase = randomBetween(0, Math.PI * 2);
        this.originX = this.x;
        this.originY = this.y;

        this.flashTimer = 0;
        this.squashTimer = 0;
        this.hiddenTimer = 0;
        this.alive = true;
        this.collisionCooldown = 0;
        this.age = 0;

        this.dx = Math.cos(this.angle) * this.speed;
        this.dy = Math.sin(this.angle) * this.speed;

        if (!initial) {
            this.x = randomBetween(25, W - 25);
            this.y = randomBetween(300, H - 25);
        }
    }

    update(dt) {
        this.age += dt;
        this.phase += dt * 2;
        this.flashTimer = Math.max(0, this.flashTimer - dt);
        this.collisionCooldown = Math.max(0, this.collisionCooldown - dt);

        if (!this.alive) {
            this.squashTimer -= dt;

            if (this.squashTimer <= 0) {
                this.respawn();
            }
            return;
        }

        if (this.hiddenTimer > 0) {
            this.hiddenTimer -= dt;

            if (this.hiddenTimer <= 0) {
                this.alive = true;
                this.respawn();
            }
            return;
        }

        switch (this.moveType) {
            case "horizontal":
                this.x += this.dx * dt;
                this.y += Math.sin(this.phase) * 12 * dt;
                break;

            case "diagonal":
                this.x += this.dx * dt;
                this.y += this.dy * dt;
                break;

            case "circle":
                this.x += Math.cos(this.phase) * this.speed * dt;
                this.y += Math.sin(this.phase * 1.3) * this.speed * dt;
                break;

            case "float":
                this.x += Math.sin(this.phase * 0.7) * this.speed * dt;
                this.y += Math.cos(this.phase) * this.speed * 0.45 * dt;
                break;
        }

        // Rebotar contra los límites del escenario
        if (this.x < this.radius || this.x > W - this.radius) {
            this.dx *= -1;
            this.direction *= -1;
            this.x = clamp(this.x, this.radius, W - this.radius);
        }

        if (this.y < 280 || this.y > H - this.radius) {
            this.dy *= -1;
            this.y = clamp(this.y, 280, H - this.radius);
        }

        // Desaparición ocasional
        if (Math.random() < 0.0006) {
            this.hiddenTimer = randomBetween(0.8, 1.8);
            this.alive = false;
        }
    }

    draw() {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));

        if (this.flashTimer > 0) {
            this.drawSprite("#0000ff");
        } else {
            this.drawSprite(this.color);
        }

        ctx.restore();
    }

    drawSprite(color) {
        switch (this.type) {
            case "ghost":
                this.drawGhost(color);
                break;
            case "pumpkin":
                this.drawPumpkin(color);
                break;
            case "bat":
                this.drawBat(color);
                break;
            case "zombie":
                this.drawZombie(color);
                break;
            case "cat":
                this.drawCat(color);
                break;
        }
    }

    drawGhost(color) {
        const s = this.size / 12;

        // Cuerpo pixelado
        rect(-8*s, -9*s, 16*s, 13*s, color);
        rect(-6*s, -12*s, 12*s, 4*s, color);
        rect(-3*s, -14*s, 6*s, 3*s, color);

        rect(-8*s, 3*s, 4*s, 4*s, color);
        rect(-2*s, 3*s, 4*s, 3*s, color);
        rect(4*s, 3*s, 4*s, 4*s, color);

        // Sombras del fantasma
        rect(-5*s, -6*s, 3*s, 8*s, "#a3a0bb");
        rect(3*s, -8*s, 2*s, 7*s, "#b8b0cf");

        // Ojos
        rect(-5*s, -5*s, 3*s, 4*s, "#171326");
        rect(2*s, -5*s, 3*s, 4*s, "#171326");
        rect(-1*s, 0, 3*s, 2*s, "#171326");
    }

    drawPumpkin(color) {
        const s = this.size / 12;

        rect(-3*s, -13*s, 6*s, 4*s, "#4b743e");
        rect(-2*s, -15*s, 4*s, 3*s, "#68954b");

        rect(-9*s, -8*s, 18*s, 12*s, color);
        rect(-11*s, -5*s, 22*s, 7*s, color);
        rect(-6*s, -10*s, 4*s, 15*s, "#f5a044");
        rect(3*s, -10*s, 4*s, 15*s, "#a74a26");
        rect(-10*s, -4*s, 2*s, 5*s, "#a74a26");
        rect(8*s, -4*s, 2*s, 5*s, "#a74a26");

        // Ojos triangulares
        rect(-6*s, -4*s, 4*s, 4*s, "#ffdf72");
        rect(3*s, -4*s, 4*s, 4*s, "#ffdf72");

        rect(-4*s, 2*s, 8*s, 3*s, "#59221f");
        rect(-2*s, 2*s, 2*s, 2*s, "#ffdf72");
        rect(2*s, 2*s, 2*s, 2*s, "#ffdf72");
    }

    drawBat(color) {
        const s = this.size / 12;
        const wing = Math.sin(this.phase * 5) * 3 * s;

        // Alas
        rect(-15*s, -4*s, 7*s, (5 + wing)*s, color);
        rect(-12*s, 1*s, 8*s, 4*s, color);
        rect(-16*s, 2*s, 4*s, 4*s, "#34243f");

        rect(8*s, -4*s, 7*s, (5 + wing)*s, color);
        rect(4*s, 1*s, 8*s, 4*s, color);
        rect(12*s, 2*s, 4*s, 4*s, "#34243f");

        // Cuerpo
        rect(-5*s, -7*s, 10*s, 13*s, color);
        rect(-4*s, -10*s, 3*s, 4*s, color);
        rect(2*s, -10*s, 3*s, 4*s, color);

        rect(-4*s, -4*s, 3*s, 3*s, "#f6c56e");
        rect(2*s, -4*s, 3*s, 3*s, "#f6c56e");
        rect(-2*s, 2*s, 4*s, 3*s, "#25132e");
    }

    drawZombie(color) {
        const s = this.size / 12;

        // Brazos
        rect(-12*s, -3*s, 5*s, 4*s, color);
        rect(-13*s, -7*s, 4*s, 6*s, color);
        rect(7*s, -4*s, 5*s, 4*s, color);
        rect(9*s, -8*s, 4*s, 6*s, color);

        // Cuerpo
        rect(-7*s, -2*s, 14*s, 10*s, "#496d49");
        rect(-5*s, -5*s, 10*s, 5*s, color);
        rect(-5*s, 6*s, 4*s, 5*s, "#343044");
        rect(2*s, 6*s, 4*s, 5*s, "#343044");

        // Cabeza
        rect(-7*s, -13*s, 14*s, 11*s, color);
        rect(-5*s, -16*s, 10*s, 4*s, color);
        rect(-8*s, -10*s, 3*s, 3*s, "#496d49");

        // Ojos desiguales
        rect(-4*s, -9*s, 3*s, 3*s, "#e5e6a2");
        rect(3*s, -8*s, 3*s, 2*s, "#33243c");
        rect(-1*s, -5*s, 5*s, 2*s, "#293a2d");
        rect(2*s, -4*s, 2*s, 1*s, "#ded7bc");
    }

    drawCat(color) {
        const s = this.size / 12;

        // Cola
        rect(6*s, 1*s, 4*s, 3*s, color);
        rect(9*s, -2*s, 3*s, 5*s, color);
        rect(7*s, -5*s, 4*s, 4*s, color);

        // Patas
        rect(-6*s, 4*s, 4*s, 6*s, "#494153");
        rect(3*s, 4*s, 4*s, 6*s, "#494153");

        // Cuerpo
        rect(-8*s, -2*s, 16*s, 9*s, color);
        rect(-6*s, 1*s, 12*s, 5*s, color);

        // Orejas
        rect(-7*s, -13*s, 5*s, 6*s, color);
        rect(3*s, -13*s, 5*s, 6*s, color);
        rect(-5*s, -12*s, 2*s, 3*s, "#c77b9a");
        rect(4*s, -12*s, 2*s, 3*s, "#c77b9a");

        // Cabeza
        rect(-7*s, -10*s, 14*s, 10*s, color);
        rect(-5*s, -12*s, 10*s, 3*s, color);

        // Ojos brillantes
        rect(-4*s, -7*s, 3*s, 3*s, "#c7f18a");
        rect(2*s, -7*s, 3*s, 3*s, "#c7f18a");
        rect(-3*s, -7*s, 1*s, 3*s, "#1a1a21");
        rect(3*s, -7*s, 1*s, 3*s, "#1a1a21");

        // Nariz y bigotes
        rect(-1*s, -3*s, 2*s, 2*s, "#e7a3c6");
        rect(-10*s, -3*s, 4*s, 1*s, "#c9becb");
        rect(6*s, -3*s, 4*s, 1*s, "#c9becb");
    }
}

// ================================================
// COLISIONES ENTRE CRIATURAS
// ================================================

function checkCollisions() {
    for (let i = 0; i < creatures.length; i++) {
        const a = creatures[i];

        if (!a.alive || a.collisionCooldown > 0) continue;

        for (let j = i + 1; j < creatures.length; j++) {
            const b = creatures[j];

            if (!b.alive || b.collisionCooldown > 0) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minimumDistance = a.radius + b.radius;

            if (distance < minimumDistance && distance > 0) {
                const nx = dx / distance;
                const ny = dy / distance;

                // Intercambio de velocidades en la dirección de colisión
                const relativeVelocity =
                    (a.dx - b.dx) * nx + (a.dy - b.dy) * ny;

                if (relativeVelocity > 0) {
                    a.dx -= relativeVelocity * nx;
                    a.dy -= relativeVelocity * ny;
                    b.dx += relativeVelocity * nx;
                    b.dy += relativeVelocity * ny;
                } else {
                    a.dx *= -1;
                    a.dy *= -1;
                    b.dx *= -1;
                    b.dy *= -1;
                }

                // Separar las figuras para evitar que se encimen
                const overlap = (minimumDistance - distance) / 2;

                a.x -= nx * overlap;
                a.y -= ny * overlap;
                b.x += nx * overlap;
                b.y += ny * overlap;

                // Destello azul temporal
                a.flashTimer = 0.18;
                b.flashTimer = 0.18;

                a.collisionCooldown = 0.12;
                b.collisionCooldown = 0.12;
            }
        }
    }
}

// ================================================
// SCREAMER SORPRESA
// ================================================

function playScreamerSound() {
    if (!screamerAudio) return;

    screamerAudio.currentTime = 0;
    screamerAudio.play().catch(() => {
        console.warn("El navegador bloqueó el sonido del screamer.");
    });
}

function startScreamer() {
    if (screamerActive || screamerCooldown > 0) return;

    screamerActive = true;
    screamerTimer = 0.9;
    screamerCooldown = randomBetween(14, 24);

    screamerOverlay.classList.add("active");
    screamerOverlay.setAttribute("aria-hidden", "false");

    playScreamerSound();
}

function updateScreamer(dt) {
    screamerCooldown = Math.max(0, screamerCooldown - dt);

    if (screamerActive) {
        screamerTimer -= dt;

        if (screamerTimer <= 0) {
            screamerActive = false;
            screamerOverlay.classList.remove("active");
            screamerOverlay.setAttribute("aria-hidden", "true");
            nextScreamer = randomBetween(8, 16);
        }

        return;
    }

    nextScreamer -= dt;

    if (nextScreamer <= 0) {
        startScreamer();
    }
}

// ================================================
// CONTROLES DEL JUEGO
// ================================================

function updateCounters() {
    scoreElement.textContent = String(score).padStart(2, "0");

    const remaining = creatures.filter(c => c.alive).length;
    remainingElement.textContent = String(remaining).padStart(2, "0");
}

function startGame() {
    if (gameStarted) return;

    gameStarted = true;
    startOverlay.classList.add("hidden");

    lastTime = performance.now();

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
    }

    animationId = requestAnimationFrame(gameLoop);
}

function restartGame() {
    score = 0;
    elapsedTime = 0;
    creatures = [];

    for (let i = 0; i < TOTAL_CREATURES; i++) {
        creatures.push(new Creature());
    }

    screamerActive = false;
    screamerTimer = 0;
    screamerCooldown = 0;
    nextScreamer = randomBetween(8, 16);

    screamerOverlay.classList.remove("active");
    screamerOverlay.setAttribute("aria-hidden", "true");

    updateCounters();

    if (gameStarted) {
        lastTime = performance.now();

        if (animationId !== null) {
            cancelAnimationFrame(animationId);
        }

        animationId = requestAnimationFrame(gameLoop);
    } else {
        drawScene();
    }
}

async function startMusic() {
    try {
        await backgroundMusic.play();
        musicEnabled = true;
        musicButton.textContent = "♫ SILENCIAR MÚSICA";
    } catch (error) {
        console.error("No se pudo reproducir la música:", error);
    }
}

function stopMusic() {
    backgroundMusic.pause();
    musicEnabled = false;
    musicButton.textContent = "♫ ACTIVAR MÚSICA";
}

// ================================================
// CLICS SOBRE LAS CRIATURAS
// ================================================

canvas.addEventListener("pointermove", event => {
    const bounds = canvas.getBoundingClientRect();

    mouseX = (event.clientX - bounds.left) * W / bounds.width;
    mouseY = (event.clientY - bounds.top) * H / bounds.height;
    mouseMoved = true;
});

canvas.addEventListener("pointerdown", event => {
    if (!gameStarted) return;

    const bounds = canvas.getBoundingClientRect();

    const x = (event.clientX - bounds.left) * W / bounds.width;
    const y = (event.clientY - bounds.top) * H / bounds.height;

    for (let i = creatures.length - 1; i >= 0; i--) {
        const creature = creatures[i];

        if (!creature.alive) continue;

        const dx = x - creature.x;
        const dy = y - creature.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= creature.radius + 10) {
            creature.alive = false;
            creature.squashTimer = 0.55;

            score++;
            updateCounters();
            break;
        }
    }
});

// ================================================
// CURSOR DE VARITA MÁGICA
// ================================================

function drawMagicCursor() {
    if (!mouseMoved) return;

    ctx.save();
    ctx.translate(Math.round(mouseX), Math.round(mouseY));

    // Brillo mágico
    ctx.globalAlpha = 0.3;
    rect(-10, -10, 20, 20, "#b7a0f8");
    ctx.globalAlpha = 1;

    // Varita diagonal
    ctx.save();
    ctx.rotate(-Math.PI / 4);

    rect(-2, -15, 4, 30, "#e8d5a5");
    rect(-3, -16, 6, 4, "#fff2c5");
    rect(-3, 11, 6, 4, "#b38b64");

    ctx.restore();

    // Estrellitas
    rect(-13, -9, 3, 3, "#f8e7a1");
    rect(9, -12, 3, 3, "#f8e7a1");
    rect(10, 7, 3, 3, "#c5a8ff");

    ctx.restore();
}

// ================================================
// ACTUALIZACIÓN Y DIBUJO
// ================================================

function update(dt) {
    elapsedTime += dt;

    for (const creature of creatures) {
        creature.update(dt);
    }

    checkCollisions();
    updateScreamer(dt);
}

function drawScene() {
    ctx.clearRect(0, 0, W, H);

    drawBackground();

    for (const creature of creatures) {
        creature.draw();
    }

    // Cursor por encima del escenario
    drawMagicCursor();
}

function gameLoop(timestamp) {
    if (!gameStarted) return;

    const dt = Math.min((timestamp - lastTime) / 1000, 0.04);
    lastTime = timestamp;

    update(dt);
    drawScene();

    animationId = requestAnimationFrame(gameLoop);
}

// ================================================
// EVENTOS
// ================================================

startButton.addEventListener("click", () => {
    startGame();

    // Intentar reproducir la música después de una interacción
    // del usuario, ya que algunos navegadores bloquean el autoplay.
    if (!musicEnabled) {
        startMusic();
    }
});

musicButton.addEventListener("click", () => {
    if (musicEnabled) {
        stopMusic();
    } else {
        startMusic();
    }
});

restartButton.addEventListener("click", () => {
    restartGame();
});

// ================================================
// INICIALIZACIÓN
// ================================================

restartGame();
drawScene();