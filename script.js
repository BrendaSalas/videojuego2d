"use strict";

// =============================================
// CEMENTERIO PIXEL
// =============================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const remainingElement = document.getElementById("remaining");
const startMessage = document.getElementById("startMessage");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const musicButton = document.getElementById("musicButton");
const gameStatus = document.getElementById("gameStatus");

const backgroundMusic = document.getElementById("backgroundMusic");
const screamerAudio = document.getElementById("screamerAudio");
const screamerOverlay = document.getElementById("screamerOverlay");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const TOTAL_CREATURES = 25;

let creatures = [];
let particles = [];
let graves = [];
let trees = [];
let clouds = [];

let gameStarted = false;
let animationId = null;
let musicEnabled = false;
let screamerTimeout = null;
let screamerActive = false;
let lastTime = 0;
let elapsedTime = 0;

// =============================================
// UTILIDADES
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

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// =============================================
// ESCENARIO PIXEL ART
// =============================================

function createScenery() {
    graves = [];
    trees = [];
    clouds = [];

    // Tumbas
    for (let i = 0; i < 24; i++) {
        graves.push({
            x: random(15, WIDTH - 40),
            y: random(315, HEIGHT - 35),
            width: randomInt(17, 30),
            height: randomInt(24, 39),
            color: choose(["#454257", "#514b63", "#393849"]),
            cross: Math.random() > 0.65
        });
    }

    // Árboles oscuros
    for (let i = 0; i < 10; i++) {
        trees.push({
            x: random(-10, WIDTH),
            y: random(115, 285),
            size: randomInt(30, 60)
        });
    }

    // Nubes
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: random(0, WIDTH),
            y: random(25, 125),
            width: randomInt(60, 130),
            speed: random(2, 7)
        });
    }
}

function drawPixelRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawBackground() {
    // Cielo nocturno
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#090b20");
    sky.addColorStop(0.45, "#17162f");
    sky.addColorStop(1, "#292039");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Luna
    drawPixelRect(748, 48, 76, 76, "#d7d2e7");
    drawPixelRect(760, 36, 52, 12, "#d7d2e7");
    drawPixelRect(760, 124, 52, 12, "#d7d2e7");
    drawPixelRect(724, 60, 24, 52, "#d7d2e7");
    drawPixelRect(824, 60, 12, 52, "#d7d2e7");

    // Cráteres
    drawPixelRect(773, 61, 12, 12, "#aaa6c5");
    drawPixelRect(796, 89, 10, 10, "#aaa6c5");
    drawPixelRect(761, 103, 8, 8, "#aaa6c5");

    // Estrellas
    for (let i = 0; i < 48; i++) {
        const x = (i * 137 + 43) % WIDTH;
        const y = (i * 67 + 17) % 180;
        const size = i % 5 === 0 ? 4 : 2;

        drawPixelRect(
            x,
            y,
            size,
            size,
            i % 3 === 0 ? "#f8c8ff" : "#d4e9ff"
        );
    }

    // Nubes
    clouds.forEach(cloud => {
        drawPixelRect(cloud.x, cloud.y, cloud.width, 14, "#24223d");
        drawPixelRect(cloud.x + 12, cloud.y - 9, cloud.width * 0.55, 12, "#24223d");
        drawPixelRect(cloud.x + 8, cloud.y + 14, cloud.width * 0.7, 5, "#1a1930");
    });

    // Montañas lejanas
    ctx.fillStyle = "#17182c";
    ctx.beginPath();
    ctx.moveTo(0, 235);
    ctx.lineTo(110, 145);
    ctx.lineTo(200, 230);
    ctx.lineTo(340, 155);
    ctx.lineTo(460, 238);
    ctx.lineTo(600, 165);
    ctx.lineTo(720, 230);
    ctx.lineTo(850, 150);
    ctx.lineTo(WIDTH, 230);
    ctx.lineTo(WIDTH, HEIGHT);
    ctx.lineTo(0, HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Siluetas de árboles
    trees.forEach(tree => {
        const s = tree.size;
        const x = tree.x;
        const y = tree.y;

        drawPixelRect(x + s * 0.4, y + s * 0.5, s * 0.2, s, "#100e20");

        drawPixelRect(x, y + s * 0.15, s, s * 0.3, "#100e20");
        drawPixelRect(x + s * 0.15, y, s * 0.7, s * 0.25, "#100e20");
        drawPixelRect(x - s * 0.1, y + s * 0.3, s * 0.55, s * 0.25, "#100e20");
        drawPixelRect(x + s * 0.55, y + s * 0.3, s * 0.55, s * 0.25, "#100e20");
    });

    // Suelo del cementerio
    drawPixelRect(0, 295, WIDTH, HEIGHT - 295, "#292238");
    drawPixelRect(0, 295, WIDTH, 6, "#45405a");

    // Camino
    ctx.fillStyle = "#353047";
    ctx.beginPath();
    ctx.moveTo(410, 295);
    ctx.lineTo(560, 295);
    ctx.lineTo(770, HEIGHT);
    ctx.lineTo(200, HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Pasto pixelado
    for (let i = 0; i < 150; i++) {
        const x = (i * 79) % WIDTH;
        const y = 307 + ((i * 47) % (HEIGHT - 307));

        drawPixelRect(
            x,
            y,
            3,
            5,
            i % 2 === 0 ? "#435244" : "#343d42"
        );
    }

    // Tumbas
    graves
        .slice()
        .sort((a, b) => a.y - b.y)
        .forEach(grave => {
            drawGrave(grave);
        });

    // Charcos oscuros
    drawPixelRect(95, 466, 72, 7, "#211b35");
    drawPixelRect(104, 473, 54, 4, "#4c405c");
    drawPixelRect(790, 365, 65, 6, "#211b35");

    // Viñeta oscura en las orillas
    const vignette = ctx.createRadialGradient(
        WIDTH / 2, HEIGHT / 2, 110,
        WIDTH / 2, HEIGHT / 2, 570
    );

    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, "#03020bba");

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawGrave(grave) {
    const { x, y, width: w, height: h, color, cross } = grave;

    // Sombra
    drawPixelRect(x - 4, y + h - 2, w + 8, 6, "#171322");

    // Base
    drawPixelRect(x - 3, y + h - 6, w + 6, 7, "#242033");

    // Lápida
    drawPixelRect(x, y + 7, w, h - 7, color);
    drawPixelRect(x + 4, y, w - 8, 9, color);

    // Iluminación lateral
    drawPixelRect(x + 3, y + 9, 3, h - 17, "#777084");
    drawPixelRect(x + 7, y + 13, w - 14, 2, "#625a73");

    // Cruz
    if (cross) {
        drawPixelRect(x + w / 2 - 2, y + 12, 4, 13, "#c5a9d6");
        drawPixelRect(x + w / 2 - 6, y + 16, 12, 3, "#c5a9d6");
    } else {
        drawPixelRect(x + 7, y + 15, w - 14, 3, "#a69bb6");
    }
}

// =============================================
// CLASE CRIATURA
// =============================================

class Creature {
    constructor(type, x, y, size, speedX, speedY) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.size = size;

        this.speedX = speedX;
        this.speedY = speedY;

        this.baseSpeedX = speedX;
        this.baseSpeedY = speedY;

        this.alive = true;
        this.squash = 1;
        this.squashTimer = 0;
        this.flashTimer = 0;
        this.bounceTimer = 0;
        this.phase = random(0, Math.PI * 2);
        this.rotation = 0;

        this.color = this.getColor();
        this.collisionCooldown = 0;
    }

    getColor() {
        const colors = {
            ghost: "#e5e8ff",
            pumpkin: "#ff9a43",
            bat: "#a88bea",
            zombie: "#85c98b",
            cat: "#c6a5dc"
        };

        return colors[this.type];
    }

    update(delta) {
        if (!this.alive) return;

        const dt = Math.min(delta / 16.67, 2);

        this.phase += 0.045 * dt;

        if (this.squashTimer > 0) {
            this.squashTimer -= delta;
            this.squash = Math.max(0.55, this.squash - 0.025 * dt);
        } else {
            this.squash += (1 - this.squash) * 0.18;
        }

        if (this.flashTimer > 0) {
            this.flashTimer -= delta;
        }

        if (this.bounceTimer > 0) {
            this.bounceTimer -= delta;
        }

        if (this.collisionCooldown > 0) {
            this.collisionCooldown -= delta;
        }

        this.x += this.speedX * dt;
        this.y += this.speedY * dt;

        const r = this.size * 0.5;

        // Rebote horizontal
        if (this.x - r < 4) {
            this.x = r + 4;
            this.speedX = Math.abs(this.speedX);
        } else if (this.x + r > WIDTH - 4) {
            this.x = WIDTH - r - 4;
            this.speedX = -Math.abs(this.speedX);
        }

        // Rebote vertical: se mantiene dentro del cementerio
        if (this.y - r < 150) {
            this.y = 150 + r;
            this.speedY = Math.abs(this.speedY);
        } else if (this.y + r > HEIGHT - 12) {
            this.y = HEIGHT - r - 12;
            this.speedY = -Math.abs(this.speedY);
        }
    }

    draw() {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));

        // Aplastar: ancho mayor y altura menor
        const squashX = 1 + (1 - this.squash) * 0.65;
        const squashY = this.squash;

        ctx.scale(squashX, squashY);

        // Sombra
        ctx.fillStyle = "#08060e99";
        ctx.fillRect(-this.size * 0.4, this.size * 0.35, this.size * 0.8, 5);

        if (this.flashTimer > 0) {
            ctx.shadowColor = "#9cffd0";
            ctx.shadowBlur = 14;
        }

        this.drawSprite();

        ctx.restore();
    }

    drawSprite() {
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
    }

    drawGhost() {
        const s = this.size;
        const w = s * 0.72;
        const h = s * 0.85;

        // Aura
        ctx.fillStyle = "#aebaff24";
        ctx.fillRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);

        // Cuerpo
        ctx.fillStyle = this.flashTimer > 0 ? "#9cffd0" : "#dfe5ff";
        ctx.fillRect(-w / 2, -h / 2 + 5, w, h - 8);
        ctx.fillRect(-w / 2 + 4, -h / 2, w - 8, h - 3);

        // Ondulaciones inferiores
        ctx.fillRect(-w / 2, h / 2 - 5, w * 0.25, 6);
        ctx.fillRect(-w / 2 + w * 0.42, h / 2 - 5, w * 0.25, 6);
        ctx.fillRect(w / 2 - 6, h / 2 - 5, 6, 6);

        // Sombreado
        ctx.fillStyle = "#a5b1d8";
        ctx.fillRect(-w / 2 + 3, -h / 2 + 8, 4, h * 0.55);

        // Ojos
        ctx.fillStyle = "#25213b";
        ctx.fillRect(-w * 0.27, -h * 0.15, 5, 8);
        ctx.fillRect(w * 0.08, -h * 0.15, 5, 8);

        // Boca
        ctx.fillStyle = "#514568";
        ctx.fillRect(-3, h * 0.12, 6, 6);

        // Brillo
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-w / 2 + 6, -h / 2 + 5, 4, 4);
    }

    drawPumpkin() {
        const s = this.size;
        const w = s * 0.86;
        const h = s * 0.7;

        // Tallo
        ctx.fillStyle = "#64834e";
        ctx.fillRect(-4, -h / 2 - 7, 8, 10);
        ctx.fillRect(0, -h / 2 - 8, 7, 4);

        // Cuerpo
        ctx.fillStyle = this.flashTimer > 0 ? "#9cffd0" : "#e87b32";
        ctx.fillRect(-w / 2 + 5, -h / 2, w - 10, h);
        ctx.fillRect(-w / 2, -h / 2 + 6, w, h - 12);
        ctx.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);

        // Segmentos
        ctx.fillStyle = "#b95228";
        ctx.fillRect(-w * 0.27, -h / 2 + 4, 4, h - 8);
        ctx.fillRect(w * 0.22, -h / 2 + 4, 4, h - 8);

        // Cara
        ctx.fillStyle = "#382039";
        ctx.fillRect(-w * 0.3, -h * 0.15, 8, 8);
        ctx.fillRect(w * 0.12, -h * 0.15, 8, 8);
        ctx.fillRect(-w * 0.1, h * 0.12, 7, 8);
        ctx.fillRect(0, h * 0.22, 9, 4);

        // Luz
        ctx.fillStyle = "#ffca6b";
        ctx.fillRect(-w * 0.31, -h * 0.2, 3, 3);
    }

    drawBat() {
        const s = this.size;
        const wing = Math.sin(this.phase * 5) * 5;

        // Alas
        ctx.fillStyle = "#66508c";
        ctx.fillRect(-s / 2, -5 + wing, s * 0.32, s * 0.38);
        ctx.fillRect(-s / 2 - 5, 0 + wing, s * 0.2, s * 0.28);
        ctx.fillRect(s * 0.18, -5 - wing, s * 0.32, s * 0.38);
        ctx.fillRect(s * 0.3, 0 - wing, s * 0.2, s * 0.28);

        // Cuerpo
        ctx.fillStyle = this.flashTimer > 0 ? "#9cffd0" : "#8e75c5";
        ctx.fillRect(-s * 0.18, -s * 0.2, s * 0.36, s * 0.48);
        ctx.fillRect(-s * 0.24, -s * 0.1, s * 0.48, s * 0.22);

        // Orejas
        ctx.fillStyle = "#8e75c5";
        ctx.fillRect(-s * 0.19, -s * 0.3, 5, 9);
        ctx.fillRect(s * 0.08, -s * 0.3, 5, 9);

        // Ojos
        ctx.fillStyle = "#ff9acb";
        ctx.fillRect(-s * 0.13, -s * 0.04, 4, 4);
        ctx.fillRect(s * 0.05, -s * 0.04, 4, 4);
    }

    drawZombie() {
        const s = this.size;
        const w = s * 0.68;
        const h = s * 0.75;

        // Brazos
        ctx.fillStyle = "#669e70";
        ctx.fillRect(-w / 2 - 8, -2, 10, 5);
        ctx.fillRect(w / 2 - 1, -4, 10, 5);

        // Cuerpo
        ctx.fillStyle = "#668b63";
        ctx.fillRect(-w / 2, -h / 2 + 10, w, h - 8);

        // Cabeza
        ctx.fillStyle = this.flashTimer > 0 ? "#9cffd0" : "#8fc48b";
        ctx.fillRect(-w / 2 + 2, -h / 2, w - 4, h * 0.52);

        // Cabello
        ctx.fillStyle = "#303441";
        ctx.fillRect(-w / 2 + 1, -h / 2, w - 2, 6);
        ctx.fillRect(-w / 2 + 4, -h / 2 - 4, 7, 6);

        // Ojos desiguales
        ctx.fillStyle = "#29233b";
        ctx.fillRect(-w * 0.25, -h * 0.15, 5, 6);
        ctx.fillRect(w * 0.1, -h * 0.12, 5, 5);

        ctx.fillStyle = "#e5b9d7";
        ctx.fillRect(-w * 0.23, -h * 0.13, 2, 2);

        // Boca
        ctx.fillStyle = "#35233b";
        ctx.fillRect(-w * 0.18, h * 0.05, w * 0.38, 6);

        // Ropa rota
        ctx.fillStyle = "#444b69";
        ctx.fillRect(-w / 2, h * 0.25, w, 7);
        ctx.fillRect(-w / 2 + 7, h * 0.4, 5, 6);
    }

    drawCat() {
        const s = this.size;
        const w = s * 0.7;
        const h = s * 0.7;

        // Orejas
        ctx.fillStyle = "#a989b9";
        ctx.fillRect(-w / 2, -h / 2, 10, 13);
        ctx.fillRect(w / 2 - 10, -h / 2, 10, 13);

        // Interior de orejas
        ctx.fillStyle = "#e5a0c7";
        ctx.fillRect(-w / 2 + 3, -h / 2 + 4, 4, 5);
        ctx.fillRect(w / 2 - 7, -h / 2 + 4, 4, 5);

        // Cabeza
        ctx.fillStyle = this.flashTimer > 0 ? "#9cffd0" : "#a989b9";
        ctx.fillRect(-w / 2, -h / 2 + 7, w, h * 0.68);

        // Mejillas
        ctx.fillStyle = "#d4b5df";
        ctx.fillRect(-w / 2 + 3, h * 0.05, 8, 6);
        ctx.fillRect(w / 2 - 11, h * 0.05, 8, 6);

        // Ojos
        ctx.fillStyle = "#c7ffb2";
        ctx.fillRect(-w * 0.28, -h * 0.08, 6, 8);
        ctx.fillRect(w * 0.1, -h * 0.08, 6, 8);

        ctx.fillStyle = "#242039";
        ctx.fillRect(-w * 0.23, -h * 0.05, 2, 6);
        ctx.fillRect(w * 0.15, -h * 0.05, 2, 6);

        // Nariz y boca
        ctx.fillStyle = "#ff8dbd";
        ctx.fillRect(-2, h * 0.13, 4, 3);

        ctx.fillStyle = "#44304e";
        ctx.fillRect(-5, h * 0.2, 3, 4);
        ctx.fillRect(2, h * 0.2, 3, 4);

        // Bigotes
        ctx.fillRect(-w / 2 - 4, h * 0.1, 8, 2);
        ctx.fillRect(w / 2 - 4, h * 0.1, 8, 2);
    }

    squashOnCollision() {
        this.squash = 0.58;
        this.squashTimer = 180;
        this.flashTimer = 220;
        this.bounceTimer = 180;
    }

    containsPoint(x, y) {
        const half = this.size * 0.65;

        return this.alive &&
            x >= this.x - half &&
            x <= this.x + half &&
            y >= this.y - half &&
            y <= this.y + half;
    }
}

