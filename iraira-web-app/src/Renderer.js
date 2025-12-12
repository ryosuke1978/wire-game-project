/**
 * Renderer class - Handles all Canvas drawing operations for the game
 * ゲームのすべてのCanvas描画操作を処理する
 */
class Renderer {
  /**
   * Constructor - Initialize renderer with canvas context
   * @param {HTMLCanvasElement} canvas - The game canvas element
   */
  constructor(canvas) {
    if (!canvas) {
      throw new Error('Canvas element is required');
    }
    
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) {
      throw new Error('Unable to get 2D context from canvas');
    }
    
    // Set up canvas properties for smooth rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    // Store canvas dimensions
    this.width = canvas.width;
    this.height = canvas.height;
    
    // Color scheme
    this.colors = {
      background: '#1a1a2e',
      wall: '#e94560',
      path: '#16213e',
      character: '#0f3460',
      goal: '#f39c12',
      timer: '#ffffff',
      ui: '#ffffff'
    };
  }

  /**
   * Clear the entire canvas
   * キャンバス全体をクリア
   */
  clear() {
    this.ctx.fillStyle = this.colors.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Draw walls on the canvas
   * キャンバスに壁を描画
   * @param {Array} walls - Array of wall objects with x, y, width, height properties
   */
  drawWalls(walls) {
    if (!walls || !Array.isArray(walls)) {
      return;
    }

    this.ctx.fillStyle = this.colors.wall;
    this.ctx.strokeStyle = '#c0392b';
    this.ctx.lineWidth = 2;

    walls.forEach(wall => {
      if (wall && typeof wall.x === 'number' && typeof wall.y === 'number' &&
          typeof wall.width === 'number' && typeof wall.height === 'number') {
        
        // Draw wall with slight gradient effect
        this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        this.ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
      }
    });
  }

  /**
   * Draw the safe path on the canvas
   * キャンバスに安全な通路を描画
   * @param {Array} path - Array of path points with x, y properties
   * @param {number} pathWidth - Width of the path
   */
  drawPath(path, pathWidth = 60) {
    if (!path || !Array.isArray(path) || path.length === 0) {
      return;
    }

    this.ctx.fillStyle = this.colors.path;
    this.ctx.strokeStyle = '#2c3e50';
    this.ctx.lineWidth = 3;

    // Draw path as connected circles to create a smooth corridor
    const radius = pathWidth / 2;
    
    path.forEach((point, index) => {
      if (point && typeof point.x === 'number' && typeof point.y === 'number') {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Connect to next point if available
        if (index < path.length - 1) {
          const nextPoint = path[index + 1];
          if (nextPoint && typeof nextPoint.x === 'number' && typeof nextPoint.y === 'number') {
            // Draw connecting rectangle
            const dx = nextPoint.x - point.x;
            const dy = nextPoint.y - point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              const angle = Math.atan2(dy, dx);
              
              this.ctx.save();
              this.ctx.translate(point.x, point.y);
              this.ctx.rotate(angle);
              this.ctx.fillRect(0, -radius, distance, pathWidth);
              this.ctx.restore();
            }
          }
        }
      }
    });

    // Add path border for better visibility
    this.ctx.strokeStyle = '#34495e';
    this.ctx.lineWidth = 2;
    path.forEach(point => {
      if (point && typeof point.x === 'number' && typeof point.y === 'number') {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    });
  }

  /**
   * Draw the character on the canvas
   * キャンバスにキャラクターを描画
   * @param {Object} character - Character object with position and size
   */
  drawCharacter(character) {
    if (!character || typeof character.x !== 'number' || typeof character.y !== 'number') {
      return;
    }

    const size = character.size || 10;
    const x = character.x;
    const y = character.y;

    // Draw character as a circle with glow effect
    this.ctx.save();
    
    // Glow effect
    this.ctx.shadowColor = this.colors.character;
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Main character body
    this.ctx.fillStyle = this.colors.character;
    this.ctx.beginPath();
    this.ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Character border
    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Direction indicator (small arrow)
    if (character.direction) {
      this.drawDirectionIndicator(x + size/2, y + size/2, character.direction, size/3);
    }
    
    this.ctx.restore();
  }

  /**
   * Draw direction indicator on character
   * キャラクターに方向インジケーターを描画
   * @param {number} x - Center x position
   * @param {number} y - Center y position
   * @param {string} direction - Direction ('up', 'down', 'left', 'right')
   * @param {number} size - Size of the indicator
   */
  drawDirectionIndicator(x, y, direction, size) {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    
    switch (direction) {
      case 'up':
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x - size/2, y);
        this.ctx.lineTo(x + size/2, y);
        break;
      case 'down':
        this.ctx.moveTo(x, y + size);
        this.ctx.lineTo(x - size/2, y);
        this.ctx.lineTo(x + size/2, y);
        break;
      case 'left':
        this.ctx.moveTo(x - size, y);
        this.ctx.lineTo(x, y - size/2);
        this.ctx.lineTo(x, y + size/2);
        break;
      case 'right':
        this.ctx.moveTo(x + size, y);
        this.ctx.lineTo(x, y - size/2);
        this.ctx.lineTo(x, y + size/2);
        break;
    }
    
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  /**
   * Draw the goal area on the canvas
   * キャンバスにゴールエリアを描画
   * @param {Object} goal - Goal object with x, y position
   * @param {number} size - Size of the goal area (default: 30)
   */
  drawGoal(goal, size = 30) {
    if (!goal || typeof goal.x !== 'number' || typeof goal.y !== 'number') {
      return;
    }

    this.ctx.save();
    
    // Animated glow effect for goal
    const time = Date.now() * 0.005;
    const glowIntensity = 15 + Math.sin(time) * 5;
    
    this.ctx.shadowColor = this.colors.goal;
    this.ctx.shadowBlur = glowIntensity;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Draw goal as a star shape
    this.ctx.fillStyle = this.colors.goal;
    this.ctx.strokeStyle = '#d68910';
    this.ctx.lineWidth = 3;
    
    this.drawStar(goal.x, goal.y, size, 5);
    
    this.ctx.restore();
  }

  /**
   * Draw a star shape
   * 星形を描画
   * @param {number} x - Center x position
   * @param {number} y - Center y position
   * @param {number} radius - Radius of the star
   * @param {number} points - Number of star points
   */
  drawStar(x, y, radius, points) {
    const outerRadius = radius;
    const innerRadius = radius * 0.4;
    
    this.ctx.beginPath();
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      
      if (i === 0) {
        this.ctx.moveTo(px, py);
      } else {
        this.ctx.lineTo(px, py);
      }
    }
    
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  /**
   * Draw timer display on the canvas
   * キャンバスにタイマー表示を描画
   * @param {number} time - Current time in milliseconds
   * @param {number} x - X position (optional, defaults to top-left)
   * @param {number} y - Y position (optional, defaults to top-left)
   */
  drawTimer(time, x = 20, y = 30) {
    if (typeof time !== 'number') {
      return;
    }

    const seconds = (time / 1000).toFixed(2);
    const text = `Time: ${seconds}s`;
    
    this.ctx.save();
    
    // Timer background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(x - 10, y - 25, 150, 35);
    
    // Timer text
    this.ctx.fillStyle = this.colors.timer;
    this.ctx.font = 'bold 18px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    
    // Text shadow for better readability
    this.ctx.shadowColor = '#000000';
    this.ctx.shadowBlur = 2;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;
    
    this.ctx.fillText(text, x, y);
    
    this.ctx.restore();
  }

  /**
   * Draw UI elements based on game state
   * ゲーム状態に基づいてUI要素を描画
   * @param {Object} state - Game state object
   */
  drawUI(state) {
    if (!state) {
      return;
    }

    // Draw different UI elements based on game state
    switch (state.status) {
      case 'playing':
        this.drawGameplayUI(state);
        break;
      case 'paused':
        this.drawPausedUI(state);
        break;
      case 'gameover':
        this.drawGameOverUI(state);
        break;
      case 'victory':
        this.drawVictoryUI(state);
        break;
      default:
        // No additional UI for menu state (handled by HTML)
        break;
    }
  }

  /**
   * Draw gameplay UI elements
   * ゲームプレイ中のUI要素を描画
   * @param {Object} state - Game state object
   */
  drawGameplayUI(state) {
    // Draw difficulty indicator
    if (state.difficulty) {
      const difficultyText = `Difficulty: ${state.difficulty}`;
      
      this.ctx.save();
      
      // Background
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(this.width - 200, 10, 190, 35);
      
      // Text
      this.ctx.fillStyle = this.colors.ui;
      this.ctx.font = 'bold 16px Arial, sans-serif';
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'middle';
      
      this.ctx.shadowColor = '#000000';
      this.ctx.shadowBlur = 2;
      this.ctx.shadowOffsetX = 1;
      this.ctx.shadowOffsetY = 1;
      
      this.ctx.fillText(difficultyText, this.width - 20, 27);
      
      this.ctx.restore();
    }

    // Draw controls hint
    this.drawControlsHint();
  }

  /**
   * Draw controls hint
   * 操作方法のヒントを描画
   */
  drawControlsHint() {
    const hintText = 'Use Arrow Keys to Move';
    
    this.ctx.save();
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(20, this.height - 60, 200, 30);
    
    // Text
    this.ctx.fillStyle = this.colors.ui;
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    
    this.ctx.fillText(hintText, 30, this.height - 45);
    
    this.ctx.restore();
  }

  /**
   * Draw paused UI overlay
   * 一時停止中のUIオーバーレイを描画
   * @param {Object} state - Game state object
   */
  drawPausedUI(state) {
    // Semi-transparent overlay
    this.ctx.save();
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Paused text
    this.ctx.fillStyle = this.colors.ui;
    this.ctx.font = 'bold 48px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    this.ctx.shadowColor = '#000000';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
    
    // Resume instruction
    this.ctx.font = '24px Arial, sans-serif';
    this.ctx.fillText('Press SPACE to Resume', this.width / 2, this.height / 2 + 60);
    
    this.ctx.restore();
  }

  /**
   * Draw game over UI overlay
   * ゲームオーバー時のUIオーバーレイを描画
   * @param {Object} state - Game state object
   */
  drawGameOverUI(state) {
    // Semi-transparent red overlay
    this.ctx.save();
    
    this.ctx.fillStyle = 'rgba(233, 69, 96, 0.3)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.restore();
  }

  /**
   * Draw victory UI overlay
   * 勝利時のUIオーバーレイを描画
   * @param {Object} state - Game state object
   */
  drawVictoryUI(state) {
    // Semi-transparent golden overlay
    this.ctx.save();
    
    this.ctx.fillStyle = 'rgba(243, 156, 18, 0.3)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.restore();
  }

  /**
   * Get canvas context for external use
   * 外部使用のためのキャンバスコンテキストを取得
   * @returns {CanvasRenderingContext2D} Canvas 2D context
   */
  getContext() {
    return this.ctx;
  }

  /**
   * Get canvas element
   * キャンバス要素を取得
   * @returns {HTMLCanvasElement} Canvas element
   */
  getCanvas() {
    return this.canvas;
  }

  /**
   * Resize canvas and update internal dimensions
   * キャンバスのサイズを変更し、内部寸法を更新
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
    
    // Restore canvas properties after resize
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Renderer;
}