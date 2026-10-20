// Home: icon-only screen with four buttons (tutorial, play, shop, upgrade)

const HOME_BUTTON_SIZE = 48;
const HOME_BUTTONS = {
  tutorial: { x: 14,  y: 44, w: HOME_BUTTON_SIZE, h: HOME_BUTTON_SIZE },
  play:     { x: 74,  y: 44, w: HOME_BUTTON_SIZE, h: HOME_BUTTON_SIZE },
  shop:     { x: 134, y: 44, w: HOME_BUTTON_SIZE, h: HOME_BUTTON_SIZE },
  upgrade:  { x: 194, y: 44, w: HOME_BUTTON_SIZE, h: HOME_BUTTON_SIZE }
};

// Goes to the chosen screen
function openFromHome(name) {
  playSfx('confirm');
  if (name === 'tutorial') switchScene(TutorialScene);
  else if (name === 'play') switchScene(PlayScene);
  else if (name === 'shop') switchScene(ShopScene);
  else if (name === 'upgrade') switchScene(UpgradeScene);
}

// Scene: Home
const HomeScene = {
  hover: null,
  enter() {
    this.hover = null;
    music.pause();
    music.currentTime = 0;
  },
  exit() {},
  update() {},
  draw() {
    drawBackground();

    // Game title across the top
    text('TREASURE GRAB', W / 2, 10, 16, 'center');

    for (const name of Object.keys(HOME_BUTTONS)) {
      const r = HOME_BUTTONS[name];
      drawButton(r, this.hover === name);
    }

    // Tutorial button: question mark
    const t = HOME_BUTTONS.tutorial;
    text('?', t.x + t.w / 2, t.y + 12, 24, 'center');

    // Play button: triangle
    const p = HOME_BUTTONS.play;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 12);
    ctx.lineTo(cx - 8, cy + 12);
    ctx.lineTo(cx + 14, cy);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Shop button: treasure chest art
    const s = HOME_BUTTONS.shop;
    ctx.drawImage(assets.chest, s.x + 8, s.y + 8, s.w - 16, s.h - 16);

    // Upgrade button: up arrow
    const u = HOME_BUTTONS.upgrade;
    const ux = u.x + u.w / 2;
    const uy = u.y + u.h / 2;
    ctx.beginPath();
    ctx.moveTo(ux, uy - 14);
    ctx.lineTo(ux + 12, uy + 2);
    ctx.lineTo(ux + 5, uy + 2);
    ctx.lineTo(ux + 5, uy + 14);
    ctx.lineTo(ux - 5, uy + 14);
    ctx.lineTo(ux - 5, uy + 2);
    ctx.lineTo(ux - 12, uy + 2);
    ctx.closePath();
    ctx.fillStyle = '#6ddc6d';
    ctx.fill();

    // Name of each button, centred under it
    const labels = { tutorial: 'TUTORIAL', play: 'PLAY', shop: 'SHOP', upgrade: 'UPGRADE' };
    for (const name of Object.keys(labels)) {
      const r = HOME_BUTTONS[name];
      text(labels[name], r.x + r.w / 2, r.y + r.h + 6, 8, 'center');
    }
  },
  onKeyDown(e) {
    if (e.code === 'Enter' || e.code === 'Space') openFromHome('play');
    else if (e.code === 'KeyT') openFromHome('tutorial');
    else if (e.code === 'KeyS') openFromHome('shop');
    else if (e.code === 'KeyU') openFromHome('upgrade');
  },
  onPointerDown(e) {
    const name = buttonAt(canvasPoint(e), HOME_BUTTONS);
    if (name) openFromHome(name);
  },
  onPointerMove(e) {
    this.hover = buttonAt(canvasPoint(e), HOME_BUTTONS);
  },
  onPointerLeave() {
    this.hover = null;
  }
};
