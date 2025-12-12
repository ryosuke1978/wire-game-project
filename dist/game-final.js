// Wire Game - FINAL VERSION - All issues fixed
// 完全修正版：操作方法、スコア送信、ゲーム性すべて修正済み

// Validation utilities
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function validateNameLength(name) {
  if (typeof name !== 'string') {
    throw new ValidationError('名前は文字列である必要があります');
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 1) {
    throw new ValidationError('名前は1文字以上である必要があります');
  }
  
  if (trimmedName.length > 20) {
    throw new ValidationError('名前は20文字以下である必要があります');
  }
  
  return true;
}

function sanitizeName(name) {
  if (typeof name !== 'string') {
    throw new ValidationError('名前は文字列である必要があります');
  }
  
  const allowedPattern = /^[a-zA-Z0-9\s\-_\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/;
  const trimmedName = name.trim();
  
  if (!allowedPattern.test(trimmedName)) {
    throw new ValidationError('名前には英数字、スペース、ハイフン、アンダースコア、日本語文字のみ使用できます');
  }
  
  const sanitized = trimmedName.replace(/\s+/g, ' ');
  return sanitized;
}

// Offline API Client (No network calls)
class OfflineAPIClient {
  constructor() {
    console.log('OfflineAPIClient initialized - No network calls');
  }

  async submitScore(playerName, score, difficulty) {
    console.log('Offline: Submitting score', { playerName, score, difficulty });
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const scores = JSON.parse(localStorage.getItem('wireGameScores') || '[]');
    const newScore = {
      playerName,
      score,
      difficulty,
      timestamp: Date.now(),
      id: Date.now() + Math.random()
    };
    
    scores.push(newScore);
    localStorage.setItem('wireGameScores', JSON.stringify(scores));
    
    console.log('Score saved to localStorage:', newScore);
    return { success: true, message: 'Score submitted successfully' };
  }

  async getLeaderboard(difficulty, limit = 10) {
    console.log('Offline: Getting leaderboard', { difficulty, limit });
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const scores = JSON.parse(localStorage.getItem('wireGameScores') || '[]');
    
    const filteredScores = scores
      .filter(score => score.difficulty === difficulty)
      .sort((a, b) => a.score - b.score)
      .slice(0, limit);
    
    console.log('Leaderboard loaded:', filteredScores);
    return filteredScores;
  }
}

// Character class - FIXED: Moves only while key is pressed
class Character {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.direction = null; // Current movement direction
    this.initialX = x;
    this.initialY = y;
  }

  setDirection(direction) {
    const validDirections = ['up', 'down', 'left', 'right'];
    if (validDirections.includes(direction)) {
      this.direction = direction;
      console.log('Direction set to:', direction);
    }
  }

  stopMovement() {
    this.direction = null;
  }

  update(speed) {
    if (!this.direction) return;

    switch (this.direction) {
      case 'up': this.y -= speed; break;
      case 'down': this.y += speed; break;
      case 'left': this.x -= speed; break;
      case 'right': this.x += speed; break;
    }
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.size, height: this.size };
  }

  reset(x, y) {
    this.x = x !== undefined ? x : this.initialX;
    this.y = y !== undefined ? y : this.initialY;
    this.direction = null;
  }
}
// Level Generator - SIMPLIFIED: Only boundary walls
class LevelGenerator {
  constructor(width, height, difficulty) {
    this.width = width;
    this.height = height;
    this.difficulty = difficulty;
    
    // Original difficulty settings as per specification
    this.difficultySettings = {
      'easy': { pathWidth: 100, characterSpeed: 2 },
      'medium': { pathWidth: 60, characterSpeed: 3 },
      'hard': { pathWidth: 40, characterSpeed: 4 },
      'super-hard': { pathWidth: 30, characterSpeed: 6 }
    };
    
    this.settings = this.difficultySettings[difficulty] || this.difficultySettings['easy'];
    this.walls = [];
    this.path = [];
    this.startPosition = null;
    this.goalPosition = null;
    this.waypoints = [];
  }

  generate() {
    this.generateWaypoints();
    this.generatePath();
    this.generateWalls();
    this.setStartAndGoalPositions();
  }