// =============================================
// CREAR CRIATURAS
// =============================================

function createCreatures() {
    creatures = [];

    const types = [
        "ghost", "ghost", "ghost", "ghost", "ghost",
        "pumpkin", "pumpkin", "pumpkin", "pumpkin", "pumpkin",
        "bat", "bat", "bat", "bat", "bat",
        "zombie", "zombie", "zombie", "zombie", "zombie",
        "cat", "cat", "cat", "cat", "cat"
    ];

    types.forEach(type => {
        const size = randomInt(23, 34);

        creatures.push(
            new Creature(
                type,
                random(45, WIDTH - 45),
                random(180, HEIGHT - 35),
                size,
                random(-2.1, 2.1) || 1,
                random(-1.8, 1.8) || 1
            )
        );
    });

    remainingElement.textContent = creatures.length;
}

// =============================================
// PARTÍCULAS PIXEL
// =============================================

function createParticles(x, y, color, amount = 10) {
    for (let i = 0; i < amount; i++) {
        particles.push({
            x,
            y,
            vx: random(-3, 3),
            vy: random(-4, 1),
            size: randomInt(2, 5),
            life: randomInt(250, 550),
            maxLife: 550,
            color
        });
    }
}

function updateParticles(delta) {
    const dt = Math.min(delta / 16.67, 2);

    particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.08 * dt;
        p.life -= delta;
    });

    particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    });

    ctx.globalAlpha = 1;
}

