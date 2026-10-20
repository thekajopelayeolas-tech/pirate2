// Shared setup for all scenes: canvas, settings, assets, audio, input state, helpers, scene manager

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game coordinates stay at 256x144, but the canvas is drawn at SCALE times that
// size so sprites and text are rendered sharply instead of being stretched.
const W = 256;
const H = 144;
const SCALE = 6;

canvas.width = W * SCALE;
canvas.height = H * SCALE;
ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
ctx.imageSmoothingEnabled = false;

// Game settings
// Sprites are 64x64 in the art files; 32 is exactly half, so they scale cleanly
const ITEM_SIZE = 32;
const CHEST_W = 32;
const CHEST_H = 32;
const COIN_POINTS = 1;     // points per shop coin at the end of a round (1 point = 1 coin)
const PLAYER_SPEED = 180;  // pixels per second
const GEM_CHANCE = 0.25;

// Power-ups (drawn as shapes, since no power-up art is in the folder)
const POWERUP_INTERVAL = 8;   // seconds between power-up spawns
const POWERUP_DURATION = 6;   // seconds each timed power-up lasts
const POWERUP_TYPES = {
  magnet: { label: 'M',  name: 'MAGNET',   color: '#e8443a' },
  double: { label: 'x2', name: 'DOUBLE',   color: '#f5b82e' },
  slow:   { label: 'S',  name: 'SLOW',     color: '#4fc3f7' },
  wide:   { label: 'W',  name: 'WIDE',     color: '#b084f5' },
  gems:   { label: 'G',  name: 'GEM RUSH', color: '#ff7eb6' },
  bonus:  { label: '+5', name: 'BONUS',    color: '#6ddc6d', instant: true, points: 5 }
};

// Rolling boulder enemy (art: rolling_boulder/rolling_boulder.png, a 5-frame strip, 48x48 per frame)
const BOULDER_FRAME = 48;       // width and height of one animation frame
const BOULDER_FRAMES = 5;       // frames in the strip
const BOULDER_FPS = 6;          // animation speed (from the art README)
const BOULDER_SIZE = 48;        // drawn size, 1:1 with the art
const BOULDER_HITBOX_INSET = 8; // the hit area is smaller than the drawing
const BOULDER_INTERVAL = 7;     // seconds between boulder spawns
const BOULDER_PENALTY = 5;      // points lost when a boulder hits the chest

// Shop and progress (kept in memory, so they reset when the page is reloaded)
const SHOP_PRICE = 30;   // coins per power-up in the shop
const progress = {
  coins: 0,              // earned from points in finished rounds
  queued: [],            // bought power-up kinds, started at the beginning of the next round
  upgrades: { magnet: 0, double: 0, slow: 0, wide: 0, gems: 0 } // upgrade level per timed power-up (0-3)
};

// Power-up upgrades
const POWERUP_UPGRADE_STEP = 2;  // extra seconds per upgrade level
const POWERUP_UPGRADE_MAX = 3;   // highest upgrade level
const UPGRADE_BASE_COST = 30;    // coins for the first level; each level costs one more step

// Seconds a timed power-up lasts, including its upgrade level
function powerupDuration(kind) {
  return POWERUP_DURATION + progress.upgrades[kind] * POWERUP_UPGRADE_STEP;
}

// Coins needed to go from this upgrade level to the next
function upgradeCost(level) {
  return UPGRADE_BASE_COST * (level + 1);
}

// Coins earned from a round's score: one coin per point
function coinsFromScore(score) {
  return Math.floor(score / COIN_POINTS);
}

// Assets (all in the same folder as index.html)
function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

const assets = {
  bg: loadImage('tropical_sea_background.png'),
  gem: loadImage('coin_gem_3.png'),
  coins: loadImage('coin_gem_6.png'),
  chest: loadImage('key_chest_8.png'),
  boulder: loadImage('rolling_boulder/rolling_boulder.png')
};

const music = new Audio('pirate_music.mp3');
music.loop = true;
music.volume = 0.35;

const winSound = new Audio('pirate_win.mp3');

// Shared input state
const keys = {};
let pointerX = null;
let lastTime = 0;

// Shared helpers
function rectsOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// Which animation frame (0 to BOULDER_FRAMES - 1) to show at a given time
function boulderFrame(time) {
  return Math.floor(time * BOULDER_FPS) % BOULDER_FRAMES;
}

// Returns a shuffled copy of a list (Fisher-Yates)
function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Converts a mouse or touch event into game coordinates (0-256 x, 0-144 y)
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (W / rect.width),
    y: (e.clientY - rect.top) * (H / rect.height)
  };
}

function pointIn(p, r) {
  return p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
}

// Returns the name of the first button under the point, or null
function buttonAt(p, buttons) {
  for (const name of Object.keys(buttons)) {
    if (pointIn(p, buttons[name])) return name;
  }
  return null;
}

// Draws a bordered button, highlighted when hovered
function drawButton(r, hovered) {
  ctx.fillStyle = hovered ? '#1f7aa8' : '#0f4c6e';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
}

function setPointerFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  pointerX = (e.clientX - rect.left) * (W / rect.width);
}

function text(str, x, y, size, align) {
  ctx.font = size + 'px monospace';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#063047';
  ctx.fillText(str, x + 1, y + 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(str, x, y);
}

function drawOverlay(title, lines) {
  ctx.fillStyle = 'rgba(4, 22, 36, 0.7)';
  ctx.fillRect(0, 0, W, H);
  text(title, W / 2, 30, 16, 'center');
  let y = 62;
  for (const line of lines) {
    text(line, W / 2, y, 8, 'center');
    y += 14;
  }
}

function drawBackground() {
  ctx.drawImage(assets.bg, 0, 0, W, H);
}

// Scene manager: only one scene is active at a time
let currentScene = null;

function switchScene(scene, data) {
  if (currentScene && currentScene.exit) currentScene.exit();
  currentScene = scene;
  currentScene.enter(data || {});
}
