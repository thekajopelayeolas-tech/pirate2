// Shop: spend coins on power-ups that start your next round

// Shop items are the power-up kinds, in their defined order
const SHOP_KINDS = Object.keys(POWERUP_TYPES);
const SHOP_ROW_HEIGHT = 16;

function shopRow(i) {
  return { x: 16, y: 28 + i * SHOP_ROW_HEIGHT, w: 224, h: 14 };
}

// Adds one power-up to the queue if the player can afford it
function buyPowerUp(kind) {
  if (progress.coins < SHOP_PRICE) return false;
  progress.coins -= SHOP_PRICE;
  progress.queued.push(kind);
  return true;
}

// Scene: Shop
const ShopScene = {
  hover: -1,
  notice: '',
  enter() {
    this.hover = -1;
    this.notice = '';
  },
  exit() {},
  update() {},
  draw() {
    drawBackground();
    ctx.fillStyle = 'rgba(4, 22, 36, 0.75)';
    ctx.fillRect(0, 0, W, H);

    text('SHOP', W / 2, 6, 14, 'center');
    text('COINS: ' + progress.coins, W / 2, 20, 8, 'center');

    SHOP_KINDS.forEach((kind, i) => {
      const type = POWERUP_TYPES[kind];
      const r = shopRow(i);
      drawButton(r, this.hover === i);

      // Power-up icon
      const cx = r.x + 9;
      const cy = r.y + r.h / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = type.color;
      ctx.fill();
      text(type.label, cx, cy - 3, 6, 'center');

      text(type.name, r.x + 20, r.y + 3, 8, 'left');
      const owned = progress.queued.filter(k => k === kind).length;
      if (owned > 0) text('x' + owned, r.x + 120, r.y + 3, 8, 'left');
      text(SHOP_PRICE + ' coins', r.x + r.w - 6, r.y + 3, 8, 'right');
    });

    const hint = this.notice || 'Click or press 1-6 to buy   ESC = home';
    text(hint, W / 2, 133, 8, 'center');
  },
  tryBuy(i) {
    if (buyPowerUp(SHOP_KINDS[i])) {
      this.notice = '';
      playSfx('confirm');
    } else {
      this.notice = 'Not enough coins';
    }
  },
  onKeyDown(e) {
    if (e.code === 'Escape') {
      playSfx('back');
      switchScene(HomeScene);
      return;
    }
    const n = Number(e.code.replace(/^(Digit|Numpad)/, ''));
    if (n >= 1 && n <= SHOP_KINDS.length) this.tryBuy(n - 1);
  },
  onPointerDown(e) {
    const p = canvasPoint(e);
    const i = SHOP_KINDS.findIndex((_, idx) => pointIn(p, shopRow(idx)));
    if (i !== -1) this.tryBuy(i);
  },
  onPointerMove(e) {
    const p = canvasPoint(e);
    this.hover = SHOP_KINDS.findIndex((_, idx) => pointIn(p, shopRow(idx)));
  },
  onPointerLeave() {
    this.hover = -1;
  }
};
