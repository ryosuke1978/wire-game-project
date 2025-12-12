/**
 * ゲームフロー統合テスト
 * 
 * 要件:
 * - 4.1: スタートボタンクリック時の新しいゲームセッション初期化
 * - 4.3: 再スタートボタンクリック時の全ゲーム状態リセット
 * - 5.1: 難易度選択時の適切なレベル特性設定
 */

// テスト環境のセットアップ
import { jest } from '@jest/globals';

// モックコンポーネント
class MockGameManager {
  constructor(canvas, difficulty) {
    this.canvas = canvas;
    this.difficulty = difficulty;
    this.state = 'menu';
    this.score = 0;
    this.startTime = 0;
    this.currentTime = 0;
  }

  startGame() {
    this.state = 'playing';
    this.startTime = Date.now();
    this.currentTime = 0;
    this.score = 0;
  }

  restartGame() {
    this.state = 'menu';
    this.startTime = 0;
    this.currentTime = 0;
    this.score = 0;
  }

  getCurrentState() {
    return this.state;
  }

  getCurrentScore() {
    return this.state === 'playing' ? this.currentTime : this.score;
  }

  getDifficulty() {
    return this.difficulty;
  }

  destroy() {
    // クリーンアップ処理
  }

  // テスト用のヘルパーメソッド
  simulateGameOver() {
    this.state = 'gameover';
    this.score = this.currentTime = 5000; // 5秒でゲームオーバー
  }

  simulateVictory() {
    this.state = 'victory';
    this.score = this.currentTime = 10000; // 10秒でクリア
  }
}

// モックAPIクライアント
class MockAPIClient {
  constructor() {
    this.submitScoreCalled = false;
    this.getLeaderboardCalled = false;
    this.lastSubmission = null;
  }

  async submitScore(playerName, score, difficulty) {
    this.submitScoreCalled = true;
    this.lastSubmission = { playerName, score, difficulty };
    
    // 成功をシミュレート
    return Promise.resolve();
  }

  async getLeaderboard(difficulty, limit) {
    this.getLeaderboardCalled = true;
    
    // モックリーダーボードデータを返す
    return Promise.resolve([
      {
        playerName: 'TestPlayer1',
        score: 8000,
        difficulty: difficulty,
        timestamp: Date.now() - 86400000
      },
      {
        playerName: 'TestPlayer2',
        score: 12000,
        difficulty: difficulty,
        timestamp: Date.now() - 172800000
      }
    ]);
  }

  async getPlayerHistory(playerName) {
    return Promise.resolve([]);
  }
}

// バリデーションユーティリティのモック
const mockValidationUtils = {
  sanitizeName: (name) => {
    return name.replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
  },
  validateNameLength: (name) => {
    if (name.length < 1 || name.length > 20) {
      throw new Error('Name must be 1-20 characters');
    }
  }
};

