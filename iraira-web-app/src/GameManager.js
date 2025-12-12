/**
 * GameManager class - ゲーム全体の状態管理とゲームループを制御する中核コンポーネント
 * 
 * 要件:
 * - 1.1, 1.2, 1.4, 1.5: キャラクター操作と入力制御
 * - 2.1, 2.2: 衝突検知とゲームオーバー処理
 * - 3.1, 3.2, 3.3: タイマー管理とスコア記録
 * - 4.1, 4.3: ゲーム開始と再スタート機能
 */
class GameManager {
  /**
   * Constructor - 全コンポーネントを初期化
   * @param {HTMLCanvasElement} canvas - ゲーム用キャンバス要素
   * @param {string} difficulty - 難易度レベル ('easy', 'medium', 'hard', 'super-hard')
   */
  constructor(canvas, difficulty = 'easy') {
    if (!canvas) {
      throw new Error('Canvas element is required');
    }

    this.canvas = canvas;
    this.difficulty = difficulty;
    
    // ゲーム状態機械 (menu, playing, paused, gameover, victory)
    this.state = 'menu';
    
    // タイマー管理
    this.startTime = 0;
    this.currentTime = 0;
    this.score = 0;
    
    // ゲームループ制御
    this.gameLoopId = null;
    this.lastFrameTime = 0;
    
    // コンポーネントの初期化
    this._initializeComponents();
    
    // ゲームループのバインド
    this.gameLoop = this.gameLoop.bind(this);
  }

  /**
   * 全コンポーネントを初期化
   * @private
   */
  _initializeComponents() {
    // 動的インポートを使用してコンポーネントを読み込み
    if (typeof Character !== 'undefined') {
      // ブラウザ環境
      this._initializeBrowserComponents();
    } else {
      // Node.js環境（テスト用）
      this._initializeTestComponents();
    }
  }

  /**
   * ブラウザ環境でのコンポーネント初期化
   * @private
   */
  _initializeBrowserComponents() {
    // レベルジェネレーターを初期化
    this.levelGenerator = new LevelGenerator(
      this.canvas.width, 
      this.canvas.height, 
      this.difficulty
    );
    this.levelGenerator.generate();

    // キャラクターを初期化
    const startPos = this.levelGenerator.getStartPosition();
    this.character = new Character(startPos.x, startPos.y, 10);

    // 衝突検知器を初期化
    this.collisionDetector = new CollisionDetector(
      this.character,
      this.levelGenerator.getWalls(),
      this.levelGenerator.getGoalPosition()
    );

    // レンダラーを初期化
    this.renderer = new Renderer(this.canvas);

    // アニメーションエンジンを初期化
    this.animationEngine = new AnimationEngine(this.canvas);

    // 入力ハンドラーを初期化
    this.inputHandler = new InputHandler(this);
  }

  /**
   * テスト環境でのコンポーネント初期化
   * @private
   */
  _initializeTestComponents() {
    // テスト環境では最小限の初期化
    this.character = null;
    this.levelGenerator = null;
    this.collisionDetector = null;
    this.renderer = null;
    this.animationEngine = null;
    this.inputHandler = null;
  }

  /**
   * ゲームを開始
   * 要件 4.1: プレイヤーがスタートボタンをクリックしたとき、タイマーをゼロにして新しいゲームセッションを初期化
   */
  startGame() {
    // ゲーム状態をプレイ中に変更
    this.state = 'playing';
    
    // タイマーを初期化（要件 3.1: ゲーム開始時にタイマーをゼロ秒で初期化）
    this.startTime = Date.now();
    this.currentTime = 0;
    this.score = 0;
    
    // キャラクターを開始位置にリセット
    if (this.character && this.levelGenerator) {
      const startPos = this.levelGenerator.getStartPosition();
      this.character.reset(startPos.x, startPos.y);
    }
    
    // 入力を有効化
    if (this.inputHandler) {
      this.inputHandler.enable();
    }
    
    // ゲームループを開始
    this._startGameLoop();
  }

  /**
   * ゲームを一時停止
   */
  pauseGame() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this._stopGameLoop();
      
