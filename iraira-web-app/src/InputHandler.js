/**
 * InputHandler class - Handles keyboard input and manages game controls
 * キーボード入力を処理し、ゲームコントロールを管理する
 */
class InputHandler {
  /**
   * Constructor - Initialize input handler with game manager reference
   * @param {Object} gameManager - Reference to the game manager
   */
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.enabled = false;
    this.currentDirection = null;
    
    // Bind event handlers to maintain 'this' context
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  /**
   * Enable input handling - Add event listeners
   * 入力処理を有効化 - イベントリスナーを追加
   */
  enable() {
    if (!this.enabled) {
      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('keyup', this.handleKeyUp);
      this.enabled = true;
    }
  }

  /**
   * Disable input handling - Remove event listeners
   * 入力処理を無効化 - イベントリスナーを削除
   */
  disable() {
    if (this.enabled) {
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('keyup', this.handleKeyUp);
      this.enabled = false;
    }
  }

  /**
   * Handle keydown events - Process arrow key inputs
   * キーダウンイベントを処理 - 矢印キー入力を処理
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyDown(event) {
    // Check if input should be gated based on game state
    if (!this.shouldAcceptInput()) {
      return;
    }

    const direction = this.mapKeyToDirection(event.key);
    if (direction) {
      event.preventDefault(); // Prevent default browser behavior
      this.setDirection(direction);
    }
  }

  /**
   * Handle keyup events - Currently not used but available for future features
   * キーアップイベントを処理 - 現在は未使用だが将来の機能のために利用可能
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyUp(event) {
    // Currently not used as the game uses continuous movement
    // 現在は未使用（ゲームは連続移動を使用するため）
  }

  /**
   * Map keyboard keys to movement directions
   * キーボードキーを移動方向にマッピング
   * @param {string} key - The pressed key
   * @returns {string|null} Direction string or null if not an arrow key
   */
  mapKeyToDirection(key) {
    const keyMap = {
      'ArrowUp': 'up',
      'ArrowDown': 'down',
      'ArrowLeft': 'left',
      'ArrowRight': 'right'
    };
    
    return keyMap[key] || null;
  }

  /**
   * Set the current direction and notify the game manager
   * 現在の方向を設定し、ゲームマネージャーに通知
   * @param {string} direction - The new direction ('up', 'down', 'left', 'right')
   */
  setDirection(direction) {
    this.currentDirection = direction;
    
    // Notify game manager of direction change
    if (this.gameManager && this.gameManager.character) {
      this.gameManager.character.setDirection(direction);
    }
  }

  /**
   * Get the current direction
   * 現在の方向を取得
   * @returns {string|null} Current direction or null
   */
  getCurrentDirection() {
    return this.currentDirection;
  }

  /**
   * Check if input should be accepted based on game state
   * ゲーム状態に基づいて入力を受け入れるべきかチェック
   * @returns {boolean} True if input should be accepted
   */
  shouldAcceptInput() {
    // Only accept input when game is in 'playing' state
    // ゲームが'playing'状態の時のみ入力を受け入れる
    if (!this.gameManager) {
      return false;
    }

    const gameState = this.gameManager.getCurrentState ? 
      this.gameManager.getCurrentState() : 
      this.gameManager.state;

    // Accept input only during 'playing' state
    // 'playing'状態の時のみ入力を受け入れる
    return gameState === 'playing';
  }

  /**
   * Reset input handler state
   * 入力ハンドラーの状態をリセット
   */
  reset() {
    this.currentDirection = null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputHandler;
}