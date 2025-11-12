class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    // Resize canvas for mobile
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const aspectRatio = 800 / 600;

    let width = container.clientWidth;
    let height = container.clientHeight;

    // Maintain aspect ratio
    if (width / height > aspectRatio) {
      width = height * aspectRatio;
    } else {
      height = width / aspectRatio;
    }

    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';

    this.scale = width / 800;
  }

  clear() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, 800, 600);
  }

  render(gameState, playerNumber) {
    this.clear();

    if (!gameState) return;

    // Draw map
    this.drawMap(gameState.currentMap);

    // Draw tanks
    this.drawTanks(gameState.tanks, playerNumber);

    // Draw bullets
    this.drawBullets(gameState.bullets);
  }

  drawMap(map) {
    if (!map) return;

    const tileSize = 40;

    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const terrain = map[row][col];
        const x = col * tileSize;
        const y = row * tileSize;

        switch (terrain) {
          case 'grass':
            this.ctx.fillStyle = '#4a7c59';
            break;
          case 'mud':
            this.ctx.fillStyle = '#8b7355';
            break;
          case 'wall':
            this.ctx.fillStyle = '#2c3e50';
            break;
          default:
            this.ctx.fillStyle = '#4a7c59';
        }

        this.ctx.fillRect(x, y, tileSize, tileSize);

        // Add texture/pattern
        if (terrain === 'wall') {
          this.ctx.strokeStyle = '#34495e';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x, y, tileSize, tileSize);
        } else if (terrain === 'mud') {
          this.ctx.fillStyle = '#6d5d4b';
          this.ctx.fillRect(x + 5, y + 5, 8, 8);
          this.ctx.fillRect(x + 25, y + 20, 8, 8);
          this.ctx.fillRect(x + 15, y + 30, 6, 6);
        } else if (terrain === 'grass') {
          this.ctx.fillStyle = '#3d6647';
          this.ctx.fillRect(x + 10, y + 10, 3, 8);
          this.ctx.fillRect(x + 28, y + 15, 3, 8);
          this.ctx.fillRect(x + 18, y + 28, 3, 8);
        }
      }
    }
  }

  drawTanks(tanks, playerNumber) {
    for (const [socketId, tank] of Object.entries(tanks)) {
      if (tank.health <= 0) continue;

      const isYou = tank.playerNumber === playerNumber;

      this.ctx.save();
      this.ctx.translate(tank.x, tank.y);
      this.ctx.rotate(tank.angle);

      // Tank body
      if (isYou) {
        this.ctx.fillStyle = '#4CAF50'; // Green for you
      } else {
        this.ctx.fillStyle = '#f44336'; // Red for opponent
      }

      this.ctx.fillRect(-18, -15, 36, 30);

      // Tank outline
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(-18, -15, 36, 30);

      // Tank turret
      this.ctx.fillStyle = isYou ? '#45a049' : '#d32f2f';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Tank barrel
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(0, -3, 25, 6);
      this.ctx.strokeRect(0, -3, 25, 6);

      // Player indicator
      this.ctx.restore();

      if (isYou) {
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('YOU', tank.x, tank.y - 30);
      }
    }
  }

  drawBullets(bullets) {
    this.ctx.fillStyle = '#FFD700';
    this.ctx.strokeStyle = '#FFA500';
    this.ctx.lineWidth = 2;

    for (const bullet of bullets) {
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Draw trail effect
      this.ctx.save();
      this.ctx.globalAlpha = 0.3;
      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.arc(
        bullet.x - bullet.vx * 10,
        bullet.y - bullet.vy * 10,
        bullet.radius * 0.7,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  drawRoundEnd(roundWinner, playerNumber) {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, 800, 600);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    if (roundWinner === playerNumber) {
      this.ctx.fillText('YOU WIN!', 400, 300);
    } else {
      this.ctx.fillText('YOU LOSE!', 400, 300);
    }

    this.ctx.restore();
  }
}
