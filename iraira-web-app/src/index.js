/**
 * メインアプリケーションエントリーポイント
 * UIコンポーネントとゲームロジックを統合
 */

// ゲームコンポーネントをインポート
import GameManager from './GameManager.js';
import Character from './Character.js';
import InputHandler from './InputHandler.js';
import LevelGenerator from './LevelGenerator.js';
import CollisionDetector from './CollisionDetector.js';
import Renderer from './Renderer.js';
import AnimationEngine from './AnimationEngine.js';
import APIClient from './APIClient.js';
import { sanitizeName, validateNameLength } from './ValidationUtils.js';

/**
 * UIManager クラス - UI画面の管理と遷移を制御
 */
class UIManager {
  constructor() {
    this.gameManager = null;
    // グローバルに設定されたAPI_ENDPOINTを使用
    const apiEndpoint = window.API_ENDPOINT || 'http://localhost:3000/dev';
    this.apiClient = new APIClient(apiEndpoint);
    this.selectedDifficulty = null;
    
    // DOM要素の参照を取得
    this.screens = {
      menu: document.getElementById('menu-screen'),
      game: document.getElementById('game-screen'),
      gameover: document.getElementById('gameover-screen'),
      victory: document.getElementById('victory-screen'),
      leaderboard: document.getElementById('leaderboard-screen')
    };
    
    this.canvas = document.getElementById('game-canvas');
    
    // イベントリスナーを設定
    this.setupEventListeners();
    
    // 初期画面を表示
    this.showScreen('menu');
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // メニュー画面のイベント
    this.setupMenuEvents();
    
    // ゲームオーバー画面のイベント
    this.setupGameOverEvents();
    
    // 勝利画面のイベント
    this.setupVictoryEvents();
    
    // リーダーボード画面のイベント
    this.setupLeaderboardEvents();
  }