      // 入力を無効化
      if (this.inputHandler) {
        this.inputHandler.disable();
      }
    }
  }

  /**
   * ゲームを再開
   */
  resumeGame() {
    if (this.state === 'paused') {
      this.state = 'playing';
      
      // タイマーの開始時間を調整（一時停止時間を考慮）
      const pausedTime = Date.now() - this.startTime - this.currentTime;
      this.startTime += pausedTime;
      
      // 入力を有効化
      if (this.inputHandler) {
        this.inputHandler.enable();
      }
      
      // ゲームループを再開
      this._startGameLoop();
    }
  }

  /**
   * ゲームを再スタート
   * 要件 4.3: プレイヤーが再スタートボタンをクリックしたとき、すべてのゲーム状態をリセット
   */
  restartGame() {
    // ゲームループを停止
    this._stopGameLoop();
    
    // 入力を無効化
    if (this.inputHandler) {
      this.inputHandler.disable();
    }
    
    // アニメーションを停止
    if (this.animationEngine) {
      this.animationEngine.isAnimating = false;
    }
    
    // 新しいレベルを生成
    if (this.levelGenerator) {
      this.levelGenerator.generate();
      
      // キャラクターを開始位置にリセット
      if (this.character) {
        const startPos = this.levelGenerator.getStartPosition();
        this.character.reset(startPos.x, startPos.y);
      }
      
      // 衝突検知器を更新
      if (this.collisionDetector) {
        this.collisionDetector.updateWalls(this.levelGenerator.getWalls());
        this.collisionDetector.updateGoal(this.levelGenerator.getGoalPosition());
        this.collisionDetector.reset();
      }
    }
    
    // 入力ハンドラーをリセット
    if (this.inputHandler) {
      this.inputHandler.reset();
    }
    
    // ゲーム状態をメニューに戻す
    this.state = 'menu';
    
    // タイマーとスコアをリセット
    this.startTime = 0;
    this.currentTime = 0;
    this.score = 0;
  }

  /**
   * requestAnimationFrameを使ったゲームループ
   * @param {number} timestamp - フレームタイムスタンプ
   */
  gameLoop(timestamp) {
    if (this.state !== 'playing') {
      return;
    }

    // デルタタイムを計算
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // ゲーム状態を更新
    this.update(deltaTime);

    // 次のフレームをスケジュール
    this.gameLoopId = requestAnimationFrame(this.gameLoop);
  }

  /**
   * コンポーネント調整用update()メソッド
   * @param {number} deltaTime - 前フレームからの経過時間（ミリ秒）
   */
  update(deltaTime) {
    if (this.state !== 'playing') {
      return;
    }

    // タイマーを更新（要件 3.2: ゲーム進行中に100ミリ秒ごとにタイマーを更新）
    this.currentTime = Date.now() - this.startTime;

    // アニメーションが再生中の場合は入力を無視（要件 11.5）
    if (this.animationEngine && this.animationEngine.isPlaying()) {
      this.animationEngine.update(deltaTime);
      this._render();
      return;
    }

    // キャラクターを更新
    if (this.character && this.levelGenerator) {
      const speed = this.levelGenerator.getCharacterSpeed();
      this.character.update(speed);
    }

    // 衝突検知
    if (this.collisionDetector) {
      // 壁との衝突をチェック（要件 2.1）
      if (this.collisionDetector.checkWallCollision()) {
        this.handleGameOver();
        return;
      }

      // ゴールとの衝突をチェック
      if (this.collisionDetector.checkGoalCollision()) {
        this.handleGoalReached();
        return;
      }
    }

    // 画面を描画
    this._render();
  }

  /**
   * ゲームオーバー処理
   * 要件 2.1: 壁に触れたときに即座にゲームオーバー状態を起動
   * 要件 2.2: ゲームオーバー時にタイマーを停止し最終結果を表示
   */
  handleGameOver() {
    // ゲーム状態をゲームオーバーに変更
    this.state = 'gameover';
    
    // 入力を無効化
    if (this.inputHandler) {
      this.inputHandler.disable();
    }
    
    // 爆発アニメーションを再生（要件 11.1）
    if (this.animationEngine && this.collisionDetector) {
      const collisionPoint = this.collisionDetector.getCollisionPoint();
      if (collisionPoint) {
        this.animationEngine.playExplosion(
          collisionPoint.x, 
          collisionPoint.y, 
          () => {
            // アニメーション完了後にゲームオーバー画面を表示
            this._showGameOverScreen();
          }
        );
      } else {
        this._showGameOverScreen();
      }
    } else {
      this._showGameOverScreen();
    }
  }

  /**
   * ゴール到達処理
   * 要件 3.3: プレイヤーがゴールに到達したとき、完了時間を最終スコアとして記録
   */
  handleGoalReached() {
    // ゲーム状態を勝利に変更
    this.state = 'victory';
    
    // 最終スコアを記録（完了時間）
    this.score = this.currentTime;
    
    // 入力を無効化
    if (this.inputHandler) {
      this.inputHandler.disable();
    }
    
    // 勝利アニメーションを再生（要件 11.3）
    if (this.animationEngine && this.levelGenerator) {
      const goalPos = this.levelGenerator.getGoalPosition();
      this.animationEngine.playVictory(
        goalPos.x, 
        goalPos.y, 
        () => {
          // アニメーション完了後に勝利画面を表示
          this._showVictoryScreen();
        }
      );
    } else {
      this._showVictoryScreen();
    }
  }

  /**
   * 現在のゲーム状態を取得
   * @returns {string} 現在のゲーム状態
   */
  getCurrentState() {
    return this.state;
  }

  /**
   * 現在のスコア（経過時間）を取得
   * @returns {number} 現在のスコア（ミリ秒）
   */
  getCurrentScore() {
    return this.state === 'playing' ? this.currentTime : this.score;
  }

  /**
   * 現在の難易度を取得
   * @returns {string} 難易度レベル
   */
  getDifficulty() {
    return this.difficulty;
  }

  /**
   * ゲームループを開始
   * @private
   */
  _startGameLoop() {
    if (!this.gameLoopId) {
      this.lastFrameTime = performance.now();
      this.gameLoopId = requestAnimationFrame(this.gameLoop);
    }
  }

  /**
   * ゲームループを停止
   * @private
   */
  _stopGameLoop() {
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  /**
   * 画面を描画
   * @private
   */
  _render() {
    if (!this.renderer) {
      return;
    }

    // 画面をクリア
    this.renderer.clear();

    // レベル要素を描画
    if (this.levelGenerator) {
      this.renderer.drawPath(this.levelGenerator.getPath(), this.levelGenerator.getPathWidth());
      this.renderer.drawWalls(this.levelGenerator.getWalls());
      this.renderer.drawGoal(this.levelGenerator.getGoalPosition());
    }

    // キャラクターを描画
    if (this.character) {
      this.renderer.drawCharacter(this.character);
    }

    // タイマーを描画
    this.renderer.drawTimer(this.currentTime);

    // UI要素を描画
    this.renderer.drawUI({
      status: this.state,
      difficulty: this.difficulty,
      score: this.getCurrentScore()
    });
  }

  /**
   * ゲームオーバー画面を表示
   * @private
   */
  _showGameOverScreen() {
    // 最終描画
    this._render();
    
    // カスタムイベントを発火してUIManagerに通知
    const event = new CustomEvent('gameOver', {
      detail: {
        score: this.currentTime,
        difficulty: this.difficulty
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * 勝利画面を表示
   * @private
   */
  _showVictoryScreen() {
    // 最終描画
    this._render();
    
    // カスタムイベントを発火してUIManagerに通知
    const event = new CustomEvent('victory', {
      detail: {
        score: this.score,
        difficulty: this.difficulty
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * リソースをクリーンアップ
   */
  destroy() {
    // ゲームループを停止
    this._stopGameLoop();
    
    // 入力ハンドラーを無効化
    if (this.inputHandler) {
      this.inputHandler.disable();
    }
    
    // 他のリソースをクリーンアップ
    this.character = null;
    this.levelGenerator = null;
    this.collisionDetector = null;
    this.renderer = null;
    this.animationEngine = null;
    this.inputHandler = null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameManager;
}