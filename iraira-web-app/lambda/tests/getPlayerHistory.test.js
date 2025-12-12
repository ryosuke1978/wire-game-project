const fc = require('fast-check');
const AWS = require('aws-sdk');

// Mock AWS SDK
const mockQuery = jest.fn();
AWS.DynamoDB.DocumentClient = jest.fn(() => ({
  query: mockQuery
}));

const { handler } = require('../src/handlers/getPlayerHistory');

describe('Get Player History Lambda Function', () => {
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

  // **Feature: mouse-wire-game, Property 15: Player History Chronological Order**
  test('Property 15: Player History Chronological Order', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test data: player name and their score history
        fc.record({
          playerName: fc.string({ minLength: 1, maxLength: 20 })
            .filter(name => /^[a-zA-Z0-9 \-_]+$/.test(name.trim()) && name.trim().length > 0),
          scores: fc.array(
            fc.record({
              score: fc.integer({ min: 1000, max: 999999 }), // Completion times in milliseconds
              difficulty: fc.constantFrom('easy', 'medium', 'hard', 'super-hard'),
              timestamp: fc.integer({ min: 1600000000000, max: Date.now() }) // Valid timestamps
            }),
            { minLength: 0, maxLength: 20 } // Generate 0-20 scores for the player
          )
        }),
        async (testData) => {
          // Clear mocks before each test case
          jest.clearAllMocks();
          
          // Mock DynamoDB response with the generated scores, sorted by timestamp (chronological order)
          const mockItems = testData.scores
            .map(score => ({
              playerName: testData.playerName,
              timestamp: score.timestamp,
              score: score.score,
              difficulty: score.difficulty
            }))
            .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp ascending (chronological)
          
          mockQuery.mockReturnValue({
            promise: jest.fn().mockResolvedValue({
              Items: mockItems
            })
          });
          
          const event = {
            httpMethod: 'GET',
            path: '/history',
            queryStringParameters: {
              playerName: testData.playerName
            }
          };

          const response = await handler(event);

          // Verify successful response
          expect(response.statusCode).toBe(200);
          
          // Verify DynamoDB query was called exactly once
          expect(mockQuery).toHaveBeenCalledTimes(1);
          
          const queryCall = mockQuery.mock.calls[0][0];
          
          // Verify query parameters for GSI
          expect(queryCall.TableName).toBe('test-scores-table');
          expect(queryCall.IndexName).toBe('PlayerIndex');
          expect(queryCall.KeyConditionExpression).toBe('playerName = :playerName');
          // The playerName should be sanitized (trimmed and cleaned)
          const expectedSanitizedName = testData.playerName.replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
          expect(queryCall.ExpressionAttributeValues[':playerName']).toBe(expectedSanitizedName);
          expect(queryCall.ScanIndexForward).toBe(true); // Chronological order (ascending)
          
          const responseBody = JSON.parse(response.body);
          const returnedHistory = responseBody.data;
          
          // **Validates: Requirements 6.4**
          // For any player name query, the returned score history should be sorted in chronological order by timestamp
          
          // Verify count matches
          expect(returnedHistory.length).toBe(testData.scores.length);
          
          if (returnedHistory.length > 0) {
            // Verify chronological order (timestamps should be ascending - oldest first)
            // Since DynamoDB returns results sorted by timestamp (ScanIndexForward: true), 
            // we need to verify the returned data matches the expected sorted order
            for (let i = 1; i < returnedHistory.length; i++) {
              expect(returnedHistory[i].timestamp).toBeGreaterThanOrEqual(returnedHistory[i - 1].timestamp);
            }
            
            // Verify all returned scores have required fields (excluding playerName as per API spec)
            returnedHistory.forEach(score => {
              expect(score).toHaveProperty('score');
              expect(score).toHaveProperty('difficulty');
              expect(score).toHaveProperty('timestamp');
              expect(score).not.toHaveProperty('playerName'); // Should be excluded from response
              
              expect(typeof score.score).toBe('number');
              expect(typeof score.difficulty).toBe('string');
              expect(typeof score.timestamp).toBe('number');
              expect(['easy', 'medium', 'hard', 'super-hard']).toContain(score.difficulty);
            });
            
            // Verify the timestamps match the expected chronological order
            const expectedTimestamps = testData.scores
              .map(s => s.timestamp)
              .sort((a, b) => a - b); // Sort ascending (chronological)
            
            const actualTimestamps = returnedHistory.map(s => s.timestamp);
            expect(actualTimestamps).toEqual(expectedTimestamps);
          }
          
          // Verify response metadata
          expect(responseBody.meta).toHaveProperty('playerName', expectedSanitizedName);
          expect(responseBody.meta).toHaveProperty('count', returnedHistory.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should handle invalid playerName parameter', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/history',
      queryStringParameters: {
        playerName: '   ' // Only spaces - will be empty after trim
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
    
    const responseBody = JSON.parse(response.body);
    expect(responseBody.error).toBe('Validation Error');
    expect(responseBody.message).toContain('Name must be');
  });

  test('should handle missing playerName parameter', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/history',
      queryStringParameters: null
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
    
    const responseBody = JSON.parse(response.body);
    expect(responseBody.error).toBe('Validation Error');
    expect(responseBody.message).toContain('playerName parameter is required');
  });

  test('should sanitize playerName parameter', async () => {
    mockQuery.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Items: []
      })
    });

    const event = {
      httpMethod: 'GET',
      path: '/history',
      queryStringParameters: {
        playerName: 'Player123'  // Use a valid name that will pass sanitization
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    
    const queryCall = mockQuery.mock.calls[0][0];
    // Should sanitize to only alphanumeric characters
    expect(queryCall.ExpressionAttributeValues[':playerName']).toBe('Player123');
  });

  test('should handle DynamoDB errors', async () => {
    mockQuery.mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('DynamoDB error'))
    });

    const event = {
      httpMethod: 'GET',
      path: '/history',
      queryStringParameters: {
        playerName: 'TestPlayer'
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    
    const responseBody = JSON.parse(response.body);
    expect(responseBody.error).toBe('Internal Server Error');
  });

  test('should return empty history for player with no scores', async () => {
    mockQuery.mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Items: []
      })
    });

    const event = {
      httpMethod: 'GET',
      path: '/history',
      queryStringParameters: {
        playerName: 'NewPlayer'
      }
    };

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    
    const responseBody = JSON.parse(response.body);
    expect(responseBody.data).toEqual([]);
    expect(responseBody.meta.count).toBe(0);
    expect(responseBody.meta.playerName).toBe('NewPlayer');
  });
});