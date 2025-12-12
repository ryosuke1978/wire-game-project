/**
 * LevelGenerator class - Generates game levels with paths and walls based on difficulty
 * 難易度に基づいてゲームレベル（通路と壁）を生成する
 */
class LevelGenerator {
  /**
   * Constructor - Initialize level generator with canvas dimensions and difficulty
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {string} difficulty - Difficulty level ('easy', 'medium', 'hard', 'super-hard')
   */
  constructor(width, height, difficulty) {
    this.width = width;
    this.height = height;
    this.difficulty = difficulty;
    
    // Difficulty settings based on requirements
    this.difficultySettings = {
      'easy': { pathWidth: 100, characterSpeed: 2 },
      'medium': { pathWidth: 60, characterSpeed: 3 },
      'hard': { pathWidth: 40, characterSpeed: 4 },
      'super-hard': { pathWidth: 30, characterSpeed: 6 }
    };
    
    // Validate difficulty
    if (!this.difficultySettings[difficulty]) {
      throw new Error(`Invalid difficulty: ${difficulty}`);
    }
    
    this.settings = this.difficultySettings[difficulty];
    
    // Generated level data
    this.walls = [];
    this.path = [];
    this.startPosition = null;
    this.goalPosition = null;
    this.waypoints = [];
  }

  /**
   * Generate the complete level with paths and walls
   * 通路と壁を含む完全なレベルを生成
   */
  generate() {
    this.generateWaypoints();
    this.generatePath();
    this.generateWalls();
    this.setStartAndGoalPositions();
  }

  /**
   * Generate random waypoints across the canvas
   * キャンバス全体にランダムなウェイポイントを生成
   */
  generateWaypoints() {
    this.waypoints = [];
    
    // Start point at left edge (middle height)
    const startX = 50;
    const startY = this.height / 2;
    this.waypoints.push({ x: startX, y: startY });
    
    // Generate 3-5 intermediate waypoints
    const numWaypoints = 3 + Math.floor(Math.random() * 3);
    const segmentWidth = (this.width - 150) / (numWaypoints + 1); // Leave space for start and goal
    
    for (let i = 1; i <= numWaypoints; i++) {
      const x = startX + (segmentWidth * i) + (Math.random() - 0.5) * 50;
      const y = 100 + Math.random() * (this.height - 200); // Keep away from edges
      this.waypoints.push({ x, y });
    }
    
    // Goal point at right edge
    const goalX = this.width - 50;
    const goalY = 100 + Math.random() * (this.height - 200);
    this.waypoints.push({ x: goalX, y: goalY });
  }

  /**
   * Generate smooth path connecting waypoints
   * ウェイポイントを接続するスムーズな通路を生成
   */
  generatePath() {
    this.path = [];
    
    // Generate path points between each pair of waypoints
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const start = this.waypoints[i];
      const end = this.waypoints[i + 1];
      
      // Create smooth curve between waypoints using quadratic interpolation
      const steps = Math.floor(Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)) / 5);
      
      for (let t = 0; t <= steps; t++) {
        const ratio = t / steps;
        
        // Add some curve variation for more interesting paths
        const midX = (start.x + end.x) / 2 + (Math.random() - 0.5) * 30;
        const midY = (start.y + end.y) / 2 + (Math.random() - 0.5) * 30;
        
        // Quadratic Bezier curve
        const x = Math.pow(1 - ratio, 2) * start.x + 
                  2 * (1 - ratio) * ratio * midX + 
                  Math.pow(ratio, 2) * end.x;
        const y = Math.pow(1 - ratio, 2) * start.y + 
                  2 * (1 - ratio) * ratio * midY + 
                  Math.pow(ratio, 2) * end.y;
        
        this.path.push({ x, y });
      }
    }
  }

  /**
   * Generate walls along path boundaries
   * 通路境界に沿って壁を生成
   */
  generateWalls() {
    this.walls = [];
    const halfWidth = this.settings.pathWidth / 2;
    
    // Create walls along the path
    for (let i = 0; i < this.path.length - 1; i++) {
      const current = this.path[i];
      const next = this.path[i + 1];
      
      // Calculate perpendicular direction for wall placement
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length > 0) {
        const perpX = -dy / length;
        const perpY = dx / length;
        
        // Create wall segments on both sides of the path
        const wallThickness = 20;
        
        // Left wall
        const leftWallX = current.x + perpX * (halfWidth + wallThickness / 2);
        const leftWallY = current.y + perpY * (halfWidth + wallThickness / 2);
        
        // Right wall
        const rightWallX = current.x - perpX * (halfWidth + wallThickness / 2);
        const rightWallY = current.y - perpY * (halfWidth + wallThickness / 2);
        
        // Add wall segments
        this.walls.push({
          x: leftWallX - wallThickness / 2,
          y: leftWallY - wallThickness / 2,
          width: wallThickness,
          height: wallThickness
        });
        
        this.walls.push({
          x: rightWallX - wallThickness / 2,
          y: rightWallY - wallThickness / 2,
          width: wallThickness,
          height: wallThickness
        });
      }
    }
    
    // Add boundary walls around the entire canvas
    const boundaryThickness = 50;
    
    // Top boundary
    this.walls.push({
      x: 0,
      y: 0,
      width: this.width,
      height: boundaryThickness
    });
    
    // Bottom boundary
    this.walls.push({
      x: 0,
      y: this.height - boundaryThickness,
      width: this.width,
      height: boundaryThickness
    });
    
    // Left boundary (with gap for start)
    this.walls.push({
      x: 0,
      y: 0,
      width: boundaryThickness,
      height: this.height
    });
    
    // Right boundary (with gap for goal)
    this.walls.push({
      x: this.width - boundaryThickness,
      y: 0,
      width: boundaryThickness,
      height: this.height
    });
  }

  /**
   * Set start and goal positions based on waypoints
   * ウェイポイントに基づいてスタートとゴール位置を設定
   */
  setStartAndGoalPositions() {
    if (this.waypoints.length >= 2) {
      this.startPosition = { ...this.waypoints[0] };
      this.goalPosition = { ...this.waypoints[this.waypoints.length - 1] };
    }
  }

  /**
   * Get generated walls
   * 生成された壁を取得
   * @returns {Array} Array of wall objects with x, y, width, height properties
   */
  getWalls() {
    return this.walls;
  }

  /**
   * Get start position
   * スタート位置を取得
   * @returns {{x: number, y: number}} Start position
   */
  getStartPosition() {
    return this.startPosition;
  }

  /**
   * Get goal position
   * ゴール位置を取得
   * @returns {{x: number, y: number}} Goal position
   */
  getGoalPosition() {
    return this.goalPosition;
  }

  /**
   * Get path width for current difficulty
   * 現在の難易度の通路幅を取得
   * @returns {number} Path width in pixels
   */
  getPathWidth() {
    return this.settings.pathWidth;
  }

  /**
   * Get character speed for current difficulty
   * 現在の難易度のキャラクター速度を取得
   * @returns {number} Character speed in pixels per frame
   */
  getCharacterSpeed() {
    return this.settings.characterSpeed;
  }

  /**
   * Get generated path points
   * 生成された通路ポイントを取得
   * @returns {Array} Array of path points with x, y properties
   */
  getPath() {
    return this.path;
  }

  /**
   * Get waypoints used for generation
   * 生成に使用されたウェイポイントを取得
   * @returns {Array} Array of waypoints with x, y properties
   */
  getWaypoints() {
    return this.waypoints;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LevelGenerator;
}