// =============================================
// COLISIONES Y APLASTAMIENTO
// =============================================

function handleCollisions() {
    for (let i = 0; i < creatures.length; i++) {
        const a = creatures[i];

        if (!a.alive) continue;

        for (let j = i + 1; j < creatures.length; j++) {
            const b = creatures[j];

            if (!b.alive) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.hypot(dx, dy);
            const minDistance = (a.size + b.size) * 0.43;

            if (distance < minDistance) {
                // Evitar que queden completamente superpuestas
                const nx = distance === 0 ? 1 : dx / distance;
                const ny = distance === 0 ? 0 : dy / distance;
                const overlap = minDistance - distance;

                a.x -= nx * overlap * 0.5;
                a.y -= ny * overlap * 0.5;
                b.x += nx * overlap * 0.5;
                b.y += ny * overlap * 0.5;

                // Intercambio de velocidad en la dirección del choque
                const relativeX = a.speedX - b.speedX;
                const relativeY = a.speedY - b.speedY;
                const approaching = relativeX * nx + relativeY * ny;

                if (approaching > 0) {
                    a.speedX -= approaching * nx * 0.85;
                    a.speedY -= approaching * ny * 0.85;
                    b.speedX += approaching * nx * 0.85;
                    b.speedY += approaching * ny * 0.85;
                } else {
                    // Separar suavemente cuando se mueven en direcciones parecidas
                    a.speedX -= nx * 0.3;
                    a.speedY -= ny * 0.3;
                    b.speedX += nx * 0.3;
                    b.speedY += ny * 0.3;
                }

                // Efecto de aplastamiento en ambos personajes
                if (a.collisionCooldown <= 0 || b.collisionCooldown <= 0) {
                    a.squashOnCollision();
                    b.squashOnCollision();

                    a.collisionCooldown = 160;
                    b.collisionCooldown = 160;

                    createParticles(
                        (a.x + b.x) / 2,
                        (a.y + b.y) / 2,
                        "#9cffd0",
                        5
                    );
                }

                // Evitar que la velocidad se vuelva demasiado pequeña
                if (Math.abs(a.speedX) < 0.5) {
                    a.speedX = a.speedX < 0 ? -0.8 : 0.8;
                }

                if (Math.abs(b.speedX) < 0.5) {
                    b.speedX = b.speedX < 0 ? -0.8 : 0.8;
                }
            }
        }
    }
}