  generateWaypoints() {
    this.waypoints = [];
    
    // Start position (left side)
    const startX = 80;
    const startY = this.height / 2;
    this.waypoints.push({ x: startX, y: startY });
    
    // Generate 3-5 intermediate waypoints for interesting curves
    const numWaypoints = 3 + Math.floor(Math.random() * 3);
    const segmentWidth = (this.width - 160) / (numWaypoints + 1);
    
    for (let i = 1; i <= numWaypoints; i++) {
      const x = startX + (segmentWidth * i) + (Math.random() - 0.5) * 40;
      const y = 120 + Math.random() * (this.height - 240); // Keep away from edges
      this.waypoints.push({ x, y });
    }
    
    // Goal position (right side)
    const goalX = this.width - 80;
    const goalY = 120 + Math.random() * (this.height - 240);
    this.waypoints.push({ x: goalX, y: goalY });
  }

  generatePath() {
    this.path = [];
    
    // Generate smooth curved path through all waypoints
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const start = this.waypoints[i];
      const end = this.waypoints[i + 1];
      
      // Calculate number of steps based on distance
      const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      const steps = Math.floor(distance / 5);
      
      for (let t = 0; t <= steps; t++) {
        const ratio = t / steps;
        
        // Add curve variation for more interesting paths
        const midX = (start.x + end.x) / 2 + (Math.random() - 0.5) * 50;
        const midY = (start.y + end.y) / 2 + (Math.random() - 0.5) * 50;
        
        // Quadratic Bezier curve for smooth paths
        const x = Math.pow(1 - ratio, 2) * start.x + 
                  2 * (1 - ratio) * ratio * midX + 
                  Math.pow(ratio, 2) * end.x;
        const y = Math.pow(1 - ratio, 2) * start.y + 
                  2 * (1 - ratio) * ratio * midY + 
                  Math.pow(ratio, 2) * end.y;
        
        // Use fixed width as per specification (Easy: 100px, Medium: 60px, Hard: 40px, Super Hard: 30px)
        const pathWidth = this.settings.pathWidth;
        
        this.path.push({ x, y, width: pathWidth });
      }
    }
  }

  generateWalls() {
    this.walls = [];
    
    // Generate continuous curved walls along path boundaries
    this.leftWallPath = [];
    this.rightWallPath = [];
    
    // Create smooth boundary paths
    for (let i = 0; i < this.path.length; i++) {
      const current = this.path[i];
      let perpX = 0, perpY = 0;
      
      if (i < this.path.length - 1) {
        const next = this.path[i + 1];
        const dx = next.x - current.x;
        const dy = next.y - current.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
          perpX = -dy / length;
          perpY = dx / length;
        }
      } else if (i > 0) {
        const prev = this.path[i - 1];
        const dx = current.x - prev.x;
        const dy = current.y - prev.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
          perpX = -dy / length;
          perpY = dx / length;
        }
      }
      
      const halfWidth = (current.width || this.settings.pathWidth) / 2;
      
      // Left and right boundary points
      this.leftWallPath.push({
        x: current.x + perpX * halfWidth,
        y: current.y + perpY * halfWidth
      });
      
      this.rightWallPath.push({
        x: current.x - perpX * halfWidth,
        y: current.y - perpY * halfWidth
      });
    }
    
    // Convert boundary paths to collision rectangles
    const wallThickness = 12;
    
    // Left wall segments
    for (let i = 0; i < this.leftWallPath.length - 1; i++) {
      const current = this.leftWallPath[i];
      const next = this.leftWallPath[i + 1];
      
      this.walls.push({
        x: Math.min(current.x, next.x) - wallThickness / 2,
        y: Math.min(current.y, next.y) - wallThickness / 2,
        width: Math.abs(next.x - current.x) + wallThickness,
        height: Math.abs(next.y - current.y) + wallThickness
      });
    }
    
    // Right wall segments
    for (let i = 0; i < this.rightWallPath.length - 1; i++) {
      const current = this.rightWallPath[i];
      const next = this.rightWallPath[i + 1];
      
      this.walls.push({
        x: Math.min(current.x, next.x) - wallThickness / 2,
        y: Math.min(current.y, next.y) - wallThickness / 2,
        width: Math.abs(next.x - current.x) + wallThickness,
        height: Math.abs(next.y - current.y) + wallThickness
      });
    }
    
    console.log('Generated curved path boundary walls:', this.walls.length);
  }

  setStartAndGoalPositions() {
    if (this.waypoints.length >= 2) {
      this.startPosition = { ...this.waypoints[0] };
      this.goalPosition = { ...this.waypoints[this.waypoints.length - 1] };
    }
  }

  getWalls() { return this.walls; }
  getStartPosition() { return this.startPosition; }
  getGoalPosition() { return this.goalPosition; }
  getPathWidth() { return this.settings.pathWidth; }
  getCharacterSpeed() { return this.settings.characterSpeed; }
  getPath() { return this.path; }
}

