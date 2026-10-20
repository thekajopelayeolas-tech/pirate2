// Tutorial: how to play (opened from the home screen)
const TutorialScene = {
  enter() {},
  exit() {},
  update() {},
  draw() {
    drawBackground();
    ctx.fillStyle = 'rgba(4, 22, 36, 0.75)';
    ctx.fillRect(0, 0, W, H);

    text('HOW TO PLAY', W / 2, 12, 14, 'center');
    const lines = [
      'Catch falling items with your chest.',
      'Gem = 3 points    Coin pile = 1 point',
      'No goal: play as long as you like!',
      'Rolling boulder: -' + BOULDER_PENALTY + ' points if it hits you',
      'Power-ups last ' + POWERUP_DURATION + ' seconds:',
      'M magnet   x2 double   S slow',
      'W wide     G gem rush  +5 bonus',
      '',
      'Move: arrow keys, A / D, or mouse',
      '1 point = 1 coin. ESC ends a round.',
      'ESC or click = back to home'
    ];
    let y = 36;
    for (const line of lines) {
      text(line, W / 2, y, 8, 'center');
      y += 9;
    }
  },
  onKeyDown(e) {
    if (e.code === 'Escape' || e.code === 'Enter') {
      playSfx('back');
      switchScene(HomeScene);
    }
  },
  onPointerDown() {
    playSfx('back');
    switchScene(HomeScene);
  },
  onPointerMove() {},
  onPointerLeave() {}
};
