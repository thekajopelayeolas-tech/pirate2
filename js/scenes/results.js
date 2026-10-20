// Scene 3: Results
const ResultScene = {
  enter(data) {
    this.score = data.score || 0;
    this.coinsEarned = coinsFromScore(this.score);
    progress.coins += this.coinsEarned;
    winSound.currentTime = 0;
    winSound.play().catch(() => {});
  },
  exit() {
    winSound.pause();
    winSound.currentTime = 0;
  },
  update() {},
  draw() {
    drawBackground();
    drawOverlay('ROUND OVER', [
      'Score: ' + this.score,
      'Coins earned: ' + this.coinsEarned + '  (1 coin per point)',
      'Total coins: ' + progress.coins,
      '',
      'ENTER = play again',
      'ESC = home screen'
    ]);
  },
  onKeyDown(e) {
    if (e.code === 'Enter' || e.code === 'Space') switchScene(PlayScene);
    else if (e.code === 'Escape') switchScene(HomeScene);
  },
  onPointerDown() {
    switchScene(PlayScene);
  },
  onPointerMove() {},
  onPointerLeave() {}
};