// Collision Detector
class CollisionDetector {
  constructor(character, walls, goal) {
    this.character = character;
    this.walls = walls;
    this.goal = goal;
    this.goalSize = 30;
    this.lastCollisionPoint = null;
  }

  checkWallCollision() {
    const characterBounds = this.character.getBounds();
    const characterCenterX = characterBounds.x + characterBounds.width / 2;
    const characterCenterY = characterBounds.y + characterBounds.height / 2;
    
    // Check if character is within the safe path area
    // Find the closest path point
    let minDistance = Infinity;
    let closestPathPoint = null;
    
    // Get path from level generator (assuming it's available)
    const levelGenerator = this.character.levelGenerator || window.currentLevelGenerator;
    if (levelGenerator && levelGenerator.getPath) {
      const path = levelGenerator.getPath();
      
      for (let pathPoint of path) {
        const distance = Math.sqrt(
          Math.pow(characterCenterX - pathPoint.x, 2) + 
          Math.pow(characterCenterY - pathPoint.y, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestPathPoint = pathPoint;
        }
      }
      
      // If character is outside the path width, it's a collision
      if (closestPathPoint) {
        const pathRadius = (closestPathPoint.width || 40) / 2; // Default to 40px width
        if (minDistance > pathRadius - characterBounds.width / 2) {
          this.lastCollisionPoint = {
            x: characterCenterX,
            y: characterCenterY
          };
          return true;
        }
      }
    }
    
    // Also check screen boundaries
    if (characterCenterX < 20 || characterCenterX > 780 || 
        characterCenterY < 20 || characterCenterY > 580) {
      this.lastCollisionPoint = {
        x: characterCenterX,
        y: characterCenterY
      };
      return true;
    }
    
    return false;
  }

  checkGoalCollision() {
    const characterBounds = this.character.getBounds();
    const goalBounds = {
      x: this.goal.x - this.goalSize / 2,
      y: this.goal.y - this.goalSize / 2,
      width: this.goalSize,
      height: this.goalSize
    };
    return this.boundingBoxCollision(characterBounds, goalBounds);
  }

  boundingBoxCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  getCollisionPoint() { return this.lastCollisionPoint; }
  updateWalls(walls) { this.walls = walls; }
  updateGoal(goal) { this.goal = goal; }
  reset() { this.lastCollisionPoint = null; }
}

// Simple Renderer - Specification colors
class SimpleRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  clear() {
    // Background color as per specification
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPath(path, pathWidth) {
    if (path.length < 2) return;
    
    // Draw path area (safe zone) with bright white circles for clear visibility
    this.ctx.fillStyle = '#ffffff';
    
    // Draw path as connected circles showing the safe area
    for (let i = 0; i < path.length; i++) {
      const point = path[i];
      const radius = (point.width || pathWidth) / 2; // Radius = half of specified width
      
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Draw center guide line with darker color for visibility on white path
    this.ctx.strokeStyle = '#2c3e50';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([8, 4]);
    this.ctx.globalAlpha = 0.7;
    
    this.ctx.beginPath();
    this.ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      this.ctx.lineTo(path[i].x, path[i].y);
    }
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    this.ctx.globalAlpha = 1.0; // Reset alpha
  }

  drawWalls(walls, levelGenerator) {
    // No visible walls - collision detection is handled by path distance
    // The circular path visualization shows the safe area clearly
  }

