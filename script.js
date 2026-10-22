const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const remainingElement = document.getElementById("remaining");
const startMessage = document.getElementById("startMessage");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const musicButton = document.getElementById("musicButton");

canvas.width = 960;
canvas.height = 540;

const W = 320;
const H = 180;
const TOTAL = 25;

let creatures = [];
let particles = [];
let wandSparks = [];
let score = 0;
let running = false;
let animationId = null;
let lastTime = 0;
let mouse = { x: -100, y: -100, inside: false };

// --------------------------------------------------
// CONFIGURACIÓN DE AUDIO
// --------------------------------------------------
function loadAudio(filename) {
    const audio = new Audio(filename);
    audio.onerror = () => {
        audio.src = "assets/" + filename;
    };
    return audio;
}

const bgMusic = loadAudio("terror.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;

const screamerSFX = loadAudio("screamer.mp3");
screamerSFX.loop = false;
screamerSFX.volume = 0.85;

let musicEnabled = false;

// Variables Screamer
let screamerActive = false;
let screamerTimer = 0;
let screamerFlash = false;
let nextScreamerTime = 0;

// PALETA DE COLORES REALISTA / SPOOKY-KAWAII INTEGRADA
const colors = {
    ghost: "#d0e3d4",       // Fantasma ectoplasma suave (blanco verdoso de tumba)
    witch: "#4a325a",       // Bruja (púrpura noche profundo)
    mint: "#71bda4",        // Murciélago (verde musgo / menta apagado)
    pumpkin: "#d4753b",     // Calabaza (naranja terracota maduro)
    cat: "#221d2b",         // Gato místico (negro noche con matiz violeta)
    zombie: "#728d61"       // Zombie (verde olivo)
};

const rand = (min, max) => Math.random() * (max - min) + min;
const choice = arr => arr[Math.floor(Math.random() * arr.length)];

function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// --------------------------------------------------
// DIBUJO DEL CEMENTERIO
// --------------------------------------------------

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
    for (let i = 0; i < 45; i++) {
        const x = (i * 47 + 13) % W;
        const y = (i * 29 + 7) % 68;
        rect(x, y, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1, i % 3 === 0 ? "#f7d9a1" : "#a7b9e9");
    }

    // Murciélagos
    rect(45, 18, 3, 1, "#252746"); rect(49, 18, 3, 1, "#252746"); rect(47, 19, 3, 1, "#252746");
    rect(185, 12, 3, 1, "#252746"); rect(189, 12, 3, 1, "#252746"); rect(187, 13, 3, 1, "#252746");

    // Nubes
    rect(22, 24, 31, 5, "#252746");
    rect(14, 29, 43, 4, "#252746");
    rect(70, 43, 24, 4, "#222640");
    rect(63, 47, 35, 4, "#222640");
    rect(175, 27, 29, 4, "#252746");
    rect(184, 31, 31, 4, "#252746");

    // Montañas
    rect(0, 72, 320, 18, "#202a3c");
    for (let x = -5; x < W; x += 19) {
        rect(x + 6, 48 + (x % 3) * 3, 4, 36, "#111a29");
        rect(x, 58 + (x % 2) * 4, 16, 17, "#182438");
        rect(x + 3, 51 + (x % 2) * 3, 10, 14, "#182438");
        rect(x + 6, 44 + (x % 3), 5, 12, "#182438");
    }

    // Suelo uniforme sin sendero
    rect(0, 88, W, 92, "#29283b");
    rect(0, 91, W, 5, "#3a3948");
    rect(0, 96, W, 4, "#323246");

    // Mausoleo
    drawMausoleum(135, 68);

    // Lápidas
    drawGrave(18, 80, 17, 25, "#77748a", "#47465e");
    drawGrave(65, 85, 18, 27, "#77748a", "#4c4961");
    drawGrave(108, 81, 17, 24, "#66667d", "#44445c");
    drawGrave(180, 86, 16, 25, "#66667d", "#44445c");
    drawGrave(135, 115, 15, 22, "#58566b", "#3d3c4d");
    drawGrave(202, 83, 19, 27, "#77748a", "#49465e");
    drawGrave(277, 80, 19, 29, "#858095", "#514a65");

    // Cruces
    rect(24, 83, 3, 8, "#c5b9a4"); rect(21, 85, 9, 3, "#c5b9a4");
    rect(285, 83, 3, 9, "#d0bfa9"); rect(282, 86, 9, 3, "#d0bfa9");
    rect(184, 88, 2, 7, "#c5b9a4"); rect(182, 90, 6, 2, "#c5b9a4");

    // Ataúd
    drawCoffin(155, 145);

    // Árboles
    drawDeadTree(5, 48, 1);
    drawDeadTree(302, 46, -1);

    // Vallas
    for (let x = 0; x < 90; x += 9) {
        rect(x, 112, 3, 18, "#65506d");
        rect(x - 2, 116, 7, 3, "#87677b");
    }
    rect(0, 114, 91, 3, "#87677b");
    rect(0, 125, 91, 3, "#654a68");

    for (let x = 220; x < 320; x += 9) {
        rect(x, 116, 3, 16, "#65506d");
        rect(x - 2, 119, 7, 3, "#87677b");
    }
    rect(219, 117, 101, 3, "#87677b");
    rect(219, 129, 101, 3, "#654a68");

    // Calabazas
    drawPumpkin(77, 143, 0.8);
    drawPumpkin(257, 139, 0.7);
    drawPumpkin(120, 130, 0.65);

    // Flores y calaveras
    for (let i = 0; i < 28; i++) {
        const x = (i * 43 + 12) % W;
        const y = 105 + (i * 19) % 68;
        rect(x, y, 2, 5, "#527c54");
        rect(x - 2, y + 1, 2, 2, "#e49ab8");
        rect(x + 2, y + 2, 2, 2, "#b8a0ff");
    }

    drawSkull(45, 158);
    drawSkull(225, 162);
    drawSkull(110, 165);

    for (let i = 0; i < 85; i++) {
        const x = (i * 37 + 9) % W;
        const y = 97 + (i * 23) % 80;
        rect(x, y, 2, 1, i % 2 ? "#494356" : "#505047");
    }

    // Niebla
    rect(0, 105, 55, 4, "rgba(119, 118, 139, 0.5)");
    rect(11, 109, 68, 3, "rgba(83, 83, 110, 0.5)");
    rect(130, 155, 60, 4, "rgba(119, 118, 139, 0.4)");
    rect(230, 105, 55, 3, "rgba(119, 118, 139, 0.5)");
    rect(250, 108, 62, 4, "rgba(83, 83, 110, 0.5)");
}

