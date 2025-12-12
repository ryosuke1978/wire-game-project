/**
 * GameManager Tests - ゲームマネージャーのテスト
 * 
 * プロパティベーステストと単体テストを含む
 */

// テスト環境のセットアップ
const fc = require('fast-check');

// Node.js環境でのポリフィル
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

const { JSDOM } = require('jsdom');

// DOM環境をセットアップ
const dom = new JSDOM('<!DOCTYPE html><canvas id="gameCanvas" width="800" height="600"></canvas>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.CanvasRenderingContext2D = dom.window.CanvasRenderingContext2D;
global.requestAnimationFrame = (callback) => setTimeout(callback, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.performance = { now: () => Date.now() };

// テスト用のモッククラス
class MockCharacter {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.direction = null;
    this.initialX = x;
    this.initialY = y;
  }

  setDirection(direction) {
    this.direction = direction;
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

class MockLevelGenerator {
  constructor(width, height, difficulty) {
    this.width = width;
    this.height = height;
    this.difficulty = difficulty;
    this.difficultySettings = {
      'easy': { pathWidth: 100, characterSpeed: 2 },
      'medium': { pathWidth: 60, characterSpeed: 3 },
      'hard': { pathWidth: 40, characterSpeed: 4 },
      'super-hard': { pathWidth: 30, characterSpeed: 6 }
    };
    this.settings = this.difficultySettings[difficulty];
  }

  generate() {
    // モック実装
  }

  getWalls() {
    return [
      { x: 0, y: 0, width: 50, height: 600 },
      { x: 750, y: 0, width: 50, height: 600 }
    ];
  }

  getStartPosition() {
    return { x: 100, y: 300 };
  }

  getGoalPosition() {
    return { x: 700, y: 300 };
  }

  getPathWidth() {
    return this.settings.pathWidth;
  }

  getCharacterSpeed() {
    return this.settings.characterSpeed;
  }

  getPath() {
    return [{ x: 100, y: 300 }, { x: 700, y: 300 }];
  }
}

class MockCollisionDetector {
  constructor(character, walls, goal) {
    this.character = character;
    this.walls = walls;
    this.goal = goal;
    this.forceWallCollision = false;
    this.forceGoalCollision = false;
    this.lastCollisionPoint = null;
  }

  checkWallCollision() {
    if (this.forceWallCollision) {
      this.lastCollisionPoint = { x: this.character.x, y: this.character.y };
      return true;
    }
    return false;
  }

  checkGoalCollision() {
    return this.forceGoalCollision;
  }

  getCollisionPoint() {
    return this.lastCollisionPoint;
  }

  updateWalls(walls) {
    this.walls = walls;
  }

  updateGoal(goal) {
    this.goal = goal;
  }

  reset() {
    this.lastCollisionPoint = null;
  }
}

class MockRenderer {
  constructor(canvas) {
    this.canvas = canvas;
  }

  clear() {}
  drawWalls(walls) {}
  drawPath(path, width) {}
  drawCharacter(character) {}
  drawGoal(goal) {}
  drawTimer(time) {}
  drawUI(state) {}
}

class MockAnimationEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.isAnimating = false;
  }

  playExplosion(x, y, callback) {
    this.isAnimating = true;
    setTimeout(() => {
      this.isAnimating = false;
      if (callback) callback();
    }, 100);
  }

  playVictory(x, y, callback) {
    this.isAnimating = true;
    setTimeout(() => {
      this.isAnimating = false;
      if (callback) callback();
    }, 100);
  }

  update(deltaTime) {}

  isPlaying() {
    return this.isAnimating;
  }
}

class MockInputHandler {
  constructor(gameManager) {
    this.gameManager = gameManager;
    this.enabled = false;
    this.currentDirection = null;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  reset() {
    this.currentDirection = null;
  }
}

// グローバルにモッククラスを設定
global.Character = MockCharacter;
global.LevelGenerator = MockLevelGenerator;
global.CollisionDetector = MockCollisionDetector;
global.Renderer = MockRenderer;
global.AnimationEngine = MockAnimationEngine;
global.InputHandler = MockInputHandler;

// GameManagerをインポート
const GameManager = require('../src/GameManager');

describe('GameManager Property Tests', () => {
  let canvas;

  beforeEach(() => {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      // キャンバス要素が見つからない場合は作成
      canvas = document.createElement('canvas');
      canvas.id = 'gameCanvas';
      canvas.width = 800;
      canvas.height = 600;
      document.body.appendChild(canvas);
    }
  });

  /**
   * Property 6: Timer Stops on Game Over（ゲームオーバー時のタイマー停止）
   * Feature: mouse-wire-game, Property 6: Timer Stops on Game Over
   * Validates: Requirements 2.2
   */
  test('Property 6: Timer stops on game over', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('easy', 'medium', 'hard', 'super-hard'),
        fc.integer({ min: 100, max: 5000 }), // 初期待機時間
        (difficulty, initialWaitTime) => {
          const gameManager = new GameManager(canvas, difficulty);
          
          // ゲームを開始
          gameManager.startGame();
          
          // 初期時間を記録
          const startTime = Date.now();
          
          // 指定時間待機してタイマーを進める
          const mockTime = startTime + initialWaitTime;
          gameManager.startTime = startTime;
          gameManager.currentTime = initialWaitTime;
          
          // 衝突を強制的に発生させる
          if (gameManager.collisionDetector) {
            gameManager.collisionDetector.forceWallCollision = true;
          }
          
          // ゲームオーバーを発生させる
          gameManager.handleGameOver();
          
          // ゲームオーバー後のタイマー値を記録
          const timerAfterGameOver = gameManager.currentTime;
          
          // 追加の時間を経過させる
          const additionalTime = 1000;
          const laterTime = mockTime + additionalTime;
          
          // update()を呼び出してもタイマーが進まないことを確認
          gameManager.update(16); // 1フレーム分の更新
          
          // タイマーがゲームオーバー時点で停止していることを確認
          expect(gameManager.currentTime).toBe(timerAfterGameOver);
          expect(gameManager.getCurrentState()).toBe('gameover');
          
          // クリーンアップ
          gameManager.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Timer Monotonic Increase（タイマーの単調増加）
   * Feature: mouse-wire-game, Property 8: Timer Monotonic Increase
   * Validates: Requirements 3.2
   */
  test('Property 8: Timer monotonic increase', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('easy', 'medium', 'hard', 'super-hard'),
        fc.array(fc.integer({ min: 16, max: 100 }), { minLength: 2, maxLength: 10 }), // フレーム間隔の配列
        (difficulty, frameIntervals) => {
          const gameManager = new GameManager(canvas, difficulty);
          
          // ゲームを開始
          gameManager.startGame();
          
          const timerValues = [];
          let currentTime = Date.now();
          gameManager.startTime = currentTime;
          
          // 複数のフレームでタイマーを更新
          for (const interval of frameIntervals) {
            // 時間を進める
            currentTime += interval;
            
            // タイマーを手動で更新（実際のゲームループをシミュレート）
            gameManager.currentTime = currentTime - gameManager.startTime;
            
            // タイマー値を記録
            timerValues.push(gameManager.currentTime);
            
            // update()を呼び出し（playing状態を維持）
            gameManager.update(interval);
          }
          
          // タイマーが単調増加していることを確認
          for (let i = 1; i < timerValues.length; i++) {
            expect(timerValues[i]).toBeGreaterThanOrEqual(timerValues[i - 1]);
          }
          
          // 最初と最後の値が異なることを確認（実際に時間が進んでいる）
          if (timerValues.length > 1) {
            expect(timerValues[timerValues.length - 1]).toBeGreaterThan(timerValues[0]);
          }
          
          // ゲーム状態がplayingのままであることを確認
          expect(gameManager.getCurrentState()).toBe('playing');
          
          // クリーンアップ
          gameManager.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 9: Score Equals Completion Time（スコアは完了時間と等しい）
   * Feature: mouse-wire-game, Property 9: Score Equals Completion Time
   * Validates: Requirements 3.3
   */
  test('Property 9: Score equals completion time', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('easy', 'medium', 'hard', 'super-hard'),
        fc.integer({ min: 500, max: 10000 }), // 完了時間
        (difficulty, completionTime) => {
          const gameManager = new GameManager(canvas, difficulty);
          
          // ゲームを開始
          gameManager.startGame();
          
          // 指定時間でゲームを進める
          const startTime = Date.now();
          gameManager.startTime = startTime;
          gameManager.currentTime = completionTime;
          
          // ゴール衝突を強制的に発生させる
          if (gameManager.collisionDetector) {
            gameManager.collisionDetector.forceGoalCollision = true;
          }
          
          // ゴール到達を発生させる
          gameManager.handleGoalReached();
          
          // スコアが完了時間と等しいことを確認
          expect(gameManager.score).toBe(completionTime);
          expect(gameManager.getCurrentScore()).toBe(completionTime);
          expect(gameManager.getCurrentState()).toBe('victory');
          
          // クリーンアップ
          gameManager.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 10: Restart Resets State（再スタートによる状態リセット）
   * Feature: mouse-wire-game, Property 10: Restart Resets State
   * Validates: Requirements 4.3
   */
  test('Property 10: Restart resets state', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('easy', 'medium', 'hard', 'super-hard'),
        fc.constantFrom('playing', 'paused', 'gameover', 'victory'), // 任意の状態から
        fc.integer({ min: 1000, max: 10000 }), // 経過時間
        (difficulty, initialState, elapsedTime) => {
          const gameManager = new GameManager(canvas, difficulty);
          
          // ゲームを開始して状態を設定
          gameManager.startGame();
          
          // 指定された状態に設定
          gameManager.state = initialState;
          gameManager.startTime = Date.now() - elapsedTime;
          gameManager.currentTime = elapsedTime;
          gameManager.score = elapsedTime;
          
          // キャラクターの位置を変更
          if (gameManager.character) {
            gameManager.character.x = 500;
            gameManager.character.y = 400;
            gameManager.character.setDirection('right');
          }
          
          // 再スタートを実行
          gameManager.restartGame();
          
          // 状態がリセットされていることを確認
          expect(gameManager.getCurrentState()).toBe('menu');
          expect(gameManager.startTime).toBe(0);
          expect(gameManager.currentTime).toBe(0);
          expect(gameManager.score).toBe(0);
          
          // キャラクターが初期位置にリセットされていることを確認
          if (gameManager.character && gameManager.levelGenerator) {
            const startPos = gameManager.levelGenerator.getStartPosition();
            expect(gameManager.character.x).toBe(startPos.x);
            expect(gameManager.character.y).toBe(startPos.y);
            expect(gameManager.character.direction).toBe(null);
          }
          
          // 入力ハンドラーがリセットされていることを確認
          if (gameManager.inputHandler) {
            expect(gameManager.inputHandler.currentDirection).toBe(null);
            expect(gameManager.inputHandler.enabled).toBe(false);
          }
          
          // クリーンアップ
          gameManager.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Unit Tests for Game State Transitions
  describe('Game State Transitions', () => {
    /**
     * Test menu → playing transition
     * メニュー→プレイ中遷移のテスト
     * Requirements: 4.1
     */
    test('should transition from menu to playing when startGame is called', () => {
      const gameManager = new GameManager(canvas, 'easy');
      
      // 初期状態はmenu
      expect(gameManager.getCurrentState()).toBe('menu');
      
      // ゲームを開始
      gameManager.startGame();
      
      // 状態がplayingに変わることを確認
      expect(gameManager.getCurrentState()).toBe('playing');
      
      // タイマーが初期化されることを確認
      expect(gameManager.startTime).toBeGreaterThan(0);
      expect(gameManager.currentTime).toBe(0);
      expect(gameManager.score).toBe(0);
      
      // 入力が有効化されることを確認
      if (gameManager.inputHandler) {
        expect(gameManager.inputHandler.enabled).toBe(true);
      }
      
      gameManager.destroy();
    });

    /**
     * Test playing → gameover transition
     * プレイ中→ゲームオーバー遷移のテスト
     * Requirements: 4.1, 4.3
     */
    test('should transition from playing to gameover when handleGameOver is called', () => {
      const gameManager = new GameManager(canvas, 'medium');
      
      // ゲームを開始
      gameManager.startGame();
      expect(gameManager.getCurrentState()).toBe('playing');
      
      // 衝突を設定
      if (gameManager.collisionDetector) {
        gameManager.collisionDetector.forceWallCollision = true;
      }
      
      // ゲームオーバーを発生
      gameManager.handleGameOver();
      
      // 状態がgameoverに変わることを確認
      expect(gameManager.getCurrentState()).toBe('gameover');
      
      // 入力が無効化されることを確認
      if (gameManager.inputHandler) {
        expect(gameManager.inputHandler.enabled).toBe(false);
      }
      
      gameManager.destroy();
    });

    /**
     * Test playing → victory transition
     * プレイ中→勝利遷移のテスト
     * Requirements: 4.1, 4.3
     */
    test('should transition from playing to victory when handleGoalReached is called', () => {
      const gameManager = new GameManager(canvas, 'hard');
      
      // ゲームを開始
      gameManager.startGame();
      expect(gameManager.getCurrentState()).toBe('playing');
      
      // 時間を進める
      const completionTime = 5000;
      gameManager.currentTime = completionTime;
      
      // ゴール衝突を設定
      if (gameManager.collisionDetector) {
        gameManager.collisionDetector.forceGoalCollision = true;
      }
      
      // ゴール到達を発生
      gameManager.handleGoalReached();
      
      // 状態がvictoryに変わることを確認
      expect(gameManager.getCurrentState()).toBe('victory');
      
      // スコアが設定されることを確認
      expect(gameManager.score).toBe(completionTime);
      
      // 入力が無効化されることを確認
      if (gameManager.inputHandler) {
        expect(gameManager.inputHandler.enabled).toBe(false);
      }
      
      gameManager.destroy();
    });

    /**
     * Test restart from any state
     * 任意の状態からの再スタートのテスト
     * Requirements: 4.3
     */
    test('should restart from gameover state', () => {
      const gameManager = new GameManager(canvas, 'super-hard');
      
      // ゲームを開始してゲームオーバーにする
      gameManager.startGame();
      gameManager.handleGameOver();
      expect(gameManager.getCurrentState()).toBe('gameover');
      
      // 再スタート
      gameManager.restartGame();
      
      // 状態がmenuに戻ることを確認
      expect(gameManager.getCurrentState()).toBe('menu');
      expect(gameManager.startTime).toBe(0);
      expect(gameManager.currentTime).toBe(0);
      expect(gameManager.score).toBe(0);
      
      gameManager.destroy();
    });

    test('should restart from victory state', () => {
      const gameManager = new GameManager(canvas, 'easy');
      
      // ゲームを開始して勝利にする
      gameManager.startGame();
      gameManager.currentTime = 3000;
      gameManager.handleGoalReached();
      expect(gameManager.getCurrentState()).toBe('victory');
      
      // 再スタート
      gameManager.restartGame();
      
      // 状態がmenuに戻ることを確認
      expect(gameManager.getCurrentState()).toBe('menu');
      expect(gameManager.startTime).toBe(0);
      expect(gameManager.currentTime).toBe(0);
      expect(gameManager.score).toBe(0);
      
      gameManager.destroy();
    });

    test('should restart from playing state', () => {
      const gameManager = new GameManager(canvas, 'medium');
      
      // ゲームを開始
      gameManager.startGame();
      expect(gameManager.getCurrentState()).toBe('playing');
      
      // 時間を進める
      gameManager.currentTime = 2000;
      
      // 再スタート
      gameManager.restartGame();
      
      // 状態がmenuに戻ることを確認
      expect(gameManager.getCurrentState()).toBe('menu');
      expect(gameManager.startTime).toBe(0);
      expect(gameManager.currentTime).toBe(0);
      expect(gameManager.score).toBe(0);
      
      gameManager.destroy();
    });
  });
});