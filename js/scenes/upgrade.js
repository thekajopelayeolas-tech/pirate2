// Upgrade: spend coins to make timed power-ups last longer

// Timed power-ups that can be upgraded (bonus is instant, so it has no duration)
const UPGRADE_KINDS = ['magnet', 'double', 'slow', 'wide', 'gems'];
const UPGRADE_ROW_HEIGHT = 18;

function upgradeRow(i) {
  return { x: 16, y: 30 + i * UPGRADE_ROW_HEIGHT, w: 224, h: 15 };
}

// Buys one upgrade level for a power-up. Returns 'ok', 'max', or 'cost'.
function buyUpgrade(kind) {
  const level = progress.upgrades[kind];
  if (level >= POWERUP_UPGRADE_MAX) return 'max';
  const cost = upgradeCost(level);
  if (progress.coins < cost) return 'cost';
  progress.coins -= cost;
  progress.upgrades[kind] = level + 1;
  return 'ok';
}

// Scene: Upgrades
const UpgradeScene = {
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

    text('UPGRADES', W / 2, 6, 14, 'center');
    text('COINS: ' + progress.coins, W / 2, 20, 8, 'center');

    UPGRADE_KINDS.forEach((kind, i) => {
      const type = POWERUP_TYPES[kind];
      const r = upgradeRow(i);
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
      const level = progress.upgrades[kind];
      text('LV ' + level + '  ' + powerupDuration(kind) + 's', r.x + 110, r.y + 3, 8, 'left');
      const price = level >= POWERUP_UPGRADE_MAX ? 'MAX' : upgradeCost(level) + ' coins';
      text(price, r.x + r.w - 6, r.y + 3, 8, 'right');
    });

    const hint = this.notice || 'Click or press 1-5 to upgrade   ESC = home';
    text(hint, W / 2, 133, 8, 'center');
  },
  tryBuy(i) {
    const result = buyUpgrade(UPGRADE_KINDS[i]);
    if (result === 'ok') this.notice = '';
    else if (result === 'max') this.notice = 'Already at max level';
    else this.notice = 'Not enough coins';
  },
  onKeyDown(e) {
    if (e.code === 'Escape') {
      switchScene(HomeScene);
      return;
    }
    const n = Number(e.code.replace(/^(Digit|Numpad)/, ''));
    if (n >= 1 && n <= UPGRADE_KINDS.length) this.tryBuy(n - 1);
  },
  onPointerDown(e) {
    const p = canvasPoint(e);
    const i = UPGRADE_KINDS.findIndex((_, idx) => pointIn(p, upgradeRow(idx)));
    if (i !== -1) this.tryBuy(i);
  },
  onPointerMove(e) {
    const p = canvasPoint(e);
    this.hover = UPGRADE_KINDS.findIndex((_, idx) => pointIn(p, upgradeRow(idx)));
  },
  onPointerLeave() {
    this.hover = -1;
  }
};