function drawMausoleum(x, y) {
    rect(x, y + 8, 32, 22, "#4d4a5e");
    rect(x + 2, y + 10, 28, 18, "#393847");
    rect(x - 3, y + 5, 38, 4, "#66647a");
    rect(x + 2, y + 1, 28, 5, "#525063");
    rect(x + 11, y + 14, 10, 14, "#1d1c26");
    rect(x + 12, y + 16, 3, 12, "#393847");
    rect(x + 17, y + 16, 3, 12, "#393847");
    rect(x + 15, y - 3, 2, 5, "#a19da8");
    rect(x + 13, y - 1, 6, 2, "#a19da8");
}

function drawCoffin(x, y) {
    rect(x - 4, y + 2, 22, 8, "#1d1b26");
    rect(x - 2, y + 4, 18, 5, "#3d2d24");
    rect(x, y, 14, 6, "#5c4028");
    rect(x + 2, y - 2, 10, 3, "#704f33");
    rect(x + 5, y + 1, 4, 2, "#a18a4a");
}

function drawSkull(x, y) {
    rect(x, y, 4, 3, "#d9d2c5");
    rect(x + 1, y + 3, 2, 1, "#d9d2c5");
    rect(x + 1, y + 1, 1, 1, "#29283b");
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

// --------------------------------------------------
// PARTÍCULAS
// --------------------------------------------------

function createSplatter(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x, y: y,
            vx: rand(-30, 30), vy: rand(-20, 10),
            color: color, life: rand(0.2, 0.4)
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = wandSparks.length - 1; i >= 0; i--) {
        const s = wandSparks[i];
        s.y += s.vy * dt;
        s.x += s.vx * dt;
        s.life -= dt;
        if (s.life <= 0) wandSparks.splice(i, 1);
    }
}

