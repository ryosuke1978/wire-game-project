const fc = require('fast-check');
const AWS = require('aws-sdk');

// Mock AWS SDK
const mockQuery = jest.fn();
AWS.DynamoDB.DocumentClient = jest.fn(() => ({
  query: mockQuery
}));

const { handler } = require('../src/handlers/getLeaderboard');

describe('Get Leaderboard Lambda Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set environment variables
    process.env.TABLE_NAME = 'test-scores-table';
    process.env.AWS_REGION = 'us-east-1';
  });

  afterEach(() => {
    delete process.env.TABLE_NAME;
    delete process.env.AWS_REGION;
  });

  // **Feature: mouse-wire-game, Property 16: Leaderboard Top Scores**
  test('Property 16: Leaderboard Top Scores', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test data: difficulty and a list of scores
        fc.record({
          difficulty: fc.constantFrom('easy', 'medium', 'hard', 'super-hard'),
          limit: fc.integer({ min: 1, max: 10 }),
          scores: fc.array(
            fc.record({
              playerName: fc.string({ minLength: 1, maxLength: 20 })
                .filter(name => /^[a-zA-Z0-9 \-_]+$/.test(name.trim()) && name.trim().length > 0),
              score: fc.integer({ min: 1000, max: 999999 }), // Completion times in milliseconds
              timestamp: fc.integer({ min: 1600000000000, max: Date.now() }) // Valid timestamps
            }),
            { minLength: 0, maxLength: 50 } // Generate 0-50 scores
          )
        }),
        async (testData) => {
          // Clear mocks before each test case
          jest.clearAllMocks();
          
          // Mock DynamoDB response with the generated scores
          const mockItems = testData.scores.map(score => ({
            difficulty: testData.difficulty,
            timestamp: score.timestamp,
            playerName: score.playerName,
            score: score.score
          }));
          
          mockQuery.mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              Items: mockItems
            })
          });
          
          const event = {
            httpMethod: 'GET',
            path: '/leaderboard',
            queryStringParameters: {
              difficulty: testData.difficulty,
              limit: testData.limit.toString()
            }
          };

          const response = await handler(event);

          // Verify successful response
          expect(response.statusCode).toBe(200);
          
          // Verify DynamoDB query was called exactly once
          expect(mockQuery).toHaveBeenCalledTimes(1);
          
          const queryCall = mockQuery.mock.calls[0][0];
          
          // Verify query parameters
          expect(queryCall.TableName).toBe('test-scores-table');
          expect(queryCall.KeyConditionExpression).toBe('difficulty = :difficulty');
          expect(queryCall.ExpressionAttributeValues[':difficulty']).toBe(testData.difficulty);
          
          const responseBody = JSON.parse(response.body);
          const returnedScores = responseBody.data;
          
          // **Validates: Requirements 7.1**
          // For any difficulty level, the leaderboard query should return at most the requested limit of scores,
          // and these should be the lowest score values (best times) for that difficulty
          
          // Verify count constraint
          expect(returnedScores.length).toBeLessThanOrEqual(testData.limit);
          expect(returnedScores.length).toBeLessThanOrEqual(testData.scores.length);
          
          if (returnedScores.length > 0) {
            // Verify scores are sorted by score ascending (best times first)
            for (let i = 1; i < returnedScores.length; i++) {
              expect(returnedScores[i].score).toBeGreaterThanOrEqual(returnedScores[i - 1].score);
            }
            
            // Verify these are indeed the top scores (lowest values)
            const allScoresSorted = testData.scores
              .map(s => s.score)
              .sort((a, b) => a - b);
            
            const expectedTopScores = allScoresSorted.slice(0, testData.limit);
            const actualTopScores = returnedScores.map(s => s.score);
            
            // Each returned score should be among the expected top scores
            actualTopScores.forEach(score => {
              expect(expectedTopScores).toContain(score);
            });
            
            // Verify all returned scores have required fields
            returnedScores.forEach(score => {
              expect(score).toHaveProperty('playerName');
              expect(score).toHaveProperty('score');
              expect(score).toHaveProperty('difficulty', testData.difficulty);
              expect(score).toHaveProperty('timestamp');
              
              expect(typeof score.playerName).toBe('string');
              expect(typeof score.score).toBe('number');
              expect(typeof score.difficulty).toBe('string');
              expect(typeof score.timestamp).toBe('number');
            });
          }
          
          // Verify response metadata
          expect(responseBody.meta).toHaveProperty('difficulty', testData.difficulty);
          expect(responseBody.meta).toHaveProperty('count', returnedScores.length);
          expect(responseBody.meta).toHaveProperty('limit', testData.limit);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should handle invalid difficulty parameter', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/leaderboard',
      queryStringParameters: {
        difficulty: 'invalid-difficulty'
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
    
    const responseBody = JSON.parse(response.body);
    expect(responseBody.error).toBe('Validation Error');
    expect(responseBody.message).toContain('Difficulty parameter is required');
  });

  test('should handle missing difficulty parameter', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/leaderboard',
      queryStringParameters: null
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
    
    const responseBody = JSON.parse(response.body);
    expect(responseBody.error).toBe('Validation Error');
    expect(responseBody.message).toContain('Difficulty parameter is required');
  });

  test('should handle invalid limit parameter', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/leaderboard',
      queryStringParameters: {
        difficulty: 'easy',
        limit: 'invalid'
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
    
    const responseBody = JSON.parse(response.body);
    expect(responseBody.error).toBe('Validation Error');
    expect(responseBody.message).toContain('Limit must be a number');
  });

  test('should use default limit when not provided', async () => {
    mockQuery.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Items: []
      })
    });

    const event = {
      httpMethod: 'GET',
      path: '/leaderboard',
      queryStringParameters: {
        difficulty: 'easy'
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    
    const responseBody = JSON.parse(response.body);
    expect(responseBody.meta.limit).toBe(10); // Default limit
  });

  test('should handle DynamoDB errors', async () => {
    mockQuery.mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
    });

    const event = {
      httpMethod: 'GET',
      path: '/leaderboard',
      queryStringParameters: {
        difficulty: 'easy'
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    
    const responseBody = JSON.parse(response.body);
    expect(responseBody.error).toBe('Internal Server Error');
  });
});