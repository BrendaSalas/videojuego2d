const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const remainingElement = document.getElementById("remaining");
const startMessage = document.getElementById("startMessage");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const musicButton = document.getElementById("musicButton");

const W = 320;
const H = 180;
const TOTAL = 25;

let creatures = [];
let score = 0;
let running = false;
let animationId = null;
let lastTime = 0;

let mouse = {
    x: -100,
    y: -100,
    inside: false
};

let audioContext = null;
let musicEnabled = false;
let musicNodes = [];
let masterGain = null;

// Escala y desplazamiento para adaptar el mundo a la ventana.
let scaleX = 1;
let scaleY = 1;
let offsetX = 0;
let offsetY = 0;

const colors = {
    ghost: "#e9f4e9",
    pinkGhost: "#ff9bd5",
    mint: "#a6ffd1",
    pumpkin: "#ff9b43",
    purple: "#bb91ff",
    zombie: "#a5dc78"
};

const rand = (min, max) => Math.random() * (max - min) + min;
const choice = arr => arr[Math.floor(Math.random() * arr.length)];

function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(
        Math.round(x),
        Math.round(y),
        Math.max(1, Math.round(w)),
        Math.max(1, Math.round(h))
    );
}

// ================================================
// AJUSTE RESPONSIVO DEL CANVAS
// ================================================

function resizeCanvas() {
    const rectCanvas = canvas.getBoundingClientRect();

    if (rectCanvas.width <= 0 || rectCanvas.height <= 0) return;

    // Resolución interna basada en múltiplos para conservar píxeles.
    const pixelScale = Math.max(
        1,
        Math.floor(Math.min(rectCanvas.width / W, rectCanvas.height / H))
    );

    // El canvas interno conserva una proporción 16:9.
    canvas.width = W * pixelScale;
    canvas.height = H * pixelScale;

    scaleX = canvas.width / W;
    scaleY = canvas.height / H;

    drawScene();
}

window.addEventListener("resize", resizeCanvas);

// ================================================
// FONDO: CEMENTERIO PIXEL ART
// ================================================

function drawBackground() {
    rect(0, 0, W, H, "#11142d");
    rect(0, 0, W, 85, "#171a38");
    rect(0, 85, W, 55, "#20213a");

    // Luna
    rect(239, 13, 23, 23, "#b9c8d7");
    rect(235, 18, 4, 13, "#b9c8d7");
    rect(244, 9, 13, 4, "#b9c8d7");
    rect(244, 17, 5, 5, "#8798b2");
    rect(251, 26, 5, 4, "#8798b2");
    rect(239, 31, 5, 5, "#8798b2");

    // Estrellas
    for (let i = 0; i < 35; i++) {
        const x = (i * 47 + 13) % W;
        const y = (i * 29 + 7) % 68;

        rect(
            x,
            y,
            i % 4 === 0 ? 2 : 1,
            i % 4 === 0 ? 2 : 1,
            i % 3 === 0 ? "#f7d9a1" : "#a7b9e9"
        );
    }

    // Nubes
    rect(22, 24, 31, 5, "#252746");
    rect(14, 29, 43, 4, "#252746");
    rect(70, 43, 24, 4, "#222640");
    rect(63, 47, 35, 4, "#222640");
    rect(175, 27, 29, 4, "#252746");
    rect(184, 31, 31, 4, "#252746");

    // Árboles lejanos
    rect(0, 72, W, 18, "#202a3c");

    for (let x = -5; x < W; x += 19) {
        rect(x + 6, 48 + (x % 3) * 3, 4, 36, "#111a29");
        rect(x, 58 + (x % 2) * 4, 16, 17, "#182438");
        rect(x + 3, 51 + (x % 2) * 3, 10, 14, "#182438");
        rect(x + 6, 44 + (x % 3), 5, 12, "#182438");
    }

    // Suelo
    rect(0, 88, W, 92, "#29283b");
    rect(0, 91, W, 5, "#3a3948");
    rect(0, 96, W, 4, "#323246");

    // Camino
    rect(133, 95, 44, 85, "#454252");
    rect(141, 95, 29, 85, "#514b58");

    for (let y = 98; y < H; y += 12) {
        rect(136, y, 7, 1, "#29283b");
        rect(159, y + 5, 10, 1, "#393547");
    }

    // Tumbas
    drawGrave(18, 80, 17, 25, "#77748a", "#47465e");
    drawGrave(65, 85, 18, 27, "#77748a", "#4c4961");
    drawGrave(108, 81, 17, 24, "#66667d", "#44445c");
    drawGrave(202, 83, 19, 27, "#77748a", "#49465e");
    drawGrave(277, 80, 19, 29, "#858095", "#514a65");

    // Cruces
    rect(24, 83, 3, 8, "#c5b9a4");
    rect(21, 85, 9, 3, "#c5b9a4");
    rect(285, 83, 3, 9, "#d0bfa9");
    rect(282, 86, 9, 3, "#d0bfa9");

    drawDeadTree(5, 48, 1);
    drawDeadTree(302, 46, -1);

    // Vallas
    for (let x = 0; x < 64; x += 9) {
        rect(x, 112, 3, 18, "#65506d");
        rect(x - 2, 116, 7, 3, "#87677b");
    }

    rect(0, 114, 65, 3, "#87677b");
    rect(0, 125, 65, 3, "#654a68");

    for (let x = 248; x < 320; x += 9) {
        rect(x, 116, 3, 16, "#65506d");
        rect(x - 2, 119, 7, 3, "#87677b");
    }

    rect(247, 117, 73, 3, "#87677b");
    rect(247, 129, 73, 3, "#654a68");

    drawPumpkin(77, 143, 0.8);
    drawPumpkin(257, 139, 0.7);

    // Flores
    for (let i = 0; i < 22; i++) {
        const x = (i * 53 + 16) % W;
        const y = 105 + (i * 17) % 69;

        rect(x, y, 2, 5, "#527c54");
        rect(x - 2, y + 1, 2, 2, "#e49ab8");
        rect(x + 2, y + 2, 2, 2, "#b8a0ff");
    }

    // Piedras
    for (let i = 0; i < 75; i++) {
        const x = (i * 37 + 9) % W;
        const y = 97 + (i * 23) % 80;

        rect(x, y, 2, 1, i % 2 ? "#494356" : "#505047");
    }

    // Niebla
    rect(0, 105, 42, 4, "#77768b");
    rect(11, 109, 48, 3, "#53536e");
    rect(244, 105, 35, 3, "#77768b");
    rect(269, 108, 42, 4, "#53536e");
}

