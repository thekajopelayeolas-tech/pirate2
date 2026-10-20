// Scene 2: Play
const PlayScene = {
  enter() {
    this.score = 0;
    this.elapsed = 0; // hidden play time, only used to speed up spawns
    this.items = [];
    this.spawnTimer = 0;
    this.powerTimer = POWERUP_INTERVAL; // first power-up arrives after one interval
    this.boulderTimer = BOULDER_INTERVAL; // first boulder arrives after one interval
    this.animTime = 0; // running clock for the boulder animation and sway
    this.popups = []; // floating text such as "-5"
    this.effects = { magnet: 0, double: 0, slow: 0, wide: 0, gems: 0 }; // seconds left on each timed power-up
    this.deck = shuffle(Object.keys(POWERUP_TYPES)); // power-up order, reshuffled after every pickup
    this.player = {
      x: W / 2 - CHEST_W / 2,
      y: H - CHEST_H - 4,
      w: CHEST_W,
      h: CHEST_H
    };
    pointerX = null;
    // Start the round with any power-ups bought in the shop
    for (const kind of progress.queued) {
      const type = POWERUP_TYPES[kind];
      if (type.instant) {
        this.score += type.points;
      } else {
        this.effects[kind] = powerupDuration(kind);
      }
    }
    progress.queued = [];
    music.currentTime = 0;
    music.play().catch(() => {});
  },
  exit() {
    music.pause();
    music.currentTime = 0;
  },
  spawnItem(elapsed) {
    const isGem = this.effects.gems > 0 || Math.random() < GEM_CHANCE;
    this.items.push({
      x: Math.random() * (W - ITEM_SIZE),
      y: -ITEM_SIZE,
      w: ITEM_SIZE,
      h: ITEM_SIZE,
      vy: 50 + Math.random() * 40 + elapsed * 1.5,
      type: isGem ? 'gem' : 'coins',
      value: isGem ? 3 : 1
    });
  },
  spawnBoulder() {
    const baseX = 12 + Math.random() * (W - BOULDER_SIZE - 24);
    this.items.push({
      x: baseX,
      y: -BOULDER_SIZE,
      baseX: baseX,
      w: BOULDER_SIZE,
      h: BOULDER_SIZE,
      vy: 70 + Math.random() * 20,
      type: 'boulder',
      phase: Math.random() * Math.PI * 2 // so each boulder sways differently
    });
  },
  drawBoulder(it) {
    const frame = boulderFrame(this.animTime);
    ctx.drawImage(assets.boulder,
      frame * BOULDER_FRAME, 0, BOULDER_FRAME, BOULDER_FRAME,
      Math.round(it.x), Math.round(it.y), BOULDER_SIZE, BOULDER_SIZE);
  },
  addPopup(str, x, y) {
    this.popups.push({ text: str, x: x, y: y, life: 1 });
  },
  reshuffleDeck(lastKind) {
    // Shuffle again, and never let the power-up just collected come up first
    const deck = shuffle(Object.keys(POWERUP_TYPES));
    if (deck[0] === lastKind) {
      [deck[0], deck[1]] = [deck[1], deck[0]];
    }
    this.deck = deck;
  },
  spawnPowerUp() {
    if (this.deck.length === 0) this.deck = shuffle(Object.keys(POWERUP_TYPES));
    const kind = this.deck.shift();
    this.items.push({
      x: Math.random() * (W - ITEM_SIZE),
      y: -ITEM_SIZE,
      w: ITEM_SIZE,
      h: ITEM_SIZE,
      vy: 45,
      type: 'power',
      kind: kind
    });
  },
  drawPowerUp(it) {
    const type = POWERUP_TYPES[it.kind];
    const cx = Math.round(it.x) + ITEM_SIZE / 2;
    const cy = Math.round(it.y) + ITEM_SIZE / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.fillStyle = type.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    text(type.label, cx, cy - 4, 8, 'center');
  },
  update(dt) {
    const player = this.player;

    // Wide: the chest grows 1.5x while active, keeping its shape
    const sizeScale = this.effects.wide > 0 ? 1.5 : 1;
    player.w = CHEST_W * sizeScale;
    player.h = CHEST_H * sizeScale;
    player.y = H - player.h - 4;

    // Keyboard movement
    let dir = 0;
    if (keys.ArrowLeft || keys.KeyA) dir -= 1;
    if (keys.ArrowRight || keys.KeyD) dir += 1;
    if (dir !== 0) pointerX = null; // keyboard takes over from pointer

    if (pointerX !== null) {
      // Pointer/touch: glide the chest toward the pointer
      const target = pointerX - player.w / 2;
      const diff = target - player.x;
      const step = PLAYER_SPEED * dt;
      player.x += Math.max(-step, Math.min(step, diff));
    } else {
      player.x += dir * PLAYER_SPEED * dt;
    }
    player.x = Math.max(0, Math.min(W - player.w, player.x));

    // Spawning: items come faster the longer you play
    this.elapsed += dt;
    this.spawnTimer -= dt;
    const interval = Math.max(0.35, 0.8 - this.elapsed * 0.01);
    if (this.spawnTimer <= 0) {
      this.spawnTimer = interval;
      this.spawnItem(this.elapsed);
    }

    // Power-up spawning on its own, slower timer
    this.powerTimer -= dt;
    if (this.powerTimer <= 0) {
      this.powerTimer = POWERUP_INTERVAL;
      this.spawnPowerUp();
    }

    // Boulders: animation clock and spawn timer
    this.animTime += dt;
    this.boulderTimer -= dt;
    if (this.boulderTimer <= 0) {
      this.boulderTimer = BOULDER_INTERVAL;
      this.spawnBoulder();
    }

    // Floating popups fade out after about one second
    for (const p of this.popups) p.life -= dt;
    this.popups = this.popups.filter(p => p.life > 0);

    // Count down active power-ups
    for (const kind of Object.keys(this.effects)) {
      this.effects[kind] = Math.max(0, this.effects[kind] - dt);
    }

    // Magnet: pull falling items toward the chest
    if (this.effects.magnet > 0) {
      const targetX = player.x + player.w / 2 - ITEM_SIZE / 2;
      for (const it of this.items) {
        if (it.type === 'boulder') continue; // magnet never pulls boulders in
        it.x += (targetX - it.x) * Math.min(1, 4 * dt);
      }
    }

    // Slow: halve the fall speed while active
    const fallScale = this.effects.slow > 0 ? 0.5 : 1;
    for (const it of this.items) {
      it.y += it.vy * fallScale * dt;
      if (it.type === 'boulder') {
        // Boulders sway side to side as they fall
        it.x = it.baseX + Math.sin(this.animTime * 3 + it.phase) * 12;
      }
    }

    // Collect items that touch the chest; remove those that fall off screen
    this.items = this.items.filter(it => {
      if (it.type === 'boulder') {
        // Boulders hurt instead of being collected; the hit area is smaller than the art
        const hit = {
          x: it.x + BOULDER_HITBOX_INSET,
          y: it.y + BOULDER_HITBOX_INSET,
          w: BOULDER_SIZE - BOULDER_HITBOX_INSET * 2,
          h: BOULDER_SIZE - BOULDER_HITBOX_INSET * 2
        };
        if (rectsOverlap(hit, player)) {
          this.score = Math.max(0, this.score - BOULDER_PENALTY);
          this.addPopup('-' + BOULDER_PENALTY, player.x + player.w / 2, player.y);
          return false;
        }
        return it.y < H;
      }
      if (rectsOverlap(it, player)) {
        if (it.type === 'power') {
          const type = POWERUP_TYPES[it.kind];
          if (type.instant) {
            this.score += type.points;
          } else {
            this.effects[it.kind] = powerupDuration(it.kind); // refreshes if already active
          }
          this.reshuffleDeck(it.kind);
          playSfx('powerup');
        } else {
          const multiplier = this.effects.double > 0 ? 2 : 1;
          this.score += it.value * multiplier;
          playSfx('collect');
        }
        return false;
      }
      return it.y < H;
    });

  },
  draw() {
    drawBackground();

    for (const it of this.items) {
      if (it.type === 'boulder') {
        this.drawBoulder(it);
      } else if (it.type === 'power') {
        this.drawPowerUp(it);
      } else {
        const img = it.type === 'gem' ? assets.gem : assets.coins;
        ctx.drawImage(img, Math.round(it.x), Math.round(it.y), ITEM_SIZE, ITEM_SIZE);
      }
    }

    ctx.drawImage(assets.chest, Math.round(this.player.x), Math.round(this.player.y), this.player.w, this.player.h);

    // Floating popups (rise and fade)
    for (const p of this.popups) {
      text(p.text, p.x, p.y - (1 - p.life) * 12, 8, 'center');
    }

    text('SCORE: ' + this.score, 4, 4, 8, 'left');

    // Active power-ups: name plus a bar showing how much of the duration is left
    let row = 0;
    for (const kind of Object.keys(this.effects)) {
      const left = this.effects[kind];
      if (left <= 0) continue;
      const type = POWERUP_TYPES[kind];
      text(type.name, 4, 16 + row * 10, 8, 'left');
      ctx.fillStyle = type.color;
      ctx.fillRect(60, 18 + row * 10, 60 * (left / powerupDuration(kind)), 4);
      row++;
    }
  },
  onKeyDown(e) {
    // Z ends the round and opens the results screen (coins are paid there)
    if (e.code === 'KeyZ') {
      playSfx('back');
      switchScene(ResultScene, { score: this.score });
    }
  },
  onPointerDown(e) {
    setPointerFromEvent(e);
  },
  onPointerMove(e) {
    setPointerFromEvent(e);
  },
  onPointerLeave() {
    pointerX = null;
  }
};