// =============================================
// CAPTURAR CRIATURAS CON EL RATÓN
// =============================================

function getCanvasPosition(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) * (WIDTH / rect.width),
        y: (event.clientY - rect.top) * (HEIGHT / rect.height)
    };
}

canvas.addEventListener("click", event => {
    if (!gameStarted || screamerActive) return;

    const position = getCanvasPosition(event);

    // Primero se comprueba la criatura visualmente más cercana al frente
    for (let i = creatures.length - 1; i >= 0; i--) {
        const creature = creatures[i];

        if (creature.containsPoint(position.x, position.y)) {
            creature.alive = false;

            createParticles(
                creature.x,
                creature.y,
                creature.color,
                18
            );

            remainingElement.textContent =
                creatures.filter(c => c.alive).length;

            gameStatus.textContent = "¡CRIATURA CAPTURADA!";

            if (creatures.every(c => !c.alive)) {
                finishGame();
            } else {
                setTimeout(() => {
                    if (gameStarted && !screamerActive) {
                        gameStatus.textContent = "SIGUE EXPLORANDO...";
                    }
                }, 800);
            }

            break;
        }
    }
});

// =============================================
// SCREAMER
// =============================================

function scheduleScreamer() {
    clearTimeout(screamerTimeout);

    if (!gameStarted) return;

    // Aparición aleatoria entre 35 y 60 segundos
    const delay = randomInt(35000, 60000);

    screamerTimeout = setTimeout(() => {
        if (gameStarted) {
            showScreamer();
        }
    }, delay);
}

