Rolling Boulder is a 5-frame animation strip.
Each frame is 48 x 48 pixels, left to right.

PhaserJS:
  this.load.spritesheet('rolling_boulder', 'rolling_boulder.png', { frameWidth: 48, frameHeight: 48 });
  this.anims.create({ key: 'rolling_boulder', frames: this.anims.generateFrameNumbers('rolling_boulder'), frameRate: 6, repeat: -1 });
  this.add.sprite(100, 100, 'rolling_boulder').play('rolling_boulder');