  drawGoal(goal) {
    // Orange goal as per specification
    this.ctx.fillStyle = '#f39c12';
    this.ctx.strokeStyle = '#e67e22';
    this.ctx.lineWidth = 3;
    
    this.ctx.beginPath();
    this.ctx.arc(goal.x, goal.y, 20, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Inner white circle
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(goal.x, goal.y, 8, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawCharacter(character) {
    const pos = character.getPosition();
    const radius = character.size / 2;
    
    // Blue circular character as per specification
    this.ctx.fillStyle = '#0f3460';
    this.ctx.strokeStyle = '#2196f3';
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.arc(pos.x + radius, pos.y + radius, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  }
}
// Input Handler - FIXED: Keyboard and Touch Controls
class InputHandler {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.keys = {};
    this.touchButtons = {};
    this.enabled = false;
    
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  enable() {
    this.enabled = true;
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    // Touch control events
    this.setupTouchControls();
    
    console.log('Input handler enabled - use arrow keys, WASD, or touch controls');
  }

  disable() {
    this.enabled = false;
    
    // Remove keyboard events
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    
    // Remove touch events
    this.removeTouchControls();
  }

  setupTouchControls() {
    const touchButtons = ['btn-up', 'btn-down', 'btn-left', 'btn-right'];
    
    touchButtons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        // Mouse events for desktop testing
        button.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.handleTouchStart(e, buttonId);
        });
        button.addEventListener('mouseup', (e) => {
          e.preventDefault();
          this.handleTouchEnd(e, buttonId);
        });
        button.addEventListener('mouseleave', (e) => {
          e.preventDefault();
          this.handleTouchEnd(e, buttonId);
        });
        
        // Touch events for mobile devices
        button.addEventListener('touchstart', (e) => {
          e.preventDefault();
          this.handleTouchStart(e, buttonId);
        });
        button.addEventListener('touchend', (e) => {
          e.preventDefault();
          this.handleTouchEnd(e, buttonId);
        });
        button.addEventListener('touchcancel', (e) => {
          e.preventDefault();
          this.handleTouchEnd(e, buttonId);
        });
        
        this.touchButtons[buttonId] = button;
      }
    });
  }

  removeTouchControls() {
    Object.values(this.touchButtons).forEach(button => {
      if (button) {
        // Clone and replace to remove all event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
      }
    });
    this.touchButtons = {};
  }

  handleTouchStart(event, buttonId) {
    if (!this.enabled || !this.gameManager.character) return;
    
    const button = document.getElementById(buttonId);
    if (button) {
      button.classList.add('pressed');
    }
    
    const direction = this.getDirectionFromButtonId(buttonId);
    if (direction) {
      this.gameManager.character.setDirection(direction);
      this.keys[`touch-${direction}`] = true;
    }
  }

  handleTouchEnd(event, buttonId) {
    if (!this.enabled) return;
    
    const button = document.getElementById(buttonId);
    if (button) {
      button.classList.remove('pressed');
    }
    
    const direction = this.getDirectionFromButtonId(buttonId);
    if (direction) {
      this.keys[`touch-${direction}`] = false;
      
      // Check if any movement key/button is still pressed
      const stillMoving = this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['touch-up'] ||
                         this.keys['ArrowDown'] || this.keys['KeyS'] || this.keys['touch-down'] ||
                         this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['touch-left'] ||
                         this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['touch-right'];
      
      if (!stillMoving && this.gameManager.character) {
        this.gameManager.character.stopMovement();
      }
    }
  }

  getDirectionFromButtonId(buttonId) {
    const directionMap = {
      'btn-up': 'up',
      'btn-down': 'down',
      'btn-left': 'left',
      'btn-right': 'right'
    };
    return directionMap[buttonId];
  }

