/**
 * CollisionDetector class - Detects collisions between character and walls/goal
 * キャラクターと壁/ゴールとの衝突を検知する
 */
class CollisionDetector {
  /**
   * Constructor - Initialize collision detector with character, walls, and goal
   * @param {Character} character - The character object to check collisions for
   * @param {Array} walls - Array of wall objects with x, y, width, height properties
   * @param {{x: number, y: number}} goal - Goal position object
   */
  constructor(character, walls, goal) {
    this.character = character;
    this.walls = walls;
    this.goal = goal;
    this.goalSize = 30; // Goal collision area size
    this.lastCollisionPoint = null;
  }

  /**
   * Check if character collides with any wall using bounding box collision detection
   * バウンディングボックス衝突検知を使用してキャラクターが壁と衝突するかチェック
   * @returns {boolean} True if collision detected, false otherwise
   */
  checkWallCollision() {
    const characterBounds = this.character.getBounds();
    
    for (let i = 0; i < this.walls.length; i++) {
      const wall = this.walls[i];
      
      if (this.boundingBoxCollision(characterBounds, wall)) {
        // Store collision point for animation purposes
        this.lastCollisionPoint = {
          x: characterBounds.x + characterBounds.width / 2,
          y: characterBounds.y + characterBounds.height / 2
        };
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if character collides with the goal
   * キャラクターがゴールと衝突するかチェック
   * @returns {boolean} True if collision detected, false otherwise
   */
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

  /**
   * Get the last collision point (for animation purposes)
   * 最後の衝突地点を取得（アニメーション用）
   * @returns {{x: number, y: number}|null} Collision point or null if no collision
   */
  getCollisionPoint() {
    return this.lastCollisionPoint;
  }

  /**
   * Bounding box collision detection algorithm
   * バウンディングボックス衝突検知アルゴリズム
   * @param {{x: number, y: number, width: number, height: number}} rect1 - First rectangle
   * @param {{x: number, y: number, width: number, height: number}} rect2 - Second rectangle
   * @returns {boolean} True if rectangles overlap, false otherwise
   */
  boundingBoxCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  /**
   * Update the walls array (useful when level changes)
   * 壁の配列を更新（レベル変更時に有用）
   * @param {Array} walls - New walls array
   */
  updateWalls(walls) {
    this.walls = walls;
  }

  /**
   * Update the goal position (useful when level changes)
   * ゴール位置を更新（レベル変更時に有用）
   * @param {{x: number, y: number}} goal - New goal position
   */
  updateGoal(goal) {
    this.goal = goal;
  }

  /**
   * Reset collision state
   * 衝突状態をリセット
   */
  reset() {
    this.lastCollisionPoint = null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CollisionDetector;
}