function drawGrave(x, y, w, h, front, shadow) {
    rect(x + 3, y + h, w + 2, 3, "#171827");
    rect(x + 2, y + 3, w, h - 2, shadow);
    rect(x, y + 5, w, h - 5, front);
    rect(x + 2, y + 1, w - 4, 7, front);
    rect(x + 4, y, w - 8, 3, front);
    rect(x + 3, y + 7, 2, h - 11, "#aaa0ad");
    rect(x + 5, y + 11, w - 10, 2, shadow);
    rect(x + 5, y + 16, w - 10, 2, shadow);
}

function drawDeadTree(x, y, direction) {
    rect(x + 4, y + 25, 6, 65, "#382b3a");
    rect(x + 2, y + 39, 4, 18, "#382b3a");
    rect(x + 3, y + 26, 3, 4, "#76506b");

    rect(x + 5, y + 30, direction * 17, 4, "#382b3a");
    rect(x + 5 + direction * 16, y + 19, 3, 15, "#382b3a");
    rect(x + 5 + direction * 16, y + 17, direction * 8, 3, "#382b3a");

    rect(x + 7, y + 44, direction * 13, 3, "#382b3a");
    rect(x + 7 + direction * 12, y + 36, 3, 11, "#382b3a");
    rect(x + 7 + direction * 12, y + 34, direction * 8, 3, "#382b3a");
}

function drawPumpkin(x, y, scale = 1) {
    const s = scale;

    rect(x + 4*s, y, 5*s, 3*s, "#59794b");
    rect(x + 2*s, y + 3*s, 10*s, 8*s, "#d96c35");
    rect(x, y + 5*s, 14*s, 5*s, "#f18b3c");
    rect(x + 4*s, y + 4*s, 2*s, 7*s, "#ffb65a");
    rect(x + 9*s, y + 4*s, 2*s, 7*s, "#b95631");
    rect(x + 3*s, y + 6*s, 2*s, 2*s, "#42243a");
    rect(x + 9*s, y + 6*s, 2*s, 2*s, "#42243a");
    rect(x + 5*s, y + 8*s, 4*s, 2*s, "#42243a");
}

// ================================================
// CLASE DE LAS CRIATURAS
// ================================================

