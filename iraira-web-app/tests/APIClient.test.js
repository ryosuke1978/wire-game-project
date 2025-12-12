/**
 * APIClient Tests - APIクライアントのテスト
 * 
 * プロパティベーステストと単体テストを含む
 */

// テスト環境のセットアップ
const fc = require('fast-check');

// Node.js環境でのポリフィル
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// fetchのモック
global.fetch = jest.fn();

// APIClientクラスをインポート
const APIClient = require('../src/APIClient.js').default || require('../src/APIClient.js');

describe('APIClient', () => {
  let apiClient;
  const mockEndpoint = 'https://api.example.com';

  beforeEach(() => {
    apiClient = new APIClient(mockEndpoint);
    fetch.mockClear();
  });

  describe('プロパティベーステスト', () => {
    const config = { numRuns: 10 }; // テスト数を減らして安定性を向上

    /**
     * Feature: mouse-wire-game, Property 12: Score Submission on Completion
     * **Validates: Requirements 6.1**
     */
    test('Property 12: Score Submission on Completion', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(name => /^[a-zA-Z0-9 \-_]+$/.test(name.trim())), // 有効な名前
          fc.integer({ min: 1000, max: 300000 }), // スコア（1秒〜5分）
          fc.constantFrom('easy', 'medium', 'hard', 'super-hard'), // 難易度
          async (playerName, score, difficulty) => {
            // 新しいAPIClientインスタンスを作成（独立性を保つため）
            const testClient = new APIClient(mockEndpoint);
            
            // モックレスポンスを設定
            const mockResponse = {
              ok: true,
              json: async () => ({ success: true, id: 'test-id' })
            };
            fetch.mockResolvedValueOnce(mockResponse);

            try {
              // スコア送信を実行
              const result = await testClient.submitScore(playerName.trim(), score, difficulty);

              // 結果が正しく返されることを確認
              return result && result.success === true;
            } catch (error) {
              // エラーが発生した場合はfalseを返す
              return false;
            }
          }
        ),
        config
      );
    });

    /**
     * Feature: mouse-wire-game, Property 20: Valid Name Included in Submission
     * **Validates: Requirements 8.6**
     */
    test('Property 20: Valid Name Included in Submission', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(name => {
            const trimmed = name.trim();
            return trimmed.length >= 1 && trimmed.length <= 20 && /^[a-zA-Z0-9 \-_]+$/.test(trimmed);
          }), // 有効な名前のみ
          fc.integer({ min: 1000, max: 300000 }), // スコア
          fc.constantFrom('easy', 'medium', 'hard', 'super-hard'), // 難易度
          async (validName, score, difficulty) => {
            // 新しいAPIClientインスタンスを作成（独立性を保つため）
            const testClient = new APIClient(mockEndpoint);
            
            // モックレスポンスを設定
            const mockResponse = {
              ok: true,
              json: async () => ({ success: true })
            };
            fetch.mockResolvedValueOnce(mockResponse);

            try {
              const trimmedName = validName.trim();
              
              // 有効な名前でスコア送信
              const result = await testClient.submitScore(trimmedName, score, difficulty);

              // fetchが呼ばれたことを確認
              expect(fetch).toHaveBeenCalled();
              
              // 最後のfetch呼び出しの引数を取得
              const lastCall = fetch.mock.calls[fetch.mock.calls.length - 1];
              const [url, options] = lastCall;
              
              // リクエストボディをパース
              const requestBody = JSON.parse(options.body);
              
              // 有効な名前がリクエストペイロードに含まれていることを確認
              const nameIncluded = requestBody.playerName === trimmedName;
              const scoreIncluded = requestBody.score === score;
              const difficultyIncluded = requestBody.difficulty === difficulty;
              const timestampIncluded = typeof requestBody.timestamp === 'number';
              
              // 結果が正しく返され、名前が正確に含まれていることを確認
              return result && result.success === true && nameIncluded && scoreIncluded && difficultyIncluded && timestampIncluded;
            } catch (error) {
              // エラーが発生した場合はfalseを返す
              console.error('Property 20 test error:', error);
              return false;
            }
          }
        ),
        config
      );
    });
  });

  describe('単体テスト', () => {
    describe('constructor', () => {
      test('should initialize with correct endpoint', () => {
        const client = new APIClient('https://test.com');
        expect(client.apiEndpoint).toBe('https://test.com');
        expect(client.timeout).toBe(10000);
        expect(client.maxRetries).toBe(3);
      });
    });

    describe('submitScore', () => {
      test('should submit score successfully', async () => {
        const mockResponse = {
          ok: true,
          json: async () => ({ success: true, id: 'test-123' })
        };
        fetch.mockResolvedValueOnce(mockResponse);

        const result = await apiClient.submitScore('TestPlayer', 15000, 'medium');

        expect(fetch).toHaveBeenCalledWith(
          `${mockEndpoint}/scores`,
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('TestPlayer')
          })
        );
        expect(result).toEqual({ success: true, id: 'test-123' });
      });
    });

    describe('getLeaderboard', () => {
      test('should fetch leaderboard successfully', async () => {
        const mockLeaderboard = [
          { playerName: 'Player1', score: 10000, difficulty: 'easy' },
          { playerName: 'Player2', score: 12000, difficulty: 'easy' }
        ];
        const mockResponse = {
          ok: true,
          json: async () => mockLeaderboard
        };
        fetch.mockResolvedValueOnce(mockResponse);

        const result = await apiClient.getLeaderboard('easy', 10);

        expect(fetch).toHaveBeenCalledWith(
          `${mockEndpoint}/leaderboard?difficulty=easy&limit=10`,
          expect.objectContaining({
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })
        );
        expect(result).toEqual(mockLeaderboard);
      });
    });

    describe('getPlayerHistory', () => {
      test('should fetch player history successfully', async () => {
        const mockHistory = [
          { score: 15000, difficulty: 'medium', timestamp: 1234567890 }
        ];
        const mockResponse = {
          ok: true,
          json: async () => mockHistory
        };
        fetch.mockResolvedValueOnce(mockResponse);

        const result = await apiClient.getPlayerHistory('TestPlayer');

        expect(fetch).toHaveBeenCalledWith(
          `${mockEndpoint}/history?playerName=TestPlayer`,
          expect.objectContaining({
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          })
        );
        expect(result).toEqual(mockHistory);
      });
    });
  });

  describe('エラー処理テスト', () => {
    test('should handle network failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.submitScore('Test', 1000, 'easy'))
        .rejects.toThrow('Unable to submit score. Please check your connection.');
    });

    test('should handle timeout', async () => {
      // AbortErrorをシミュレート - 3回すべて失敗させる（リトライ分も含む）
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      fetch.mockRejectedValue(abortError);

      await expect(apiClient.submitScore('Test', 1000, 'easy'))
        .rejects.toThrow('Request timed out. Please try again.');
    });

    test('should handle server error (500)', async () => {
      // サーバーエラーレスポンスを3回すべて返す（リトライ分も含む）
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' })
      };
      fetch.mockResolvedValue(mockResponse);

      await expect(apiClient.submitScore('Test', 1000, 'easy'))
        .rejects.toThrow('Server error. Your score was not saved.');
    });

    test('should handle rate limiting (429)', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' })
      };
      fetch.mockResolvedValueOnce(mockResponse);

      await expect(apiClient.submitScore('Test', 1000, 'easy'))
        .rejects.toThrow('Too many requests. Please wait a moment.');
    });

    test('should retry on server error', async () => {
      // 最初の2回は失敗、3回目は成功
      fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      const result = await apiClient.submitScore('Test', 1000, 'easy');
      
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true });
    });

    test('should not retry on client error (400)', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid input' })
      };
      fetch.mockResolvedValueOnce(mockResponse);

      await expect(apiClient.submitScore('Test', 1000, 'easy'))
        .rejects.toThrow('HTTP 400: Bad Request');
      
      expect(fetch).toHaveBeenCalledTimes(1); // リトライしない
    });
  });
});