function showScreamer() {
    if (!gameStarted || screamerActive) return;

    screamerActive = true;
    screamerOverlay.classList.add("active");
    screamerOverlay.setAttribute("aria-hidden", "false");

    try {
        screamerAudio.currentTime = 0;
        screamerAudio.volume = 1;

        const playback = screamerAudio.play();

        if (playback && typeof playback.catch === "function") {
            playback.catch(() => {
                // El juego continúa aunque el navegador bloquee el audio
            });
        }
    } catch (error) {
        console.warn("No se pudo reproducir el screamer.", error);
    }

    setTimeout(() => {
        hideScreamer();
    }, 1600);
}

function hideScreamer() {
    screamerOverlay.classList.remove("active");
    screamerOverlay.setAttribute("aria-hidden", "true");
    screamerActive = false;

    if (gameStarted) {
        scheduleScreamer();
    }
}

// =============================================
// MÚSICA AMBIENTAL
// =============================================

async function toggleMusic() {
    if (musicEnabled) {
        backgroundMusic.pause();
        musicEnabled = false;
        musicButton.textContent = "♫ ACTIVAR MÚSICA";
        return;
    }

    try {
        await backgroundMusic.play();

        musicEnabled = true;
        musicButton.textContent = "♫ SILENCIAR MÚSICA";
    } catch (error) {
        musicEnabled = false;
        musicButton.textContent = "♫ INTENTAR DE NUEVO";

        console.warn(
            "No se pudo reproducir la música. Comprueba el archivo de audio.",
            error
        );
    }
}

