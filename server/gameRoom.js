const MapGenerator = require('./mapGenerator');

class GameRoom {
  constructor(code, io) {
    this.code = code;
    this.io = io;
    this.players = new Map();
    this.gameState = {
      status: 'waiting', // waiting, playing, roundEnd, gameOver
      currentMap: null,
      tanks: {},
      bullets: [],
      scores: { 1: 0, 2: 0 },
      roundWinner: null,
      gameWinner: null
    };
    this.gameLoop = null;
    this.readyPlayers = new Set();
    this.lastUpdateTime = Date.now();
  }

  addPlayer(socketId, playerNumber) {
    this.players.set(socketId, {
      id: socketId,
      number: playerNumber,
      ready: false
    });

    // Initialize tank for this player
    const spawnPoint = this.getSpawnPoint(playerNumber);
    this.gameState.tanks[socketId] = {
      x: spawnPoint.x,
      y: spawnPoint.y,
      angle: playerNumber === 1 ? 0 : Math.PI,
      velocityX: 0,
      velocityY: 0,
      radius: 20,
      health: 1,
      playerNumber: playerNumber,
      speed: 0,
      targetSpeed: 0,
      angularVelocity: 0
    };
  }

  getSpawnPoint(playerNumber) {
    if (playerNumber === 1) {
      return { x: 100, y: 300 };
    } else {
      return { x: 700, y: 300 };
    }
  }

  hasPlayer(socketId) {
    return this.players.has(socketId);
  }

  isFull() {
    return this.players.size === 2;
  }

  isEmpty() {
    return this.players.size === 0;
  }

  startGame() {
    this.gameState.status = 'playing';
    this.generateNewMap();
    this.startGameLoop();
    this.emitGameState();
  }

  generateNewMap() {
    this.gameState.currentMap = MapGenerator.generate(800, 600);
    // Reset tank positions
    for (const [socketId, player] of this.players.entries()) {
      const spawnPoint = this.getSpawnPoint(player.number);
      this.gameState.tanks[socketId].x = spawnPoint.x;
      this.gameState.tanks[socketId].y = spawnPoint.y;
      this.gameState.tanks[socketId].angle = player.number === 1 ? 0 : Math.PI;
      this.gameState.tanks[socketId].velocityX = 0;
      this.gameState.tanks[socketId].velocityY = 0;
      this.gameState.tanks[socketId].health = 1;
    }
    // Clear bullets
    this.gameState.bullets = [];
  }