function drawParticles() {
    particles.forEach(p => rect(p.x, p.y, 2, 2, p.color));
    wandSparks.forEach(s => rect(s.x, s.y, 1, 1, s.color));
}

// --------------------------------------------------
// CLASE CRIATURA
// --------------------------------------------------

class Creature {
    constructor() {
        this.respawn(true);
    }

    respawn(initial = false) {
        this.x = rand(10, W - 10);
        this.y = rand(18, H - 12);
        this.size = rand(8, 12);
        this.speed = rand(18, 39);
        this.type = choice(["ghost", "pumpkin", "bat", "zombie", "cat", "witch"]);
        this.movement = choice(["up", "down", "diagonal", "circular"]);
        this.color = colors[this.type] || choice(Object.values(colors));
        this.angle = rand(0, Math.PI * 2);
        this.phase = rand(0, Math.PI * 2);
        this.flash = 0;
        this.squash = 0;
        this.squashTimer = 0;
        this.opacity = 1;
        this.fadeDirection = 0;
        this.radius = this.size * 0.7;
        this.dx = rand(-1, 1);
        this.dy = rand(-1, 1);

        if (this.movement === "up") { this.dx = 0; this.dy = -1; }
        else if (this.movement === "down") { this.dx = 0; this.dy = 1; }
        else if (this.movement === "diagonal") {
            const sign = Math.random() < 0.5 ? -1 : 1;
            this.dx = sign;
            this.dy = sign * (Math.random() < 0.5 ? 1 : -1);
        }

        const length = Math.hypot(this.dx, this.dy) || 1;
        this.dx /= length;
        this.dy /= length;

        if (!initial) {
            this.x = rand(12, W - 12);
            this.y = rand(22, H - 12);
        }
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
            case "ghost": this.drawGhost(x, y, s, this.color); break;
            case "pumpkin": this.drawPumpkinCreature(x, y, s); break;
            case "bat": this.drawBat(x, y, s); break;
            case "zombie": this.drawZombie(x, y, s); break;
            case "cat": this.drawCat(x, y, s); break;
            case "witch": this.drawWitch(x, y, s); break;
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
        rect(x - 5*s, y - 6*s, 3*s, 3*s, this.color);
        rect(x + 2*s, y - 6*s, 3*s, 3*s, this.color);
        rect(x - 4*s, y - 5*s, 1*s, 2*s, "#e899b9");
        rect(x + 3*s, y - 5*s, 1*s, 2*s, "#e899b9");

        rect(x - 5*s, y - 3*s, 10*s, 7*s, this.color);
        rect(x - 4*s, y + 4*s, 3*s, 3*s, this.color);
        rect(x + 1*s, y + 4*s, 3*s, 3*s, this.color);

        rect(x - 3*s, y - 1*s, 2*s, 2*s, "#fce373");
        rect(x + 1*s, y - 1*s, 2*s, 2*s, "#fce373");
        rect(x - 2*s, y - 1*s, 1*s, 2*s, "#15101a");
        rect(x + 2*s, y - 1*s, 1*s, 2*s, "#15101a");

        rect(x - 1*s, y + 1*s, 2*s, 1*s, "#e899b9");
        rect(x - 7*s, y, 2*s, 1*s, "#837993");
        rect(x + 5*s, y, 2*s, 1*s, "#837993");
    }