class Creature {
    constructor() {
        this.respawn(true);
    }

    respawn(initial = false) {
        this.x = rand(12, W - 12);
        this.y = rand(18, H - 12);
        this.size = rand(5, 8);
        this.radius = this.size * 0.7;
        this.speed = rand(18, 39);

        this.type = choice(["ghost", "pumpkin", "bat", "zombie", "cat"]);
        this.movement = choice(["up", "down", "diagonal", "circular"]);
        this.color = choice(Object.values(colors));
        this.originalColor = this.color;

        this.angle = rand(0, Math.PI * 2);
        this.phase = rand(0, Math.PI * 2);
        this.flash = 0;
        this.squash = 0;
        this.squashTimer = 0;
        this.opacity = 1;
        this.fadeDirection = 0;

        this.dx = rand(-1, 1);
        this.dy = rand(-1, 1);

        if (this.movement === "up") {
            this.dx = 0;
            this.dy = -1;
        } else if (this.movement === "down") {
            this.dx = 0;
            this.dy = 1;
        } else if (this.movement === "diagonal") {
            this.dx = Math.random() < 0.5 ? -1 : 1;
            this.dy = Math.random() < 0.5 ? -1 : 1;
        }

        const length = Math.hypot(this.dx, this.dy) || 1;
        this.dx /= length;
        this.dy /= length;
    }

    update(dt) {
        if (this.squash > 0) {
            this.squashTimer -= dt;

            if (this.squashTimer <= 0) {
                this.squash = 0;
                this.respawn();
            }

            return;
        }

        this.phase += dt * 4;
        this.flash = Math.max(0, this.flash - dt);

        const velocity = this.speed * dt;

        if (this.movement === "circular") {
            this.angle += dt * (1.1 + this.speed / 40);
            this.x += Math.cos(this.angle) * velocity;
            this.y += Math.sin(this.angle) * velocity;
        } else {
            if (Math.random() < 0.018) {
                this.dx += rand(-0.25, 0.25);
                this.dy += rand(-0.25, 0.25);

                const length = Math.hypot(this.dx, this.dy) || 1;
                this.dx /= length;
                this.dy /= length;
            }

            this.x += this.dx * velocity;
            this.y += this.dy * velocity;
        }

        // Desaparecer y reaparecer brevemente.
        if (this.fadeDirection === 0 && Math.random() < 0.0008) {
            this.fadeDirection = 1;
        }

        if (this.fadeDirection !== 0) {
            this.opacity -= this.fadeDirection * dt * 2.5;

            if (this.opacity <= 0) {
                this.opacity = 0;
                this.respawn();
                this.opacity = 0;
                this.fadeDirection = -1;
            } else if (this.opacity >= 1) {
                this.opacity = 1;
                this.fadeDirection = 0;
            }
        }

        const margin = this.size + 2;

        if (this.x < margin) {
            this.x = margin;
            this.dx = Math.abs(this.dx);
            this.flash = 0.12;
        } else if (this.x > W - margin) {
            this.x = W - margin;
            this.dx = -Math.abs(this.dx);
            this.flash = 0.12;
        }

        if (this.y < margin + 5) {
            this.y = margin + 5;
            this.dy = Math.abs(this.dy);
            this.flash = 0.12;
        } else if (this.y > H - margin) {
            this.y = H - margin;
            this.dy = -Math.abs(this.dy);
            this.flash = 0.12;
        }
    }

    draw() {
        if (this.squash > 0) {
            this.drawSquashed();
            return;
        }

        ctx.save();
        ctx.globalAlpha = this.opacity;

        const x = Math.round(this.x);
        const y = Math.round(this.y + Math.sin(this.phase) * 1.2);
        const s = this.size / 10;

        rect(x - 5*s, y + 5*s, 10*s, 2*s, "#10101d");

        if (this.flash > 0) {
            rect(x - 8*s, y - 8*s, 16*s, 16*s, "#83d9ff");
            rect(x - 6*s, y - 6*s, 12*s, 12*s, "#d8f6ff");
        } else {
            this.drawSprite(x, y, s);
        }

        ctx.restore();
    }

    drawSprite(x, y, s) {
        switch (this.type) {
            case "ghost":
                this.drawGhost(x, y, s, this.color);
                break;
            case "pumpkin":
                this.drawPumpkinCreature(x, y, s);
                break;
            case "bat":
                this.drawBat(x, y, s);
                break;
            case "zombie":
                this.drawZombie(x, y, s);
                break;
            case "cat":
                this.drawCat(x, y, s);
                break;
        }
    }

