/**
 * Character class - Represents the player-controlled character in the game
 * プレイヤーが操作するゲーム内のキャラクター
 */
class Character {
  /**
   * Constructor - Initialize character with position and size
   * @param {number} x - Initial x position
   * @param {number} y - Initial y position
   * @param {number} size - Character size (width and height)
   */
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.direction = null; // 'up', 'down', 'left', 'right', or null
    this.initialX = x;
    this.initialY = y;
  }

  /**
   * Set the movement direction
   * @param {string} direction - Direction to move ('up', 'down', 'left', 'right')
   */
  setDirection(direction) {
    const validDirections = ['up', 'down', 'left', 'right'];
    if (validDirections.includes(direction)) {
      this.direction = direction;
    }
  }

  /**
   * Update character position based on current direction and speed
   * @param {number} speed - Movement speed in pixels per frame
   */
  update(speed) {
    if (!this.direction) {
      return;
    }

    switch (this.direction) {
      case 'up':
        this.y -= speed;
        break;
      case 'down':
        this.y += speed;
        break;
      case 'left':
        this.x -= speed;
        break;
      case 'right':
        this.x += speed;
        break;
    }
  }

  /**
   * Get current position
   * @returns {{x: number, y: number}} Current position
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Get bounding box for collision detection
   * @returns {{x: number, y: number, width: number, height: number}} Bounding box
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.size,
      height: this.size
    };
  }

  /**
   * Reset character to initial or specified position
   * @param {number} x - X position to reset to (optional, uses initial if not provided)
   * @param {number} y - Y position to reset to (optional, uses initial if not provided)
   */
  reset(x, y) {
    if (x !== undefined && y !== undefined) {
      this.x = x;
      this.y = y;
      this.initialX = x;
      this.initialY = y;
    } else {
      this.x = this.initialX;
      this.y = this.initialY;
    }
    this.direction = null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Character;
}