  handleKeyDown(event) {
    if (!this.enabled) return;
    
    this.keys[event.code] = true;
    
    if (this.gameManager.character) {
      // Set direction while key is pressed
      if (event.code === 'ArrowUp' || event.code === 'KeyW') {
        this.gameManager.character.setDirection('up');
      } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        this.gameManager.character.setDirection('down');
      } else if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        this.gameManager.character.setDirection('left');
      } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        this.gameManager.character.setDirection('right');
      }
    }
  }

  handleKeyUp(event) {
    if (!this.enabled) return;
    
    this.keys[event.code] = false;
    
    // Stop movement when key is released
    if (this.gameManager.character) {
      if (event.code === 'ArrowUp' || event.code === 'KeyW' ||
          event.code === 'ArrowDown' || event.code === 'KeyS' ||
          event.code === 'ArrowLeft' || event.code === 'KeyA' ||
          event.code === 'ArrowRight' || event.code === 'KeyD') {
        
        // Check if any movement key or touch button is still pressed
        const stillMoving = this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['touch-up'] ||
                           this.keys['ArrowDown'] || this.keys['KeyS'] || this.keys['touch-down'] ||
                           this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['touch-left'] ||
                           this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['touch-right'];
        
        if (!stillMoving) {
          this.gameManager.character.stopMovement();
        }
      }
    }
  }
}

// Real Game Manager with fixed game logic
class RealGameManager {
  constructor(canvas, difficulty) {
    this.canvas = canvas;
    this.difficulty = difficulty;
    this.state = 'menu';
    this.startTime = 0;
    this.currentTime = 0;
    this.score = 0;
    this.gameLoopId = null;
    this.lastFrameTime = 0;
    
    this.initializeComponents();
    this.gameLoop = this.gameLoop.bind(this);
  }

  initializeComponents() {
    this.levelGenerator = new LevelGenerator(this.canvas.width, this.canvas.height, this.difficulty);
    this.levelGenerator.generate();

    const startPos = this.levelGenerator.getStartPosition();
    this.character = new Character(startPos.x, startPos.y, 15); // Larger character
    this.character.levelGenerator = this.levelGenerator; // Add reference for collision detection
    
    // Set global reference for collision detector
    window.currentLevelGenerator = this.levelGenerator;

    this.collisionDetector = new CollisionDetector(
      this.character,
      this.levelGenerator.getWalls(),
      this.levelGenerator.getGoalPosition()
    );

    this.renderer = new SimpleRenderer(this.canvas);
    this.inputHandler = new InputHandler(this);
  }

  startGame() {
    this.state = 'playing';
    this.startTime = Date.now();
    this.currentTime = 0;
    this.score = 0;
    
    const startPos = this.levelGenerator.getStartPosition();
    this.character.reset(startPos.x, startPos.y);
    
    this.inputHandler.enable();
    this.startGameLoop();
    
    console.log('🎮 FIXED Game started!');
    console.log('📋 Controls: Hold arrow key - character moves while key is pressed');
    console.log('🎯 Goal: Reach the orange target without hitting red walls');
  }

  startGameLoop() {
    if (!this.gameLoopId) {
      this.lastFrameTime = performance.now();
      this.gameLoopId = requestAnimationFrame(this.gameLoop);
    }
  }

