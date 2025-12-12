const https = require('https');
const { URL } = require('url');

// Configuration for integration tests
const API_BASE_URL = process.env.API_ENDPOINT || 'https://rpxmv6a1kb.execute-api.ap-northeast-1.amazonaws.com/dev';
const TEST_TIMEOUT = 30000; // 30 seconds

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseBody = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseBody
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

describe('Backend API Integration Tests', () => {
  jest.setTimeout(TEST_TIMEOUT);

  describe('Submit Score Endpoint', () => {
    test('should successfully submit a valid score', async () => {
      const testScore = {
        playerName: 'IntegrationTest',
        score: 12345,
        difficulty: 'easy'
      };

      const response = await makeRequest('POST', '/scores', testScore);
      
      // **Requirements: 6.1, 6.2**
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/success/i);
    });

    test('should reject invalid score data', async () => {
      const invalidScore = {
        playerName: '', // Invalid: empty name
        score: -100, // Invalid: negative score
        difficulty: 'invalid' // Invalid: not a valid difficulty
      };

      const response = await makeRequest('POST', '/scores', invalidScore);
      
      // **Requirements: 8.4**
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should sanitize player names', async () => {
      const testScore = {
        playerName: 'Test<script>alert("xss")</script>User',
        score: 5000,
        difficulty: 'medium'
      };

      const response = await makeRequest('POST', '/scores', testScore);
      
      // **Requirements: 8.3, 8.4**
      // Should succeed with sanitized name
      expect(response.statusCode).toBe(200);
    });

    test('should handle missing required fields', async () => {
      const incompleteScore = {
        playerName: 'TestUser'
        // Missing score and difficulty
      };

      const response = await makeRequest('POST', '/scores', incompleteScore);
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Get Leaderboard Endpoint', () => {
    test('should return leaderboard for valid difficulty', async () => {
      const response = await makeRequest('GET', '/leaderboard?difficulty=easy&limit=10');
      
      // **Requirements: 7.1**
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Verify leaderboard structure
      if (response.body.length > 0) {
        const entry = response.body[0];
        expect(entry).toHaveProperty('playerName');
        expect(entry).toHaveProperty('score');
        expect(entry).toHaveProperty('difficulty');
        expect(entry).toHaveProperty('timestamp');
        expect(entry.difficulty).toBe('easy');
      }
    });

    test('should return empty array for difficulty with no scores', async () => {
      const response = await makeRequest('GET', '/leaderboard?difficulty=super-hard&limit=10');
      
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should handle invalid difficulty parameter', async () => {
      const response = await makeRequest('GET', '/leaderboard?difficulty=invalid&limit=10');
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should limit results to specified number', async () => {
      const response = await makeRequest('GET', '/leaderboard?difficulty=easy&limit=5');
      
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });

    test('should default to reasonable limit when not specified', async () => {
      const response = await makeRequest('GET', '/leaderboard?difficulty=easy');
      
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(10); // Default limit
    });
  });

  describe('Get Player History Endpoint', () => {
    test('should return player history for valid player name', async () => {
      // First submit a score to ensure there's data
      const testScore = {
        playerName: 'HistoryTestPlayer',
        score: 7500,
        difficulty: 'medium'
      };
      
      await makeRequest('POST', '/scores', testScore);
      
      // Wait a moment for eventual consistency
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await makeRequest('GET', '/history?playerName=HistoryTestPlayer');
      
      // **Requirements: 6.4**
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const entry = response.body[0];
        expect(entry).toHaveProperty('score');
        expect(entry).toHaveProperty('difficulty');
        expect(entry).toHaveProperty('timestamp');
        
        // Verify chronological order (newest first or oldest first consistently)
        if (response.body.length > 1) {
          const timestamps = response.body.map(entry => entry.timestamp);
          const sortedAsc = [...timestamps].sort((a, b) => a - b);
          const sortedDesc = [...timestamps].sort((a, b) => b - a);
          
          // Should be sorted either ascending or descending
          expect(
            JSON.stringify(timestamps) === JSON.stringify(sortedAsc) ||
            JSON.stringify(timestamps) === JSON.stringify(sortedDesc)
          ).toBe(true);
        }
      }
    });

    test('should return empty array for non-existent player', async () => {
      const response = await makeRequest('GET', '/history?playerName=NonExistentPlayer12345');
      
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    test('should handle missing playerName parameter', async () => {
      const response = await makeRequest('GET', '/history');
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle invalid playerName parameter', async () => {
      const response = await makeRequest('GET', '/history?playerName=');
      
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Response Handling', () => {
    test('should return proper CORS headers', async () => {
      const response = await makeRequest('GET', '/leaderboard?difficulty=easy');
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    test('should handle OPTIONS requests for CORS preflight', async () => {
      const response = await makeRequest('OPTIONS', '/scores');
      
      expect(response.statusCode).toBe(200);
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });

    test('should return 404 for non-existent endpoints', async () => {
      const response = await makeRequest('GET', '/nonexistent');
      
      expect(response.statusCode).toBe(404);
    });

    test('should return 405 for unsupported HTTP methods', async () => {
      const response = await makeRequest('DELETE', '/scores');
      
      expect(response.statusCode).toBe(405);
    });
  });

  describe('End-to-End Score Flow', () => {
    test('should complete full score submission and retrieval flow', async () => {
      const uniquePlayer = `E2ETest_${Date.now()}`;
      const testScores = [
        { playerName: uniquePlayer, score: 1000, difficulty: 'easy' },
        { playerName: uniquePlayer, score: 2000, difficulty: 'medium' },
        { playerName: uniquePlayer, score: 1500, difficulty: 'easy' }
      ];

      // Submit multiple scores
      for (const score of testScores) {
        const submitResponse = await makeRequest('POST', '/scores', score);
        expect(submitResponse.statusCode).toBe(200);
        
        // Small delay between submissions
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Wait for eventual consistency
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Retrieve player history
      const historyResponse = await makeRequest('GET', `/history?playerName=${uniquePlayer}`);
      expect(historyResponse.statusCode).toBe(200);
      expect(historyResponse.body.length).toBeGreaterThanOrEqual(testScores.length);

      // Check leaderboard includes our scores
      const leaderboardResponse = await makeRequest('GET', '/leaderboard?difficulty=easy&limit=50');
      expect(leaderboardResponse.statusCode).toBe(200);
      
      const playerScores = leaderboardResponse.body.filter(entry => entry.playerName === uniquePlayer);
      expect(playerScores.length).toBeGreaterThanOrEqual(2); // Two easy difficulty scores
    });
  });
});