  /**
   * メニュー画面のイベントを設定
   * 要件 4.1: スタートボタンクリック時の新しいゲームセッション初期化
   * 要件 5.6: 開始前の難易度選択
   */
  setupMenuEvents() {
    // 難易度選択ボタン
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    difficultyButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        // 他のボタンの選択状態を解除
        difficultyButtons.forEach(btn => btn.classList.remove('selected'));
        
        // 選択されたボタンをハイライト
        e.target.classList.add('selected');
        
        // 選択された難易度を保存
        this.selectedDifficulty = e.target.dataset.difficulty;
        
        // スタートボタンを有効化
        document.getElementById('start-btn').disabled = false;
      });
    });

    // スタートボタン
    document.getElementById('start-btn').addEventListener('click', () => {
      if (this.selectedDifficulty) {
        this.startGame(this.selectedDifficulty);
      }
    });

    // リーダーボード表示ボタン（将来の拡張用）
    const showLeaderboardBtn = document.getElementById('show-leaderboard-btn');
    if (showLeaderboardBtn) {
      showLeaderboardBtn.addEventListener('click', () => {
        this.showLeaderboard();
      });
    }
  }

  /**
   * ゲームオーバー画面のイベントを設定
   * 要件 2.2: ゲームオーバー時の最終結果表示
   * 要件 4.2: ゲーム終了時の再スタートボタン表示
   * 要件 8.1: ゲーム完了時の名前入力プロンプト
   * 要件 8.5: 名前検証失敗時のエラーメッセージと再入力許可
   */
  setupGameOverEvents() {
    // 名前入力とスコア送信
    const playerNameInput = document.getElementById('player-name');
    const submitScoreBtn = document.getElementById('submit-score-btn');
    const nameError = document.getElementById('name-error');

    // リアルタイム名前検証
    playerNameInput.addEventListener('input', () => {
      this.validateNameInput(playerNameInput, nameError);
    });

    // スコア送信ボタン
    submitScoreBtn.addEventListener('click', async () => {
      const playerName = playerNameInput.value.trim();
      
      try {
        // 名前を検証・サニタイズ
        const sanitizedName = sanitizeName(playerName);
        validateNameLength(sanitizedName);
        
        // スコアを送信
        await this.submitScore(sanitizedName, this.gameManager.getCurrentScore(), this.gameManager.getDifficulty());
        
        // 成功メッセージを表示
        nameError.textContent = 'スコアが送信されました！ / Score submitted!';
        nameError.style.color = '#4caf50';
        
        // ボタンを無効化
        submitScoreBtn.disabled = true;
        
        // リーダーボード表示ボタンを追加
        this.showLeaderboardButton(nameError, this.gameManager.getDifficulty());
        
      } catch (error) {
        // エラーメッセージを表示
        nameError.textContent = error.message;
        nameError.style.color = '#f5576c';
      }
    });

    // 再スタートボタン
    document.getElementById('restart-btn-gameover').addEventListener('click', () => {
      this.restartGame();
    });
  }

  /**
   * 勝利画面のイベントを設定
   * 要件 3.3: 完了時間の最終スコア記録
   * 要件 3.4: ゲーム終了時の経過時間表示
   * 要件 8.1: ゲーム完了時の名前入力プロンプト
   */
  setupVictoryEvents() {
    // 名前入力とスコア送信
    const playerNameInput = document.getElementById('player-name-victory');
    const submitScoreBtn = document.getElementById('submit-score-btn-victory');
    const nameError = document.getElementById('name-error-victory');

    // リアルタイム名前検証
    playerNameInput.addEventListener('input', () => {
      this.validateNameInput(playerNameInput, nameError);
    });

    // スコア送信ボタン
    submitScoreBtn.addEventListener('click', async () => {
      const playerName = playerNameInput.value.trim();
      
      try {
        // 名前を検証・サニタイズ
        const sanitizedName = sanitizeName(playerName);
        validateNameLength(sanitizedName);
        
        // スコアを送信
        await this.submitScore(sanitizedName, this.gameManager.getCurrentScore(), this.gameManager.getDifficulty());
        
        // 成功メッセージを表示
        nameError.textContent = 'スコアが送信されました！ / Score submitted!';
        nameError.style.color = '#4caf50';
        
        // ボタンを無効化
        submitScoreBtn.disabled = true;
        
        // リーダーボード表示ボタンを追加
        this.showLeaderboardButton(nameError, this.gameManager.getDifficulty());
        
      } catch (error) {
        // エラーメッセージを表示
        nameError.textContent = error.message;
        nameError.style.color = '#f5576c';
      }
    });

    // 再スタートボタン
    document.getElementById('restart-btn-victory').addEventListener('click', () => {
      this.restartGame();
    });
  }

  /**
   * リーダーボード画面のイベントを設定
   * 要件 7.2: プレイヤー名、スコア、日付の表示
   * 要件 7.4: 難易度レベル別のスコア整理
   */
  setupLeaderboardEvents() {
    // 難易度タブ
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        // 他のタブの選択状態を解除
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // 選択されたタブをアクティブに
        e.target.classList.add('active');
        
        // 選択された難易度のリーダーボードを表示
        const difficulty = e.target.dataset.difficulty;
        this.loadLeaderboard(difficulty);
      });
    });

    // 更新ボタン
    document.getElementById('refresh-leaderboard-btn').addEventListener('click', () => {
      const activeDifficulty = document.querySelector('.tab-btn.active').dataset.difficulty;
      this.loadLeaderboard(activeDifficulty);
    });

    // メニューに戻るボタン
    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
      this.showScreen('menu');
    });
  }

  /**
   * 名前入力の検証
   * 要件 8.2: 名前の長さ検証（1-20文字）
   * 要件 8.3: 名前のサニタイゼーション
   */
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
      
      // 検証成功
      errorElement.textContent = '';
      return true;
      
    } catch (error) {
      // 検証失敗
      errorElement.textContent = error.message;
      errorElement.style.color = '#f5576c';
      return false;
    }
  }

  /**
   * ゲームを開始
   * @param {string} difficulty - 選択された難易度
   */
  startGame(difficulty) {
    // 既存のゲームマネージャーを破棄
    if (this.gameManager) {
      this.gameManager.destroy();
    }
    
    // 新しいゲームマネージャーを作成
    this.gameManager = new GameManager(this.canvas, difficulty);
    
    // ゲーム画面に切り替え
    this.showScreen('game');
    
    // 難易度表示を更新
    document.getElementById('difficulty-value').textContent = this.getDifficultyDisplayName(difficulty);
    
    // ゲームを開始
    this.gameManager.startGame();
    
    // ゲーム状態の監視を開始
    this.startGameStateMonitoring();
  }

  /**
   * ゲームを再スタート
   * 要件 4.3: 再スタートボタンクリック時の全ゲーム状態リセット
   */
  restartGame() {
    // 入力フィールドをクリア
    document.getElementById('player-name').value = '';
    document.getElementById('player-name-victory').value = '';
    document.getElementById('name-error').textContent = '';
    document.getElementById('name-error-victory').textContent = '';
    
    // ボタンを再有効化
    document.getElementById('submit-score-btn').disabled = false;
    document.getElementById('submit-score-btn-victory').disabled = false;
    
    // メニュー画面に戻る
    this.showScreen('menu');
    
    // ゲームマネージャーを破棄
    if (this.gameManager) {
      this.gameManager.destroy();
      this.gameManager = null;
    }
  }

  /**
   * 画面を表示
   * @param {string} screenName - 表示する画面名
   */
  showScreen(screenName) {
    // すべての画面を非表示
    Object.values(this.screens).forEach(screen => {
      screen.classList.remove('active');
    });
    
    // 指定された画面を表示
    if (this.screens[screenName]) {
      this.screens[screenName].classList.add('active');
    }
  }

  /**
   * ゲーム状態の監視を開始
   */
  startGameStateMonitoring() {
    const monitorInterval = setInterval(() => {
      if (!this.gameManager) {
        clearInterval(monitorInterval);
        return;
      }
      
      const state = this.gameManager.getCurrentState();
      
      // タイマー表示を更新
      if (state === 'playing') {
        const currentTime = this.gameManager.getCurrentScore();
        document.getElementById('timer-value').textContent = (currentTime / 1000).toFixed(2);
      }
      
      // ゲーム終了状態をチェック
      if (state === 'gameover') {
        clearInterval(monitorInterval);
        this.showGameOverScreen();
      } else if (state === 'victory') {
        clearInterval(monitorInterval);
        this.showVictoryScreen();
      }
    }, 100); // 100msごとに更新（要件 3.2）
  }

  /**
   * ゲームオーバー画面を表示
   */
  showGameOverScreen() {
    const finalTime = this.gameManager.getCurrentScore();
    document.getElementById('gameover-time').textContent = (finalTime / 1000).toFixed(2);
    this.showScreen('gameover');
  }

  /**
   * 勝利画面を表示
   */
  showVictoryScreen() {
    const finalTime = this.gameManager.getCurrentScore();
    document.getElementById('victory-time').textContent = (finalTime / 1000).toFixed(2);
    this.showScreen('victory');
  }

  /**
   * スコアを送信
   * 要件 6.1: ゲーム完了時のバックエンドサービスへのスコアデータ送信
   * 要件 8.6: 有効な名前をスコア送信に含める
   */
  async submitScore(playerName, score, difficulty) {
    // ローディング状態を表示
    this.showLoadingState('スコアを送信中... / Submitting score...');
    
    try {
      await this.apiClient.submitScore(playerName, score, difficulty);
      
      // 成功後にリーダーボードを更新
      await this.refreshLeaderboardAfterSubmission(difficulty);
      
    } catch (error) {
      // APIエラーを適切なメッセージに変換
      if (error.message.includes('Network')) {
        throw new Error('ネットワークエラーです。接続を確認してください。 / Network error. Please check your connection.');
      } else if (error.message.includes('timeout')) {
        throw new Error('リクエストがタイムアウトしました。再試行してください。 / Request timed out. Please try again.');
      } else if (error.message.includes('5')) {
        throw new Error('サーバーエラーです。スコアは保存されませんでした。 / Server error. Your score was not saved.');
      } else {
        throw new Error('スコアの送信に失敗しました。 / Failed to submit score.');
      }
    } finally {
      // ローディング状態を非表示
      this.hideLoadingState();
    }
  }

  /**
   * リーダーボードを表示
   * @param {string} difficulty - 表示する難易度（オプション）
   */
  async showLeaderboard(difficulty = 'easy') {
    this.showScreen('leaderboard');
    
    // 指定された難易度のタブをアクティブにする
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.difficulty === difficulty) {
        btn.classList.add('active');
      }
    });
    
    // 指定された難易度のリーダーボードを表示
    this.loadLeaderboard(difficulty);
  }

  /**
   * 指定された難易度のリーダーボードを読み込み
   * @param {string} difficulty - 難易度
   */
  async loadLeaderboard(difficulty) {
    // ローディング状態を表示
    this.showLoadingState('リーダーボードを読み込み中... / Loading leaderboard...');
    
    try {
      const leaderboard = await this.apiClient.getLeaderboard(difficulty, 10);
      this.displayLeaderboard(leaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      // エラー時は空のテーブルを表示
      this.displayLeaderboard([]);
    } finally {
      // ローディング状態を非表示
      this.hideLoadingState();
    }
  }

  /**
   * スコア送信後にリーダーボードを更新
   * @param {string} difficulty - 難易度
   */
  async refreshLeaderboardAfterSubmission(difficulty) {
    try {
      // 少し待ってからリーダーボードを更新（データベースの整合性を確保）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 現在の難易度のリーダーボードを更新
      const leaderboard = await this.apiClient.getLeaderboard(difficulty, 10);
      
      // リーダーボード画面が表示されている場合は更新
      if (this.screens.leaderboard.classList.contains('active')) {
        this.displayLeaderboard(leaderboard);
      }
    } catch (error) {
      console.error('Failed to refresh leaderboard:', error);
    }
  }

  /**
   * リーダーボードを表示
   * @param {Array} leaderboard - リーダーボードデータ
   */
  displayLeaderboard(leaderboard) {
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';
    
    if (leaderboard.length === 0) {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 4;
      cell.textContent = 'データがありません / No data available';
      cell.style.textAlign = 'center';
      return;
    }
    
    leaderboard.forEach((entry, index) => {
      const row = tbody.insertRow();
      
      // 順位
      const rankCell = row.insertCell();
      rankCell.textContent = index + 1;
      
      // プレイヤー名
      const nameCell = row.insertCell();
      nameCell.textContent = entry.playerName;
      
      // スコア（秒単位）
      const scoreCell = row.insertCell();
      scoreCell.textContent = `${(entry.score / 1000).toFixed(2)}s`;
      
      // 日付
      const dateCell = row.insertCell();
      const date = new Date(entry.timestamp);
      dateCell.textContent = date.toLocaleDateString('ja-JP');
    });
  }

  /**
   * 難易度の表示名を取得
   * @param {string} difficulty - 難易度キー
   * @returns {string} 表示名
   */
  getDifficultyDisplayName(difficulty) {
    const names = {
      'easy': 'イージー / Easy',
      'medium': 'ミディアム / Medium',
      'hard': 'ハード / Hard',
      'super-hard': 'スーパーハード / Super Hard'
    };
    return names[difficulty] || difficulty;
  }

  /**
   * ローディング状態を表示
   * @param {string} message - ローディングメッセージ
   */
  showLoadingState(message = 'Loading...') {
    // 既存のローディング要素があれば削除
    this.hideLoadingState();
    
    // ローディングオーバーレイを作成
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.className = 'loading-overlay';
    
    const loadingContent = document.createElement('div');
    loadingContent.className = 'loading-content';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    const messageElement = document.createElement('div');
    messageElement.className = 'loading-message';
    messageElement.textContent = message;
    
    loadingContent.appendChild(spinner);
    loadingContent.appendChild(messageElement);
    loadingOverlay.appendChild(loadingContent);
    
    // ゲームコンテナに追加
    document.getElementById('game-container').appendChild(loadingOverlay);
  }

  /**
   * ローディング状態を非表示
   */
  hideLoadingState() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
  }

  /**
   * リーダーボード表示ボタンを追加
   * @param {HTMLElement} container - ボタンを追加するコンテナ
   * @param {string} difficulty - 表示する難易度
   */
  showLeaderboardButton(container, difficulty) {
    // 既存のボタンがあれば削除
    const existingBtn = container.querySelector('.view-leaderboard-btn');
    if (existingBtn) {
      existingBtn.remove();
    }
    
    // リーダーボード表示ボタンを作成
    const leaderboardBtn = document.createElement('button');
    leaderboardBtn.className = 'view-leaderboard-btn';
    leaderboardBtn.textContent = 'リーダーボードを見る / View Leaderboard';
    leaderboardBtn.style.marginTop = '10px';
    leaderboardBtn.style.padding = '8px 16px';
    leaderboardBtn.style.backgroundColor = '#4caf50';
    leaderboardBtn.style.color = 'white';
    leaderboardBtn.style.border = 'none';
    leaderboardBtn.style.borderRadius = '4px';
    leaderboardBtn.style.cursor = 'pointer';
    
    // クリックイベントを追加
    leaderboardBtn.addEventListener('click', () => {
      this.showLeaderboard(difficulty);
    });
    
    // コンテナに追加
    container.appendChild(leaderboardBtn);
  }
}

// アプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
  // グローバルクラスを設定（他のモジュールで使用するため）
  window.Character = Character;
  window.InputHandler = InputHandler;
  window.LevelGenerator = LevelGenerator;
  window.CollisionDetector = CollisionDetector;
  window.Renderer = Renderer;
  window.AnimationEngine = AnimationEngine;
  
  // UIマネージャーを初期化
  const uiManager = new UIManager();
  
  // デバッグ用にグローバルに公開
  window.uiManager = uiManager;
});