  stopGameLoop() {
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  gameLoop(timestamp) {
    if (this.state !== 'playing') {
      return;
    }

    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    this.update(deltaTime);
    this.gameLoopId = requestAnimationFrame(this.gameLoop);
  }

  update(deltaTime) {
    if (this.state !== 'playing') return;

    this.currentTime = Date.now() - this.startTime;

    const speed = this.levelGenerator.getCharacterSpeed();
    this.character.update(speed);

    // Check wall collision
    if (this.collisionDetector.checkWallCollision()) {
      this.handleGameOver();
      return;
    }

    // Check goal collision
    if (this.collisionDetector.checkGoalCollision()) {
      this.handleGoalReached();
      return;
    }

    this.render();
  }

  render() {
    this.renderer.clear();
    this.renderer.drawPath(this.levelGenerator.getPath(), this.levelGenerator.getPathWidth());
    this.renderer.drawWalls(this.levelGenerator.getWalls(), this.levelGenerator);
    this.renderer.drawGoal(this.levelGenerator.getGoalPosition());
    this.renderer.drawCharacter(this.character);
  }

  handleGameOver() {
    this.state = 'gameover';
    this.inputHandler.disable();
    this.stopGameLoop();
    
    console.log('💥 Game Over! Hit a wall.');
    
    // Notify UI
    const event = new CustomEvent('gameOver', {
      detail: { score: this.currentTime, difficulty: this.difficulty }
    });
    document.dispatchEvent(event);
  }

  handleGoalReached() {
    this.state = 'victory';
    this.score = this.currentTime;
    this.inputHandler.disable();
    this.stopGameLoop();
    
    console.log('🎉 Victory! Reached the goal in', (this.score / 1000).toFixed(2), 'seconds');
    
    // Notify UI
    const event = new CustomEvent('victory', {
      detail: { score: this.score, difficulty: this.difficulty }
    });
    document.dispatchEvent(event);
  }

  getCurrentState() { return this.state; }
  getCurrentScore() { return this.state === 'playing' ? this.currentTime : this.score; }
  getDifficulty() { return this.difficulty; }
  setDifficulty(difficulty) { this.difficulty = difficulty; }

  endGame(victory = true) {
    if (victory) {
      this.handleGoalReached();
    } else {
      this.handleGameOver();
    }
  }

  destroy() {
    this.stopGameLoop();
    if (this.inputHandler) {
      this.inputHandler.disable();
    }
    this.state = 'menu';
  }
}
// UI Manager - FIXED: No score submission on game over
class UIManager {
  constructor() {
    this.gameManager = null;
    this.apiClient = new OfflineAPIClient();
    this.selectedDifficulty = null;
    
    this.screens = {
      menu: document.getElementById('menu-screen'),
      game: document.getElementById('game-screen'),
      gameover: document.getElementById('gameover-screen'),
      victory: document.getElementById('victory-screen'),
      leaderboard: document.getElementById('leaderboard-screen')
    };
    
    this.canvas = document.getElementById('game-canvas');
    
    this.setupEventListeners();
    this.setupGameEvents();
    this.showScreen('menu');
    
    console.log('🎮 UIManager initialized - FIXED VERSION');
    console.log('✅ Game over score submission: DISABLED');
    console.log('✅ Victory score submission: ENABLED');
    console.log('✅ Controls: Hold key = movement while pressed');
  }

  setupEventListeners() {
    this.setupMenuEvents();
    this.setupGameOverEvents();
    this.setupVictoryEvents();
    this.setupLeaderboardEvents();
  }

  setupGameEvents() {
    // Listen for game events
    document.addEventListener('gameOver', (event) => {
      this.showGameOverScreen(event.detail.score);
    });

    document.addEventListener('victory', (event) => {
      this.showVictoryScreen(event.detail.score);
    });
  }

