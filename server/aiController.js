class AIController {
  constructor(difficulty, gameRoom, aiSocketId) {
    this.difficulty = difficulty;
    this.gameRoom = gameRoom;
    this.aiSocketId = aiSocketId;
    this.updateInterval = null;
    this.startTimeout = null;
    this.lastShot = 0;

    // Difficulty settings
    this.settings = this.getDifficultySettings(difficulty);
  }

  getDifficultySettings(difficulty) {
    switch (difficulty) {
      case 'easy':
        return {
          reactionTime: 800, // ms
          aimAccuracy: 0.3, // 30% accuracy
          moveSpeed: 0.6, // 60% of max speed
          shootFrequency: 2000, // shoot every 2 seconds
          dodgeChance: 0.2, // 20% chance to dodge
          wallAvoidanceDistance: 60
        };
      case 'medium':
        return {
          reactionTime: 400,
          aimAccuracy: 0.6,
          moveSpeed: 0.8,
          shootFrequency: 1200,
          dodgeChance: 0.5,
          wallAvoidanceDistance: 80
        };
      case 'hard':
        return {
          reactionTime: 150,
          aimAccuracy: 0.85,
          moveSpeed: 1.0,
          shootFrequency: 600,
          dodgeChance: 0.8,
          wallAvoidanceDistance: 100
        };
      default:
        return this.getDifficultySettings('medium');
    }
  }

  start() {
    // Add a small delay before AI starts to ensure game is fully initialized
    this.startTimeout = setTimeout(() => {
      // Update AI behavior based on difficulty reaction time
      this.updateInterval = setInterval(() => {
        this.update();
      }, this.settings.reactionTime);
    }, 1000); // 1 second delay before AI begins
  }

  stop() {
    if (this.startTimeout) {
      clearTimeout(this.startTimeout);
      this.startTimeout = null;
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  update() {
    const gameState = this.gameRoom.gameState;
    if (gameState.status !== 'playing') return;

    const aiTank = gameState.tanks[this.aiSocketId];
    if (!aiTank || aiTank.health <= 0) return;

    // Find player tank
    const playerTank = this.findPlayerTank();
    if (!playerTank) return;

    // Check for incoming bullets and dodge
    const shouldDodge = this.checkIncomingBullets(aiTank);

    if (shouldDodge && Math.random() < this.settings.dodgeChance) {
      this.dodgeBullet(aiTank);
    } else {
      // Normal behavior: move towards player and shoot
      this.moveTowardsPlayer(aiTank, playerTank);
      this.aimAndShoot(aiTank, playerTank);
    }
  }

  findPlayerTank() {
    for (const [socketId, tank] of Object.entries(this.gameRoom.gameState.tanks)) {
      if (socketId !== this.aiSocketId && tank.health > 0) {
        return tank;
      }
    }
    return null;
  }

  checkIncomingBullets(aiTank) {
    const bullets = this.gameRoom.gameState.bullets;

    for (const bullet of bullets) {
      if (bullet.owner === this.aiSocketId) continue;

      // Calculate if bullet is heading towards AI
      const dx = aiTank.x - bullet.x;
      const dy = aiTank.y - bullet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 150) {
        // Check if bullet velocity is pointing towards AI
        const dotProduct = bullet.vx * dx + bullet.vy * dy;
        if (dotProduct > 0) {
          return true;
        }
      }
    }
    return false;
  }

  dodgeBullet(aiTank) {
    // Move perpendicular to current facing
    const perpAngle = aiTank.angle + Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);

    this.gameRoom.handlePlayerInput(this.aiSocketId, {
      move: this.settings.moveSpeed,
      rotate: (Math.random() - 0.5) * 2,
      shoot: false
    });
  }

  moveTowardsPlayer(aiTank, playerTank) {
    const dx = playerTank.x - aiTank.x;
    const dy = playerTank.y - aiTank.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToPlayer = Math.atan2(dy, dx);

    // Check for walls ahead
    const wallAhead = this.checkWallAhead(aiTank, aiTank.angle);

    let targetAngle;
    if (wallAhead) {
      // Avoid wall by turning
      targetAngle = aiTank.angle + Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);
    } else {
      targetAngle = angleToPlayer;
    }

    // Calculate angle difference
    let angleDiff = targetAngle - aiTank.angle;

    // Normalize angle difference to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // Determine rotation direction
    let rotateValue = 0;
    if (Math.abs(angleDiff) > 0.1) {
      rotateValue = angleDiff > 0 ? 1 : -1;
    }

    // Determine movement
    let moveValue = 0;
    const optimalDistance = 200; // Prefer to stay at medium range

    if (wallAhead) {
      moveValue = -0.5; // Back up if wall ahead
    } else if (distance > optimalDistance + 50) {
      moveValue = this.settings.moveSpeed; // Move forward if too far
    } else if (distance < optimalDistance - 50) {
      moveValue = -this.settings.moveSpeed * 0.5; // Back up if too close
    } else {
      // Strafe at optimal distance
      moveValue = this.settings.moveSpeed * 0.3;
    }

    this.gameRoom.handlePlayerInput(this.aiSocketId, {
      move: moveValue,
      rotate: rotateValue,
      shoot: false
    });
  }

  checkWallAhead(tank, angle) {
    const checkDistance = this.settings.wallAvoidanceDistance;
    const checkX = tank.x + Math.cos(angle) * checkDistance;
    const checkY = tank.y + Math.sin(angle) * checkDistance;

    return this.gameRoom.checkWallCollision(checkX, checkY, tank.radius);
  }

  aimAndShoot(aiTank, playerTank) {
    const now = Date.now();
    if (now - this.lastShot < this.settings.shootFrequency) {
      return;
    }

    const dx = playerTank.x - aiTank.x;
    const dy = playerTank.y - aiTank.y;
    const angleToPlayer = Math.atan2(dy, dx);

    // Calculate angle difference
    let angleDiff = angleToPlayer - aiTank.angle;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // Add inaccuracy based on difficulty
    const inaccuracyAngle = (1 - this.settings.aimAccuracy) * Math.PI / 4;
    const aimTolerance = inaccuracyAngle;

    // Shoot if roughly aimed at player
    if (Math.abs(angleDiff) < aimTolerance) {
      this.lastShot = now;
      this.gameRoom.handlePlayerInput(this.aiSocketId, {
        move: 0,
        rotate: 0,
        shoot: true
      });
    }
  }
}

module.exports = AIController;