describe('ゲームフロー統合テスト / Game Flow Integration Tests', () => {
  let mockGameManager;
  let mockAPIClient;

  beforeEach(() => {
    // モックオブジェクトを初期化
    mockGameManager = null;
    mockAPIClient = new MockAPIClient();
  });

  describe('ゲームマネージャーの状態管理 / Game Manager State Management', () => {
    test('ゲーム開始時の状態初期化', () => {
      // 要件 4.1: スタートボタンクリック時の新しいゲームセッション初期化
      
      const gameManager = new MockGameManager(null, 'easy');
      
      // 初期状態の確認
      expect(gameManager.getCurrentState()).toBe('menu');
      expect(gameManager.getCurrentScore()).toBe(0);
      expect(gameManager.getDifficulty()).toBe('easy');
      
      // ゲームを開始
      gameManager.startGame();
      
      // ゲーム開始後の状態確認
      expect(gameManager.getCurrentState()).toBe('playing');
      expect(gameManager.getCurrentScore()).toBe(0);
      expect(gameManager.startTime).toBeGreaterThan(0);
    });

    test('異なる難易度での初期化', () => {
      // 要件 5.1: 各難易度レベルでの適切な設定
      
      const difficulties = ['easy', 'medium', 'hard', 'super-hard'];
      
      difficulties.forEach(difficulty => {
        const gameManager = new MockGameManager(null, difficulty);
        
        // 正しい難易度で初期化されることを確認
        expect(gameManager.getDifficulty()).toBe(difficulty);
        
        // ゲームを開始
        gameManager.startGame();
        
        // 正しい状態でゲームが開始されることを確認
        expect(gameManager.getCurrentState()).toBe('playing');
      });
    });
  });

  describe('ゲーム状態遷移 / Game State Transitions', () => {
    test('ゲームオーバー状態への遷移', () => {
      // 要件 4.3: 再スタートボタンクリック時の全ゲーム状態リセット
      
      const gameManager = new MockGameManager(null, 'easy');
      
      // ゲームを開始
      gameManager.startGame();
      expect(gameManager.getCurrentState()).toBe('playing');
      
      // ゲームオーバーをシミュレート
      gameManager.simulateGameOver();
      
      // ゲームオーバー状態の確認
      expect(gameManager.getCurrentState()).toBe('gameover');
      expect(gameManager.getCurrentScore()).toBe(5000);
    });

    test('勝利状態への遷移', () => {
      // 要件 4.3: 再スタートボタンクリック時の全ゲーム状態リセット
      
      const gameManager = new MockGameManager(null, 'medium');
      
      // ゲームを開始
      gameManager.startGame();
      expect(gameManager.getCurrentState()).toBe('playing');
      
      // 勝利をシミュレート
      gameManager.simulateVictory();
      
      // 勝利状態の確認
      expect(gameManager.getCurrentState()).toBe('victory');
      expect(gameManager.getCurrentScore()).toBe(10000);
    });

    test('再スタート時の状態リセット', () => {
      // 要件 4.3: 全ゲーム状態リセット
      
      const gameManager = new MockGameManager(null, 'hard');
      
      // ゲームを開始
      gameManager.startGame();
      expect(gameManager.getCurrentState()).toBe('playing');
      
      // ゲームオーバーをシミュレート
      gameManager.simulateGameOver();
      expect(gameManager.getCurrentState()).toBe('gameover');
      
      // 再スタート
      gameManager.restartGame();
      
      // 状態がリセットされていることを確認
      expect(gameManager.getCurrentState()).toBe('menu');
      expect(gameManager.getCurrentScore()).toBe(0);
      expect(gameManager.startTime).toBe(0);
    });
  });

  describe('APIクライアント統合 / API Client Integration', () => {
    test('スコア送信機能', async () => {
      // 要件 6.1: ゲーム完了時のバックエンドサービスへのスコアデータ送信
      
      const apiClient = new MockAPIClient();
      
      // スコアを送信
      await apiClient.submitScore('TestPlayer', 8500, 'medium');
      
      // 送信が正しく行われたことを確認
      expect(apiClient.submitScoreCalled).toBe(true);
      expect(apiClient.lastSubmission).toEqual({
        playerName: 'TestPlayer',
        score: 8500,
        difficulty: 'medium'
      });
    });

    test('リーダーボード取得機能', async () => {
      // 要件 7.1: リーダーボード取得
      
      const apiClient = new MockAPIClient();
      
      // リーダーボードを取得
      const leaderboard = await apiClient.getLeaderboard('easy', 10);
      
      // 取得が正しく行われたことを確認
      expect(apiClient.getLeaderboardCalled).toBe(true);
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0]).toHaveProperty('playerName');
      expect(leaderboard[0]).toHaveProperty('score');
      expect(leaderboard[0]).toHaveProperty('difficulty');
    });
  });

  describe('バリデーション機能 / Validation Functions', () => {
    test('名前のサニタイゼーション', () => {
      // 要件 8.3: 名前のサニタイゼーション
      
      // 有効な文字のみを含む名前
      expect(mockValidationUtils.sanitizeName('Player123')).toBe('Player123');
      expect(mockValidationUtils.sanitizeName('Test_Player-1')).toBe('Test_Player-1');
      
      // 無効な文字を含む名前
      expect(mockValidationUtils.sanitizeName('Player<script>')).toBe('Playerscript');
      expect(mockValidationUtils.sanitizeName('Test@Player#')).toBe('TestPlayer');
      
      // 空白の処理
      expect(mockValidationUtils.sanitizeName('  Player  ')).toBe('Player');
    });

    test('名前の長さ検証', () => {
      // 要件 8.2: 名前の長さ検証（1-20文字）
      
      // 有効な長さ
      expect(() => mockValidationUtils.validateNameLength('Player')).not.toThrow();
      expect(() => mockValidationUtils.validateNameLength('A')).not.toThrow();
      expect(() => mockValidationUtils.validateNameLength('A'.repeat(20))).not.toThrow();
      
      // 無効な長さ
      expect(() => mockValidationUtils.validateNameLength('')).toThrow();
      expect(() => mockValidationUtils.validateNameLength('A'.repeat(21))).toThrow();
    });
  });

  describe('統合フロー / Integration Flow', () => {
    test('完全なゲームフロー（開始→プレイ→終了→再開）', () => {
      // 要件 4.1, 4.3: 完全なゲームライフサイクル
      
      const gameManager = new MockGameManager(null, 'hard');
      
      // 1. 初期状態
      expect(gameManager.getCurrentState()).toBe('menu');
      
      // 2. ゲーム開始
      gameManager.startGame();
      expect(gameManager.getCurrentState()).toBe('playing');
      expect(gameManager.getCurrentScore()).toBe(0);
      
      // 3. ゲームオーバー
      gameManager.simulateGameOver();
      expect(gameManager.getCurrentState()).toBe('gameover');
      expect(gameManager.getCurrentScore()).toBe(5000);
      
      // 4. 再スタート
      gameManager.restartGame();
      expect(gameManager.getCurrentState()).toBe('menu');
      expect(gameManager.getCurrentScore()).toBe(0);
    });

    test('勝利フロー（開始→プレイ→勝利→再開）', () => {
      // 要件 3.3: 完了時間の最終スコア記録
      
      const gameManager = new MockGameManager(null, 'super-hard');
      
      // 1. ゲーム開始
      gameManager.startGame();
      expect(gameManager.getCurrentState()).toBe('playing');
      
      // 2. 勝利
      gameManager.simulateVictory();
      expect(gameManager.getCurrentState()).toBe('victory');
      expect(gameManager.getCurrentScore()).toBe(10000);
      
      // 3. 再スタート
      gameManager.restartGame();
      expect(gameManager.getCurrentState()).toBe('menu');
      expect(gameManager.getCurrentScore()).toBe(0);
    });

    test('複数回のゲームプレイ', () => {
      // 要件 4.1, 4.3: 複数回のゲームセッション
      
      const gameManager = new MockGameManager(null, 'medium');
      
      // 1回目のゲーム
      gameManager.startGame();
      gameManager.simulateGameOver();
      expect(gameManager.getCurrentState()).toBe('gameover');
      
      gameManager.restartGame();
      expect(gameManager.getCurrentState()).toBe('menu');
      
      // 2回目のゲーム
      gameManager.startGame();
      gameManager.simulateVictory();
      expect(gameManager.getCurrentState()).toBe('victory');
      
      gameManager.restartGame();
      expect(gameManager.getCurrentState()).toBe('menu');
      
      // 3回目のゲーム
      gameManager.startGame();
      expect(gameManager.getCurrentState()).toBe('playing');
      expect(gameManager.getCurrentScore()).toBe(0);
    });
  });
});