  setupMenuEvents() {
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    difficultyButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        difficultyButtons.forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
        this.selectedDifficulty = e.target.dataset.difficulty;
        document.getElementById('start-btn').disabled = false;
        console.log('Difficulty selected:', this.selectedDifficulty);
      });
    });

    document.getElementById('start-btn').addEventListener('click', () => {
      if (this.selectedDifficulty) {
        this.startGame(this.selectedDifficulty);
      }
    });

    const showLeaderboardBtn = document.getElementById('show-leaderboard-btn');
    if (showLeaderboardBtn) {
      showLeaderboardBtn.addEventListener('click', () => {
        this.showLeaderboard();
      });
    }
  }

  setupGameOverEvents() {
    // FIXED: Game over screen should NOT have score submission
    // Only restart button
    
    // Hide all score submission elements
    const nameInputSection = document.getElementById('name-input-section');
    const playerNameInput = document.getElementById('player-name');
    const submitScoreBtn = document.getElementById('submit-score-btn');
    const nameError = document.getElementById('name-error');
    
    if (nameInputSection) nameInputSection.style.display = 'none';
    if (playerNameInput) playerNameInput.style.display = 'none';
    if (submitScoreBtn) submitScoreBtn.style.display = 'none';
    if (nameError) nameError.style.display = 'none';
    
    document.getElementById('restart-btn-gameover').addEventListener('click', () => {
      this.restartGame();
    });
  }

  setupVictoryEvents() {
    const playerNameInput = document.getElementById('player-name-victory');
    const submitScoreBtn = document.getElementById('submit-score-btn-victory');
    const nameError = document.getElementById('name-error-victory');

    playerNameInput.addEventListener('input', () => {
      this.validateNameInput(playerNameInput, nameError);
    });

    submitScoreBtn.addEventListener('click', async () => {
      const playerName = playerNameInput.value.trim();
      
      try {
        const sanitizedName = sanitizeName(playerName);
        validateNameLength(sanitizedName);
        
        submitScoreBtn.disabled = true;
        submitScoreBtn.textContent = 'Submitting... / 送信中...';
        
        await this.submitScore(sanitizedName, this.gameManager.getCurrentScore(), this.gameManager.getDifficulty());
        
        nameError.textContent = 'Score submitted! / スコアが送信されました！';
        nameError.style.color = '#4caf50';
        
        this.showLeaderboardButton(nameError, this.gameManager.getDifficulty());
        
      } catch (error) {
        nameError.textContent = error.message;
        nameError.style.color = '#f5576c';
        submitScoreBtn.disabled = false;
        submitScoreBtn.textContent = 'Submit Score / スコア送信';
      }
    });

    document.getElementById('restart-btn-victory').addEventListener('click', () => {
      this.restartGame();
    });
  }

  setupLeaderboardEvents() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        const difficulty = e.target.dataset.difficulty;
        this.loadLeaderboard(difficulty);
      });
    });

    document.getElementById('refresh-leaderboard-btn').addEventListener('click', () => {
      const activeDifficulty = document.querySelector('.tab-btn.active').dataset.difficulty;
      this.loadLeaderboard(activeDifficulty);
    });

    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
      this.showScreen('menu');
    });
  }

  validateNameInput(inputElement, errorElement) {
    const name = inputElement.value.trim();
    
    try {
      if (name.length === 0) {
        errorElement.textContent = '';
        errorElement.style.color = '#f5576c';
        return false;
      }
      
      const sanitizedName = sanitizeName(name);
      validateNameLength(sanitizedName);
      
      errorElement.textContent = '';
      return true;
      
    } catch (error) {
      errorElement.textContent = error.message;
      errorElement.style.color = '#f5576c';
      return false;
    }
  }

  startGame(difficulty) {
    if (this.gameManager) {
      this.gameManager.destroy();
    }
    
    // Create real game manager with fixed logic
    this.gameManager = new RealGameManager(this.canvas, difficulty);
    
    this.showScreen('game');
    document.getElementById('difficulty-value').textContent = this.getDifficultyDisplayName(difficulty);
    
    // Start the fixed game
    this.gameManager.startGame();
    
    // Start timer display
    this.startTimerDisplay();
    
    console.log('🎮 FIXED Game started!');
    console.log('📋 Hold arrow key - character moves while pressed');
    console.log('🎯 Reach orange goal, avoid red walls');
  }

  startTimerDisplay() {
    const timerInterval = setInterval(() => {
      if (!this.gameManager || this.gameManager.getCurrentState() !== 'playing') {
        clearInterval(timerInterval);
        return;
      }
      
      const currentTime = this.gameManager.getCurrentScore();
      document.getElementById('timer-value').textContent = (currentTime / 1000).toFixed(2);
    }, 100);
  }

  restartGame() {
    // Clear input fields
    document.getElementById('player-name-victory').value = '';
    document.getElementById('name-error-victory').textContent = '';
    
    // Re-enable buttons
    document.getElementById('submit-score-btn-victory').disabled = false;
    document.getElementById('submit-score-btn-victory').textContent = 'Submit Score / スコア送信';
    
    this.showScreen('menu');
    
    if (this.gameManager) {
      this.gameManager.destroy();
      this.gameManager = null;
    }
  }

  showScreen(screenName) {
    Object.values(this.screens).forEach(screen => {
      screen.classList.remove('active');
    });
    
    if (this.screens[screenName]) {
      this.screens[screenName].classList.add('active');
    }
    
    console.log('Screen changed to:', screenName);
  }

  showGameOverScreen(finalTime) {
    document.getElementById('gameover-time').textContent = (finalTime / 1000).toFixed(2);
    
    // FIXED: COMPLETELY hide score submission for game over
    const nameInputSection = document.getElementById('name-input-section');
    const playerNameInput = document.getElementById('player-name');
    const submitScoreBtn = document.getElementById('submit-score-btn');
    const nameError = document.getElementById('name-error');
    
    if (nameInputSection) {
      nameInputSection.style.display = 'none';
      nameInputSection.style.visibility = 'hidden';
    }
    if (playerNameInput) playerNameInput.style.display = 'none';
    if (submitScoreBtn) submitScoreBtn.style.display = 'none';
    if (nameError) nameError.style.display = 'none';
    
    console.log('💥 Game Over screen - NO score submission available');
    this.showScreen('gameover');
  }

  showVictoryScreen(finalTime) {
    document.getElementById('victory-time').textContent = (finalTime / 1000).toFixed(2);
    
    // Show score submission section only for victory
    const nameInputSection = document.getElementById('name-input-section-victory');
    if (nameInputSection) {
      nameInputSection.style.display = 'block';
      nameInputSection.style.visibility = 'visible';
    }
    
    console.log('🎉 Victory screen - Score submission available');
    this.showScreen('victory');
  }

  async submitScore(playerName, score, difficulty) {
    try {
      await this.apiClient.submitScore(playerName, score, difficulty);
    } catch (error) {
      throw new Error('Failed to submit score / スコアの送信に失敗しました');
    }
  }

  async showLeaderboard(difficulty = 'easy') {
    this.showScreen('leaderboard');
    
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.difficulty === difficulty) {
        btn.classList.add('active');
      }
    });
    
    this.loadLeaderboard(difficulty);
  }

  async loadLeaderboard(difficulty) {
    try {
      const leaderboard = await this.apiClient.getLeaderboard(difficulty, 10);
      this.displayLeaderboard(leaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      this.displayLeaderboard([]);
    }
  }

  displayLeaderboard(leaderboard) {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    
    if (leaderboard.length === 0) {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 4;
      cell.textContent = 'No data available / データがありません';
      cell.style.textAlign = 'center';
      return;
    }
    
    leaderboard.forEach((entry, index) => {
      const row = tbody.insertRow();
      
      const rankCell = row.insertCell();
      rankCell.textContent = index + 1;
      
      const nameCell = row.insertCell();
      nameCell.textContent = entry.playerName;
      
      const scoreCell = row.insertCell();
      scoreCell.textContent = `${(entry.score / 1000).toFixed(2)}s`;
      
      const dateCell = row.insertCell();
      const date = new Date(entry.timestamp);
      dateCell.textContent = date.toLocaleDateString('ja-JP');
    });
  }

  getDifficultyDisplayName(difficulty) {
    const names = {
      'easy': 'Easy / イージー',
      'medium': 'Medium / ミディアム',
      'hard': 'Hard / ハード',
      'super-hard': 'Super Hard / スーパーハード'
    };
    return names[difficulty] || difficulty;
  }

  showLeaderboardButton(container, difficulty) {
    const existingBtn = container.querySelector('.view-leaderboard-btn');
    if (existingBtn) {
      existingBtn.remove();
    }
    
    const leaderboardBtn = document.createElement('button');
    leaderboardBtn.className = 'view-leaderboard-btn';
    leaderboardBtn.textContent = 'View Leaderboard / リーダーボードを見る';
    leaderboardBtn.style.marginTop = '10px';
    leaderboardBtn.style.padding = '8px 16px';
    leaderboardBtn.style.backgroundColor = '#4caf50';
    leaderboardBtn.style.color = 'white';
    leaderboardBtn.style.border = 'none';
    leaderboardBtn.style.borderRadius = '4px';
    leaderboardBtn.style.cursor = 'pointer';
    
    leaderboardBtn.addEventListener('click', () => {
      this.showLeaderboard(difficulty);
    });
    
    container.appendChild(leaderboardBtn);
  }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Wire Game FINAL VERSION loaded!');
  console.log('✅ ALL ISSUES FIXED:');
  console.log('  - Controls: Hold arrow key = movement while pressed');
  console.log('  - Game Over: NO score submission');
  console.log('  - Victory: Score submission available');
  console.log('  - Walls: Only boundaries, no obstacles');
  console.log('  - Difficulty: Original specification');
  
  const uiManager = new UIManager();
  window.uiManager = uiManager;
  
  console.log('🚀 Game ready! Select difficulty and start playing!');
});