    drawGhost(x, y, s, color) {
        rect(x - 4*s, y - 6*s, 8*s, 2*s, color);
        rect(x - 6*s, y - 4*s, 12*s, 8*s, color);
        rect(x - 5*s, y + 4*s, 3*s, 3*s, color);
        rect(x, y + 4*s, 3*s, 3*s, color);
        rect(x + 4*s, y + 3*s, 2*s, 2*s, color);

        rect(x - 5*s, y + 1*s, 2*s, 2*s, "#ff9bbd");
        rect(x + 3*s, y + 1*s, 2*s, 2*s, "#ff9bbd");
        rect(x - 3*s, y - 2*s, 2*s, 3*s, "#27243d");
        rect(x + 2*s, y - 2*s, 2*s, 3*s, "#27243d");
        rect(x - 1*s, y + 2*s, 2*s, 1*s, "#6e6481");
    }

    drawPumpkinCreature(x, y, s) {
        rect(x - 3*s, y - 7*s, 6*s, 3*s, "#648b4f");
        rect(x - 6*s, y - 5*s, 12*s, 9*s, "#ef8b3b");
        rect(x - 7*s, y - 2*s, 2*s, 5*s, "#d36b31");
        rect(x + 5*s, y - 2*s, 2*s, 5*s, "#d36b31");
        rect(x - 4*s, y - 4*s, 2*s, 7*s, "#ffb35b");
        rect(x + 2*s, y - 4*s, 2*s, 7*s, "#c96832");

        rect(x - 4*s, y - 1*s, 2*s, 2*s, "#35233b");
        rect(x + 2*s, y - 1*s, 2*s, 2*s, "#35233b");
        rect(x - 2*s, y + 2*s, 4*s, 2*s, "#35233b");
        rect(x - 3*s, y + 5*s, 2*s, 2*s, "#f6a04c");
        rect(x + 2*s, y + 5*s, 2*s, 2*s, "#f6a04c");
    }

    drawBat(x, y, s) {
        rect(x - 3*s, y - 3*s, 6*s, 7*s, this.color);
        rect(x - 7*s, y - 5*s, 5*s, 3*s, this.color);
        rect(x - 9*s, y - 7*s, 5*s, 4*s, this.color);
        rect(x + 2*s, y - 5*s, 5*s, 3*s, this.color);
        rect(x + 4*s, y - 7*s, 5*s, 4*s, this.color);

        rect(x - 3*s, y + 3*s, 2*s, 3*s, "#b5a0ff");
        rect(x + 2*s, y + 3*s, 2*s, 3*s, "#b5a0ff");
        rect(x - 2*s, y - 1*s, 2*s, 2*s, "#fff0b8");
        rect(x + 1*s, y - 1*s, 2*s, 2*s, "#fff0b8");
        rect(x - 1*s, y + 2*s, 2*s, 1*s, "#ff83c5");
    }

    drawZombie(x, y, s) {
        rect(x - 5*s, y - 6*s, 10*s, 9*s, this.color);
        rect(x - 4*s, y - 8*s, 8*s, 3*s, "#70594b");
        rect(x - 6*s, y - 4*s, 2*s, 5*s, "#79b45d");
        rect(x + 4*s, y - 3*s, 2*s, 4*s, "#79b45d");

        rect(x - 3*s, y - 2*s, 2*s, 2*s, "#34253b");
        rect(x + 2*s, y - 2*s, 2*s, 2*s, "#34253b");
        rect(x - 2*s, y + 2*s, 5*s, 2*s, "#f3f0d9");
        rect(x - 5*s, y + 4*s, 3*s, 3*s, "#8bbd69");
        rect(x + 2*s, y + 4*s, 3*s, 3*s, "#8bbd69");
    }

    drawCat(x, y, s) {
        rect(x - 6*s, y - 5*s, 3*s, 3*s, this.color);
        rect(x - 5*s, y - 7*s, 3*s, 3*s, this.color);
        rect(x + 3*s, y - 5*s, 3*s, 3*s, this.color);
        rect(x + 2*s, y - 7*s, 3*s, 3*s, this.color);
        rect(x - 6*s, y - 3*s, 12*s, 8*s, this.color);
        rect(x - 5*s, y + 4*s, 3*s, 3*s, this.color);
        rect(x + 2*s, y + 4*s, 3*s, 3*s, this.color);

        rect(x - 3*s, y - 1*s, 2*s, 2*s, "#29243b");
        rect(x + 2*s, y - 1*s, 2*s, 2*s, "#29243b");
        rect(x - 1*s, y + 2*s, 2*s, 1*s, "#ff9ecb");
        rect(x - 7*s, y + 1*s, 2*s, 1*s, "#ff9ecb");
        rect(x + 5*s, y + 1*s, 2*s, 1*s, "#ff9ecb");
    }