musicButton.addEventListener("click", toggleMusic);

// =============================================
// BUCLE PRINCIPAL
// =============================================

function update(delta) {
    if (!gameStarted || screamerActive) return;

    elapsedTime += delta;

    // Movimiento de nubes
    clouds.forEach(cloud => {
        cloud.x += cloud.speed * delta / 1000;

        if (cloud.x > WIDTH + cloud.width) {
            cloud.x = -cloud.width;
        }
    });

    creatures.forEach(creature => creature.update(delta));

    handleCollisions();
    updateParticles(delta);
}

function render() {
    drawBackground();

    // Ordenar por profundidad: las criaturas de abajo aparecen delante
    const orderedCreatures = creatures
        .filter(c => c.alive)
        .slice()
        .sort((a, b) => a.y - b.y);

    orderedCreatures.forEach(creature => creature.draw());

    drawParticles();

    if (gameStarted && !screamerActive) {
        drawCrosshair();
    }
}

function drawCrosshair() {
    // Pequeño destello decorativo en el centro del escenario
    // El cursor real del navegador permanece funcional.
}

function gameLoop(timestamp) {
    if (!gameStarted) return;

    const delta = lastTime === 0
        ? 16.67
        : Math.min(timestamp - lastTime, 50);

    lastTime = timestamp;

    update(delta);
    render();

    animationId = requestAnimationFrame(gameLoop);
}

// =============================================
// INICIAR, TERMINAR Y REINICIAR
// =============================================

function startGame() {
    if (gameStarted) return;

    gameStarted = true;
    startMessage.classList.add("hidden");

    lastTime = 0;
    elapsedTime = 0;

    gameStatus.textContent = "SOBREVIVE A LA NOCHE";

    createCreatures();
    particles = [];

    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);

    scheduleScreamer();
}

function finishGame() {
    gameStarted = false;

    cancelAnimationFrame(animationId);
    clearTimeout(screamerTimeout);

    gameStatus.textContent = "¡CEMENTERIO LIMPIO!";

    render();

    startMessage.classList.remove("hidden");

    startMessage.querySelector("h2").textContent =
        "¡LO LOGRASTE!";

    startMessage.querySelector("p").textContent =
        "Has capturado a todas las criaturas.";

    startMessage.querySelector(".small-instruction").textContent =
        "Pero algo sigue escondido en la oscuridad...";

    startButton.textContent = "JUGAR DE NUEVO";
}

function restartGame() {
    gameStarted = false;
    screamerActive = false;

    cancelAnimationFrame(animationId);
    clearTimeout(screamerTimeout);

    screamerOverlay.classList.remove("active");
    screamerOverlay.setAttribute("aria-hidden", "true");

    screamerAudio.pause();
    screamerAudio.currentTime = 0;

    // La música se conserva en su estado actual.
    creatures = [];
    particles = [];

    createScenery();
    createCreatures();

    startMessage.classList.remove("hidden");

    startMessage.querySelector("h2").textContent =
        "¡BIENVENIDA AL CEMENTERIO!";

    startMessage.querySelector("p").textContent =
        "Encuentra a las criaturas y haz clic sobre ellas.";

    startMessage.querySelector(".small-instruction").textContent =
        "Ten cuidado... algo te observa desde la oscuridad.";

    startButton.textContent = "COMENZAR JUEGO";
    gameStatus.textContent = "PREPARA TU VARITA";

    lastTime = 0;
    render();
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);

// =============================================
// INICIALIZACIÓN
// =============================================

function initializeGame() {
    createScenery();
    createCreatures();
    render();
}

initializeGame();