    drawWitch(x, y, s) {
        rect(x - 1*s, y - 9*s, 2*s, 2*s, "#1f1829");
        rect(x - 2*s, y - 7*s, 4*s, 2*s, "#1f1829");
        rect(x - 3*s, y - 5*s, 6*s, 2*s, "#8a4f7d");
        rect(x - 6*s, y - 3*s, 12*s, 2*s, "#1f1829");

        rect(x - 4*s, y - 1*s, 8*s, 4*s, "#d9c5b2");
        rect(x - 5*s, y - 1*s, 2*s, 6*s, "#2a2233");
        rect(x + 3*s, y - 1*s, 2*s, 6*s, "#2a2233");

        rect(x - 3*s, y, 2*s, 2*s, "#71bda4");
        rect(x + 1*s, y, 2*s, 2*s, "#71bda4");

        rect(x - 4*s, y + 3*s, 8*s, 5*s, this.color);
        rect(x - 5*s, y + 6*s, 10*s, 2*s, this.color);
    }

    drawSquashed() {
        const p = Math.max(0, this.squashTimer / 0.28);
        const width = this.size * 1.8 * (1.2 - p * 0.2);
        const height = Math.max(1, this.size * 0.25 * p);

        ctx.save();
        ctx.globalAlpha = 0.9;

        rect(this.x - width - 2, this.y + 1, width * 2 + 4, 3, "#ff3366");
        rect(this.x - width, this.y + 2, width * 2, 2, "#ffffff");

        rect(
            this.x - width,
            this.y - height,
            width * 2,
            Math.max(2, height * 2),
            this.color
        );

        rect(this.x - 5, this.y - 1, 2, 2, "#000000");
        rect(this.x + 3, this.y - 1, 2, 2, "#000000");

        ctx.restore();
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
        createSplatter(this.x, this.y, this.color);
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

// --------------------------------------------------
// SCREAMER
// --------------------------------------------------

function scheduleNextScreamer() {
    nextScreamerTime = rand(15, 30);
}

function triggerScreamer() {
    screamerActive = true;
    screamerTimer = 0.8;
    
    screamerSFX.currentTime = 0;
    screamerSFX.play().catch(err => {
        console.log("Error de interacción al reproducir el screamer:", err);
    });
}

function updateScreamer(dt) {
    if (!running) return;

    if (!screamerActive) {
        nextScreamerTime -= dt;
        if (nextScreamerTime <= 0) {
            triggerScreamer();
            scheduleNextScreamer();
        }
    } else {
        screamerTimer -= dt;
        screamerFlash = !screamerFlash;
        if (screamerTimer <= 0) {
            screamerActive = false;
        }
    }
}

function drawScreamer() {
    if (!screamerActive) return;

    rect(0, 0, W, H, screamerFlash ? "#ff0033" : "#000000");

    const cx = W / 2;
    const cy = H / 2;

    rect(cx - 50, cy - 60, 100, 110, "#ffffff");
    rect(cx - 40, cy - 70, 80, 130, "#ffffff");

    rect(cx - 35, cy - 35, 25, 30, "#000000");
    rect(cx + 10, cy - 35, 25, 30, "#000000");
    rect(cx - 28, cy - 25, 12, 12, "#ff0000");
    rect(cx + 17, cy - 25, 12, 12, "#ff0000");

    rect(cx - 30, cy + 10, 60, 40, "#000000");
    rect(cx - 25, cy + 10, 8, 15, "#ffffff");
    rect(cx - 10, cy + 10, 8, 20, "#ffffff");
    rect(cx + 2, cy + 10, 8, 20, "#ffffff");
    rect(cx + 17, cy + 10, 8, 15, "#ffffff");

    rect(cx - 20, cy + 30, 8, 15, "#ffffff");
    rect(cx + 12, cy + 30, 8, 15, "#ffffff");

    rect(cx - 45, cy - 50, 6, 20, "#880000");
    rect(cx + 38, cy - 40, 6, 30, "#880000");
    rect(cx - 15, cy + 45, 30, 10, "#880000");
}

// --------------------------------------------------
// CURSOR: VARITA MÁGICA
// --------------------------------------------------

function drawCustomCursor(x, y) {
    ctx.save();

    rect(x - 2, y + 2, 2, 7, "#6e4a27");
    rect(x - 1, y, 2, 3, "#9b6b3c");

    rect(x - 2, y - 3, 3, 3, "#9d6bff");
    rect(x - 1, y - 5, 2, 2, "#9dffb0");
    rect(x, y - 6, 1, 1, "#ffffff");

    rect(x - 5, y - 4, 2, 1, "#ff83c5");
    rect(x + 3, y - 4, 2, 1, "#ff83c5");
    rect(x - 1, y - 8, 1, 2, "#fff2ce");

    if (Math.random() < 0.35) {
        wandSparks.push({
            x: x + rand(-4, 4),
            y: y + rand(-4, 4),
            vx: rand(-8, 8),
            vy: rand(5, 15),
            color: choice(["#9dffb0", "#ff83c5", "#fff2ce", "#9d6bff"]),
            life: rand(0.15, 0.3)
        });
    }

    ctx.restore();
}

// --------------------------------------------------
// EVENTOS Y CONTROLADORES
// --------------------------------------------------

function createCreatures() {
    creatures = [];
    particles = [];
    for (let i = 0; i < TOTAL; i++) {
        creatures.push(new Creature());
    }

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

function startGame() {
    if (running) return;

    running = true;
    startMessage.style.display = "none";
    lastTime = 0;
    scheduleNextScreamer();
    animationId = requestAnimationFrame(gameLoop);
}

function restartGame() {
    running = false;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    score = 0;
    screamerActive = false;
    mouse = { x: -100, y: -100, inside: false };
    createCreatures();
    drawScene();

    startMessage.style.display = "flex";
    startButton.textContent = "COMENZAR JUEGO";
}

function gameLoop(timestamp) {
    if (!running) return;

    const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.04) : 0;
    lastTime = timestamp;

    update(dt);
    drawScene();

    animationId = requestAnimationFrame(gameLoop);
}

function update(dt) {
    creatures.forEach(creature => creature.update(dt));
    updateParticles(dt);
    updateScreamer(dt);

    for (let i = 0; i < creatures.length; i++) {
        for (let j = i + 1; j < creatures.length; j++) {
            creatures[i].bounceFrom(creatures[j]);
        }
    }
}

function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(3, 3);

    drawBackground();
    creatures.forEach(creature => creature.draw());
    drawParticles();

    if (mouse.inside) drawCustomCursor(mouse.x, mouse.y);

    drawScreamer();

    ctx.restore();
}

function getMousePosition(event) {
    const rectCanvas = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rectCanvas.left) / rectCanvas.width * W,
        y: (event.clientY - rectCanvas.top) / rectCanvas.height * H
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
    if (!running || screamerActive) return;

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

// --------------------------------------------------
// CONTROL DE AUDIO
// --------------------------------------------------

function startMusic() {
    bgMusic.play().then(() => {
        musicEnabled = true;
        musicButton.textContent = "♫ SILENCIAR MÚSICA";
    }).catch(err => {
        console.log("Audio pausado por el navegador:", err);
    });
}

function stopMusic() {
    bgMusic.pause();
    musicEnabled = false;
    musicButton.textContent = "♫ ACTIVAR MÚSICA";
}

startButton.addEventListener("click", () => {
    startGame();
    startMusic();
});

restartButton.addEventListener("click", restartGame);

musicButton.addEventListener("click", () => {
    if (musicEnabled) {
        stopMusic();
    } else {
        startMusic();
    }
});

// Inicialización
createCreatures();
drawScene();