  startGameLoop() {
    const FPS = 60;
    const FRAME_TIME = 1000 / FPS;

    this.gameLoop = setInterval(() => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
      this.lastUpdateTime = currentTime;

      this.update(deltaTime);
      this.emitGameState();
    }, FRAME_TIME);
  }

  stopGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
  }

  update(deltaTime) {
    if (this.gameState.status !== 'playing') return;

    // Update tanks
    for (const [socketId, tank] of Object.entries(this.gameState.tanks)) {
      if (tank.health > 0) {
        this.updateTank(tank, deltaTime);
      }
    }

    // Update bullets
    this.updateBullets(deltaTime);

    // Check collisions
    this.checkCollisions();
  }

  updateTank(tank, deltaTime) {
    // Apply acceleration/deceleration
    const acceleration = 300; // pixels per second squared
    const maxSpeed = 150; // pixels per second

    if (tank.targetSpeed > tank.speed) {
      tank.speed = Math.min(tank.speed + acceleration * deltaTime, tank.targetSpeed);
    } else if (tank.targetSpeed < tank.speed) {
      tank.speed = Math.max(tank.speed - acceleration * deltaTime, tank.targetSpeed);
    }

    // Check terrain effect
    const terrainFactor = this.getTerrainSpeedFactor(tank.x, tank.y);
    const effectiveSpeed = tank.speed * terrainFactor;

    // Apply angular velocity
    tank.angle += tank.angularVelocity * deltaTime;

    // Update position based on angle and speed
    const moveX = Math.cos(tank.angle) * effectiveSpeed * deltaTime;
    const moveY = Math.sin(tank.angle) * effectiveSpeed * deltaTime;

    const newX = tank.x + moveX;
    const newY = tank.y + moveY;

    // Check wall collision
    if (!this.checkWallCollision(newX, newY, tank.radius)) {
      tank.x = newX;
      tank.y = newY;
    } else {
      tank.speed = 0;
      tank.targetSpeed = 0;
    }

    // Keep tank in bounds
    tank.x = Math.max(tank.radius, Math.min(800 - tank.radius, tank.x));
    tank.y = Math.max(tank.radius, Math.min(600 - tank.radius, tank.y));
  }

  getTerrainSpeedFactor(x, y) {
    if (!this.gameState.currentMap) return 1;

    const tileSize = 40;
    const col = Math.floor(x / tileSize);
    const row = Math.floor(y / tileSize);

    if (row < 0 || row >= this.gameState.currentMap.length ||
        col < 0 || col >= this.gameState.currentMap[0].length) {
      return 1;
    }

    const terrain = this.gameState.currentMap[row][col];

    switch (terrain) {
      case 'mud': return 0.5;
      case 'grass': return 1.0;
      case 'wall': return 0;
      default: return 1.0;
    }
  }

  checkWallCollision(x, y, radius) {
    if (!this.gameState.currentMap) return false;

    const tileSize = 40;
    const checkPoints = [
      { x: x, y: y },
      { x: x + radius, y: y },
      { x: x - radius, y: y },
      { x: x, y: y + radius },
      { x: x, y: y - radius }
    ];

    for (const point of checkPoints) {
      const col = Math.floor(point.x / tileSize);
      const row = Math.floor(point.y / tileSize);

      if (row >= 0 && row < this.gameState.currentMap.length &&
          col >= 0 && col < this.gameState.currentMap[0].length) {
        if (this.gameState.currentMap[row][col] === 'wall') {
          return true;
        }
      }
    }

    return false;
  }

  updateBullets(deltaTime) {
    const bulletSpeed = 400; // pixels per second

    for (let i = this.gameState.bullets.length - 1; i >= 0; i--) {
      const bullet = this.gameState.bullets[i];

      // Update position
      bullet.x += bullet.vx * bulletSpeed * deltaTime;
      bullet.y += bullet.vy * bulletSpeed * deltaTime;

      // Check wall collisions and bouncing
      const bounceResult = this.checkBulletWallCollision(bullet);
      if (bounceResult.collided) {
        bullet.bounces++;
        if (bullet.bounces > 3) {
          this.gameState.bullets.splice(i, 1);
          continue;
        }

        // Apply bounce
        if (bounceResult.axis === 'horizontal') {
          bullet.vx = -bullet.vx;
        } else {
          bullet.vy = -bullet.vy;
        }

        // Move bullet slightly away from wall to prevent sticking
        bullet.x += bullet.vx * 5;
        bullet.y += bullet.vy * 5;
      }

      // Remove bullets out of bounds
      if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) {
        this.gameState.bullets.splice(i, 1);
      }
    }
  }

  checkBulletWallCollision(bullet) {
    if (!this.gameState.currentMap) return { collided: false };

    const tileSize = 40;
    const col = Math.floor(bullet.x / tileSize);
    const row = Math.floor(bullet.y / tileSize);

    if (row < 0 || row >= this.gameState.currentMap.length ||
        col < 0 || col >= this.gameState.currentMap[0].length) {
      return { collided: false };
    }

    if (this.gameState.currentMap[row][col] === 'wall') {
      // Determine bounce axis based on bullet position within tile
      const tileX = col * tileSize;
      const tileY = row * tileSize;
      const relX = bullet.x - tileX;
      const relY = bullet.y - tileY;

      // Simple approach: check which edge is closer
      const distToLeft = relX;
      const distToRight = tileSize - relX;
      const distToTop = relY;
      const distToBottom = tileSize - relY;

      const minHorizontal = Math.min(distToLeft, distToRight);
      const minVertical = Math.min(distToTop, distToBottom);

      return {
        collided: true,
        axis: minHorizontal < minVertical ? 'horizontal' : 'vertical'
      };
    }

    return { collided: false };
  }

  checkCollisions() {
    // Check bullet-tank collisions
    for (let i = this.gameState.bullets.length - 1; i >= 0; i--) {
      const bullet = this.gameState.bullets[i];

      for (const [socketId, tank] of Object.entries(this.gameState.tanks)) {
        if (socketId === bullet.owner || tank.health <= 0) continue;

        const dx = tank.x - bullet.x;
        const dy = tank.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < tank.radius + bullet.radius) {
          // Hit!
          tank.health = 0;
          this.gameState.bullets.splice(i, 1);
          this.handleRoundEnd(bullet.owner);
          break;
        }
      }
    }
  }

  handleRoundEnd(winnerId) {
    this.stopGameLoop();
    this.gameState.status = 'roundEnd';

    const winner = this.players.get(winnerId);
    if (winner) {
      this.gameState.scores[winner.number]++;
      this.gameState.roundWinner = winner.number;

      // Check if game is over
      if (this.gameState.scores[winner.number] >= 3) {
        this.gameState.status = 'gameOver';
        this.gameState.gameWinner = winner.number;
      }
    }

    this.emitGameState();
    this.readyPlayers.clear();
  }

  playerReady(socketId) {
    this.readyPlayers.add(socketId);

    if (this.readyPlayers.size === this.players.size) {
      // Both players ready, start next round or new game
      if (this.gameState.status === 'gameOver') {
        this.resetGame();
      } else {
        this.startNextRound();
      }
    }
  }

  startNextRound() {
    this.gameState.status = 'playing';
    this.gameState.roundWinner = null;
    this.generateNewMap();
    this.lastUpdateTime = Date.now();
    this.startGameLoop();
    this.emitGameState();
  }

  resetGame() {
    this.gameState.scores = { 1: 0, 2: 0 };
    this.gameState.roundWinner = null;
    this.gameState.gameWinner = null;
    this.startNextRound();
  }

  handlePlayerInput(socketId, input) {
    const tank = this.gameState.tanks[socketId];
    if (!tank || tank.health <= 0) return;

    // Handle movement
    if (input.move !== undefined) {
      tank.targetSpeed = input.move * 150; // max speed 150 pixels/second
    }

    // Handle rotation
    if (input.rotate !== undefined) {
      tank.angularVelocity = input.rotate * 3; // radians per second
    }

    // Handle shooting
    if (input.shoot && this.gameState.status === 'playing') {
      // Limit fire rate (simple check)
      const now = Date.now();
      if (!tank.lastShot || now - tank.lastShot > 500) {
        tank.lastShot = now;

        // Create bullet
        const bulletOffset = 25;
        this.gameState.bullets.push({
          x: tank.x + Math.cos(tank.angle) * bulletOffset,
          y: tank.y + Math.sin(tank.angle) * bulletOffset,
          vx: Math.cos(tank.angle),
          vy: Math.sin(tank.angle),
          radius: 4,
          owner: socketId,
          bounces: 0
        });
      }
    }
  }

  handleDisconnect(socketId) {
    this.players.delete(socketId);
    delete this.gameState.tanks[socketId];

    // Notify other players
    this.io.to(this.code).emit('playerDisconnected');
    this.stopGameLoop();
  }

  emitGameState() {
    this.io.to(this.code).emit('gameState', this.gameState);
  }
}

module.exports = GameRoom;
