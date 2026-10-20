// Input routing: forward events to the active scene
window.addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (!e.repeat && currentScene && currentScene.onKeyDown) {
    currentScene.onKeyDown(e);
  }
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
});

canvas.addEventListener('pointerdown', e => {
  if (currentScene && currentScene.onPointerDown) currentScene.onPointerDown(e);
});

canvas.addEventListener('pointermove', e => {
  if (currentScene && currentScene.onPointerMove) currentScene.onPointerMove(e);
});

canvas.addEventListener('pointerleave', () => {
  if (currentScene && currentScene.onPointerLeave) currentScene.onPointerLeave();
});

// Main loop
function loop(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
  lastTime = timestamp;

  if (currentScene) {
    currentScene.update(dt);
    currentScene.draw();
  }
  requestAnimationFrame(loop);
}

switchScene(HomeScene);
lastTime = performance.now();
requestAnimationFrame(loop);