    drawSquashed() {
        const p = Math.max(0, this.squashTimer / 0.28);
        const width = this.size * 1.7 * (1.15 - p * 0.15);
        const height = Math.max(1, this.size * 0.4 * p);

        rect(this.x - width, this.y + 3, width * 2, 2, "#a4efff");
        rect(this.x - width - 2, this.y + 4, 2, 1, "#f6b4ff");
        rect(this.x + width, this.y + 4, 2, 1, "#f6b4ff");

        rect(
            this.x - width,
            this.y - height,
            width * 2,
            Math.max(2, height * 2),
            "#bdeaff"
        );

        rect(
            this.x - width + 2,
            this.y - height + 1,
            width * 2 - 4,
            Math.max(1, height),
            this.color
        );

        rect(this.x - 4, this.y - 1, 2, 2, "#27243d");
        rect(this.x + 2, this.y - 1, 2, 2, "#27243d");
    }

    containsPoint(x, y) {
        return (
            Math.abs(x - this.x) < this.size + 3 &&
            Math.abs(y - this.y) < this.size + 3 &&
            this.squash === 0
        );
    }

    squashCreature() {
        this.squash = 1;
        this.squashTimer = 0.28;
    }

    bounceFrom(other) {
        if (this.squash || other.squash) return;

        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const distance = Math.hypot(dx, dy);
        const minDistance = this.radius + other.radius;

        if (distance === 0 || distance >= minDistance) return;

        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = minDistance - distance;

        this.x -= nx * overlap / 2;
        this.y -= ny * overlap / 2;
        other.x += nx * overlap / 2;
        other.y += ny * overlap / 2;

        const relativeNormal =
            (this.dx - other.dx) * nx +
            (this.dy - other.dy) * ny;

        if (relativeNormal > 0) {
            this.dx -= relativeNormal * nx;
            this.dy -= relativeNormal * ny;
            other.dx += relativeNormal * nx;
            other.dy += relativeNormal * ny;
        }

        if (this.movement === "circular") this.angle += Math.PI;
        if (other.movement === "circular") other.angle += Math.PI;

        this.flash = 0.18;
        other.flash = 0.18;
    }
}

// ================================================
// CREACIÓN Y CONTADORES
// ================================================

function createCreatures() {
    creatures = [];

    for (let i = 0; i < TOTAL; i++) {
        const creature = new Creature();
        creatures.push(creature);
    }

    // Separar las criaturas al aparecer.
    for (let i = 0; i < creatures.length; i++) {
        for (let j = 0; j < i; j++) {
            const a = creatures[i];
            const b = creatures[j];

            if (Math.hypot(a.x - b.x, a.y - b.y) < 16) {
                a.x = rand(15, W - 15);
                a.y = rand(20, H - 15);
            }
        }
    }

    updateCounters();
}

function updateCounters() {
    scoreElement.textContent = String(score).padStart(2, "0");
    remainingElement.textContent = creatures.length;
}

// ================================================
// ACTUALIZACIÓN Y DIBUJO
// ================================================

function startGame() {
    if (running) return;

    running = true;
    startMessage.style.display = "none";
    lastTime = 0;

    animationId = requestAnimationFrame(gameLoop);
}

function restartGame() {
    running = false;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    score = 0;
    mouse = { x: -100, y: -100, inside: false };

    createCreatures();
    drawScene();

    startMessage.style.display = "flex";
    startButton.textContent = "COMENZAR JUEGO";
}

function gameLoop(timestamp) {
    if (!running) return;

    const dt = lastTime
        ? Math.min((timestamp - lastTime) / 1000, 0.04)
        : 0;

    lastTime = timestamp;

    update(dt);
    drawScene();

    animationId = requestAnimationFrame(gameLoop);
}

function update(dt) {
    creatures.forEach(creature => creature.update(dt));

    for (let i = 0; i < creatures.length; i++) {
        for (let j = i + 1; j < creatures.length; j++) {
            creatures[i].bounceFrom(creatures[j]);
        }
    }
}

