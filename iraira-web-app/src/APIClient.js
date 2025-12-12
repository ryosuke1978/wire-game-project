/**
 * APIClient - バックエンドAPIとの通信を管理するクラス
 * スコア送信、リーダーボード取得、プレイヤー履歴取得を担当
 */
class APIClient {
  /**
   * APIClientのコンストラクタ
   * @param {string} apiEndpoint - APIのベースエンドポイントURL
   */
  constructor(apiEndpoint) {
    this.apiEndpoint = apiEndpoint;
    this.timeout = 10000; // 10秒のタイムアウト
    this.maxRetries = 3; // 最大リトライ回数
    this.retryDelay = 1000; // 初期リトライ遅延（ミリ秒）
  }

  /**
   * スコアをバックエンドに送信
   * @param {string} playerName - プレイヤー名
   * @param {number} score - スコア（完了時間）
   * @param {string} difficulty - 難易度
   * @returns {Promise<Object>} 送信結果
   */
  async submitScore(playerName, score, difficulty) {
    const endpoint = `${this.apiEndpoint}/scores`;
    const payload = {
      playerName,
      score,
      difficulty,
      timestamp: Date.now()
    };

    this._logRequest('POST', endpoint, payload);

    try {
      const response = await this._makeRequestWithRetry('POST', endpoint, payload);
      this._logResponse(response);
      return response;
    } catch (error) {
      this._logError('submitScore', error);
      throw this._handleError(error);
    }
  }

  /**
   * 指定された難易度のリーダーボードを取得
   * @param {string} difficulty - 難易度
   * @param {number} limit - 取得する件数（デフォルト: 10）
   * @returns {Promise<Array>} リーダーボードデータ
   */
  async getLeaderboard(difficulty, limit = 10) {
    const endpoint = `${this.apiEndpoint}/leaderboard?difficulty=${encodeURIComponent(difficulty)}&limit=${limit}`;

    this._logRequest('GET', endpoint);

    try {
      const response = await this._makeRequestWithRetry('GET', endpoint);
      this._logResponse(response);
      return response;
    } catch (error) {
      this._logError('getLeaderboard', error);
      throw this._handleError(error);
    }
  }

  /**
   * 指定されたプレイヤーの履歴を取得
   * @param {string} playerName - プレイヤー名
   * @returns {Promise<Array>} プレイヤー履歴データ
   */
  async getPlayerHistory(playerName) {
    const endpoint = `${this.apiEndpoint}/history?playerName=${encodeURIComponent(playerName)}`;

    this._logRequest('GET', endpoint);

    try {
      const response = await this._makeRequestWithRetry('GET', endpoint);
      this._logResponse(response);
      return response;
    } catch (error) {
      this._logError('getPlayerHistory', error);
      throw this._handleError(error);
    }
  }

  /**
   * リトライロジック付きでHTTPリクエストを実行
   * @param {string} method - HTTPメソッド
   * @param {string} url - リクエストURL
   * @param {Object} body - リクエストボディ（オプション）
   * @returns {Promise<Object>} レスポンスデータ
   * @private
   */
  async _makeRequestWithRetry(method, url, body = null) {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this._makeRequest(method, url, body);
      } catch (error) {
        lastError = error;

        // リトライしない条件
        if (this._shouldNotRetry(error)) {
          throw error;
        }

        // 最後の試行の場合はリトライしない
        if (attempt === this.maxRetries) {
          break;
        }

        // 指数バックオフでリトライ遅延
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`APIリクエスト失敗 (試行 ${attempt}/${this.maxRetries}). ${delay}ms後にリトライします...`);
        await this._sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * HTTPリクエストを実行
   * @param {string} method - HTTPメソッド
   * @param {string} url - リクエストURL
   * @param {Object} body - リクエストボディ（オプション）
   * @returns {Promise<Object>} レスポンスデータ
   * @private
   */
  async _makeRequest(method, url, body = null) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = errorData;
        throw error;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timed out. Please try again.');
        timeoutError.isTimeout = true;
        throw timeoutError;
      }
      
      // テスト環境でのタイムアウトシミュレーション
      if (error.isTimeout) {
        throw error;
      }
      
      throw error;
    }
  }

  /**
   * エラーがリトライ対象外かどうかを判定
   * @param {Error} error - エラーオブジェクト
   * @returns {boolean} リトライしない場合はtrue
   * @private
   */
  _shouldNotRetry(error) {
    // 4xxエラー（クライアントエラー）はリトライしない
    if (error.status >= 400 && error.status < 500) {
      return true;
    }

    // ネットワークエラーやタイムアウトはリトライする
    return false;
  }

  /**
   * エラーを適切な形式に変換
   * @param {Error} error - 元のエラー
   * @returns {Error} 処理されたエラー
   * @private
   */
  _handleError(error) {
    // タイムアウトエラーの処理
    if (error.isTimeout || error.name === 'AbortError') {
      return new Error('Request timed out. Please try again.');
    }

    // ネットワーク接続チェック（ブラウザ環境のみ）
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return new Error('Unable to submit score. Please check your connection.');
    }

    // HTTPステータスコードに基づくエラー処理
    if (error.status === 429) {
      return new Error('Too many requests. Please wait a moment.');
    }

    if (error.status >= 500) {
      return new Error('Server error. Your score was not saved.');
    }

    if (error.status >= 400 && error.status < 500) {
      return new Error(error.message || 'Invalid request. Please check your input.');
    }

    // ネットワークエラーやその他のエラー
    return new Error('Unable to submit score. Please check your connection.');
  }

  /**
   * リクエストをログに記録
   * @param {string} method - HTTPメソッド
   * @param {string} url - リクエストURL
   * @param {Object} body - リクエストボディ（オプション）
   * @private
   */
  _logRequest(method, url, body = null) {
    console.log(`[APIClient] ${method} ${url}`, body ? { body } : '');
  }

  /**
   * レスポンスをログに記録
   * @param {Object} response - レスポンスデータ
   * @private
   */
  _logResponse(response) {
    console.log('[APIClient] Response:', response);
  }

  /**
   * エラーをログに記録
   * @param {string} method - メソッド名
   * @param {Error} error - エラーオブジェクト
   * @private
   */
  _logError(method, error) {
    console.error(`[APIClient] ${method} error:`, error);
  }

  /**
   * 指定された時間だけ待機
   * @param {number} ms - 待機時間（ミリ秒）
   * @returns {Promise<void>}
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ES6モジュールとしてエクスポート
export default APIClient;

// CommonJS形式でもエクスポート（テスト環境用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIClient;
}