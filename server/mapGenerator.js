class MapGenerator {
  static generate(width = 800, height = 600) {
    const tileSize = 40;
    const cols = Math.floor(width / tileSize);
    const rows = Math.floor(height / tileSize);

    // Initialize map with grass
    const map = Array(rows).fill(null).map(() => Array(cols).fill('grass'));

    // Add border walls
    this.addBorderWalls(map, rows, cols);

    // Add random obstacles (walls)
    this.addRandomObstacles(map, rows, cols);

    // Add mud patches
    this.addMudPatches(map, rows, cols);

    // Ensure spawn areas are clear
    this.clearSpawnAreas(map, rows, cols);

    return map;
  }

  static addBorderWalls(map, rows, cols) {
    // Top and bottom walls
    for (let col = 0; col < cols; col++) {
      map[0][col] = 'wall';
      map[rows - 1][col] = 'wall';
    }

    // Left and right walls
    for (let row = 0; row < rows; row++) {
      map[row][0] = 'wall';
      map[row][cols - 1] = 'wall';
    }
  }

  static addRandomObstacles(map, rows, cols) {
    const numObstacles = 8 + Math.floor(Math.random() * 8); // 8-15 obstacles

    for (let i = 0; i < numObstacles; i++) {
      const obstacleType = Math.random() < 0.7 ? 'single' : 'cluster';

      if (obstacleType === 'single') {
        this.addSingleWall(map, rows, cols);
      } else {
        this.addWallCluster(map, rows, cols);
      }
    }
  }

  static addSingleWall(map, rows, cols) {
    const row = 2 + Math.floor(Math.random() * (rows - 4));
    const col = 2 + Math.floor(Math.random() * (cols - 4));

    if (map[row][col] === 'grass') {
      map[row][col] = 'wall';
    }
  }

  static addWallCluster(map, rows, cols) {
    const centerRow = 3 + Math.floor(Math.random() * (rows - 6));
    const centerCol = 3 + Math.floor(Math.random() * (cols - 6));

    const patterns = [
      // L-shape
      [[0, 0], [0, 1], [1, 0]],
      // T-shape
      [[0, 0], [0, 1], [0, 2], [1, 1]],
      // Square
      [[0, 0], [0, 1], [1, 0], [1, 1]],
      // Line
      [[0, 0], [0, 1], [0, 2]],
      // Cross
      [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]]
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    for (const [dRow, dCol] of pattern) {
      const row = centerRow + dRow;
      const col = centerCol + dCol;

      if (row >= 2 && row < rows - 2 && col >= 2 && col < cols - 2) {
        if (map[row][col] === 'grass') {
          map[row][col] = 'wall';
        }
      }
    }
  }

  static addMudPatches(map, rows, cols) {
    const numPatches = 5 + Math.floor(Math.random() * 5); // 5-9 mud patches

    for (let i = 0; i < numPatches; i++) {
      const centerRow = 2 + Math.floor(Math.random() * (rows - 4));
      const centerCol = 2 + Math.floor(Math.random() * (cols - 4));

      const patchSize = 2 + Math.floor(Math.random() * 3); // 2-4 tiles

      for (let dr = -patchSize; dr <= patchSize; dr++) {
        for (let dc = -patchSize; dc <= patchSize; dc++) {
          const row = centerRow + dr;
          const col = centerCol + dc;

          if (row >= 1 && row < rows - 1 && col >= 1 && col < cols - 1) {
            const distance = Math.sqrt(dr * dr + dc * dc);
            if (distance <= patchSize && map[row][col] === 'grass' && Math.random() < 0.6) {
              map[row][col] = 'mud';
            }
          }
        }
      }
    }
  }

  static clearSpawnAreas(map, rows, cols) {
    // Clear left spawn area (player 1)
    for (let row = Math.floor(rows / 2) - 2; row <= Math.floor(rows / 2) + 2; row++) {
      for (let col = 1; col <= 4; col++) {
        if (row >= 1 && row < rows - 1 && col >= 1 && col < cols - 1) {
          map[row][col] = 'grass';
        }
      }
    }

    // Clear right spawn area (player 2)
    for (let row = Math.floor(rows / 2) - 2; row <= Math.floor(rows / 2) + 2; row++) {
      for (let col = cols - 5; col < cols - 1; col++) {
        if (row >= 1 && row < rows - 1 && col >= 1 && col < cols - 1) {
          map[row][col] = 'grass';
        }
      }
    }
  }
}

module.exports = MapGenerator;