function drawScene() {
    if (!canvas.width || !canvas.height) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mantener el escenario 16:9 sin deformarlo.
    const scale = Math.min(
        canvas.width / W,
        canvas.height / H
    );

    const drawWidth = W * scale;
    const drawHeight = H * scale;

    const offsetX = (canvas.width - drawWidth) / 2;
    const offsetY = (canvas.height - drawHeight) / 2;

    ctx.save();

    // Fondo exterior si la proporción de la ventana no es 16:9.
    ctx.fillStyle = "#101329";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    drawBackground();

    creatures.forEach(creature => creature.draw());

    if (mouse.inside) {
        drawCustomCursor(mouse.x, mouse.y);
    }

    ctx.restore();
}

// ================================================
// CURSOR PERSONALIZADO: VARITA MÁGICA
// ================================================

function drawCustomCursor(x, y) {
    rect(x - 1, y - 8, 2, 3, "#fff2a8");
    rect(x - 7, y - 1, 3, 2, "#ff91d2");
    rect(x + 4, y - 2, 3, 2, "#ff91d2");
    rect(x - 1, y + 5, 2, 3, "#fff2a8");

    rect(x - 2, y - 3, 3, 3, "#f4d3a0");
    rect(x, y - 5, 3, 3, "#d8b0ff");
    rect(x + 2, y - 7, 3, 3, "#d8b0ff");
    rect(x + 4, y - 9, 3, 3, "#fff0b7");
    rect(x + 5, y - 10, 3, 3, "#ffffff");
}

// ================================================
// RATÓN Y CLICS
// ================================================

function getMousePosition(event) {
    const rectCanvas = canvas.getBoundingClientRect();

    const screenX =
        (event.clientX - rectCanvas.left) / rectCanvas.width * canvas.width;

    const screenY =
        (event.clientY - rectCanvas.top) / rectCanvas.height * canvas.height;

    const scale = Math.min(
        canvas.width / W,
        canvas.height / H
    );

    return {
        x: (screenX - (canvas.width - W * scale) / 2) / scale,
        y: (screenY - (canvas.height - H * scale) / 2) / scale
    };
}

canvas.addEventListener("pointermove", event => {
    const pos = getMousePosition(event);

    mouse.x = pos.x;
    mouse.y = pos.y;
    mouse.inside = true;
});

canvas.addEventListener("pointerleave", () => {
    mouse.inside = false;
});

canvas.addEventListener("pointerdown", event => {
    if (!running) return;

    const pos = getMousePosition(event);

    for (let i = creatures.length - 1; i >= 0; i--) {
        const creature = creatures[i];

        if (creature.containsPoint(pos.x, pos.y)) {
            creature.squashCreature();
            score++;
            updateCounters();
            break;
        }
    }
});

// ================================================
// MÚSICA AMBIENTAL
// ================================================

function stopMusic() {
    if (audioContext && masterGain) {
        masterGain.gain.setTargetAtTime(
            0,
            audioContext.currentTime,
            0.1
        );
    }

    musicNodes.forEach(node => {
        try {
            node.stop();
        } catch (_) {}
    });

    musicNodes = [];
    masterGain = null;
    musicEnabled = false;

    musicButton.textContent = "♫ ACTIVAR MÚSICA";
}

async function startMusic() {
    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        alert("Tu navegador no permite reproducir la música ambiental.");
        return;
    }

    if (!audioContext) {
        audioContext = new AudioContextClass();
    }

    await audioContext.resume();

    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.035;
    masterGain.connect(audioContext.destination);

    [55, 65.41, 82.41].forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = index === 1 ? "triangle" : "sine";
        oscillator.frequency.value = frequency;
        gain.gain.value = index === 0 ? 0.5 : 0.22;

        oscillator.connect(gain);
        gain.connect(masterGain);
        oscillator.start();

        musicNodes.push(oscillator);
    });

    musicEnabled = true;
    musicButton.textContent = "♫ SILENCIAR MÚSICA";
}

// ================================================
// BOTONES E INICIALIZACIÓN
// ================================================

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);

musicButton.addEventListener("click", () => {
    if (musicEnabled) {
        stopMusic();
    } else {
        startMusic();
    }
});

createCreatures();

// Esperar a que el navegador calcule el tamaño real del Canvas.
requestAnimationFrame(() => {
    resizeCanvas();
    drawScene();
});