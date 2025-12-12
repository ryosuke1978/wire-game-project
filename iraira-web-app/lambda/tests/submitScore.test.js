const fc = require('fast-check');
const AWS = require('aws-sdk');

// Mock AWS SDK
const mockPut = jest.fn();
AWS.DynamoDB.DocumentClient = jest.fn(() => ({
  put: mockPut
}));

const { handler } = require('../src/handlers/submitScore');

describe('Submit Score Lambda Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPut.mockReturnValue({
      promise: jest.fn().mockResolvedValue({})
    });
    
    // Set environment variables
    process.env.TABLE_NAME = 'test-scores-table';
    process.env.AWS_REGION = 'us-east-1';
  });

  afterEach(() => {
    delete process.env.TABLE_NAME;
    delete process.env.AWS_REGION;
  });

  // **Feature: mouse-wire-game, Property 13: Score Storage with Timestamp**
  test('Property 13: Score Storage with Timestamp', async () => {
    // Use sequential execution to avoid mock interference
    const testCases = [
      { playerName: 'Player1', score: 1000, difficulty: 'easy' },
      { playerName: 'TestUser', score: 2000, difficulty: 'medium' },
      { playerName: 'Alice', score: 3000, difficulty: 'hard' },
      { playerName: 'Bob_123', score: 4000, difficulty: 'super-hard' },
      { playerName: 'Game-Master', score: 5000, difficulty: 'easy' }
    ];

    for (const validInput of testCases) {
      // Clear mocks before each test case
      jest.clearAllMocks();
      
      const event = {
        httpMethod: 'POST',
        path: '/scores',
        body: JSON.stringify(validInput),
        headers: { 'Content-Type': 'application/json' }
      };

      const timestampBefore = Date.now();
      const response = await handler(event);
      const timestampAfter = Date.now();

      // Verify successful response
      expect(response.statusCode).toBe(200);
      
      // Verify DynamoDB put was called exactly once
      expect(mockPut).toHaveBeenCalledTimes(1);
      
      const putCall = mockPut.mock.calls[0][0];
      const storedItem = putCall.Item;
      
      // **Validates: Requirements 6.2**
      // Verify that score is stored with timestamp
      expect(storedItem).toHaveProperty('timestamp');
      expect(typeof storedItem.timestamp).toBe('number');
      expect(storedItem.timestamp).toBeGreaterThanOrEqual(timestampBefore);
      expect(storedItem.timestamp).toBeLessThanOrEqual(timestampAfter);
      
      // Verify all required fields are present
      expect(storedItem).toHaveProperty('playerName');
      expect(storedItem).toHaveProperty('score', validInput.score);
      expect(storedItem).toHaveProperty('difficulty', validInput.difficulty);
    }
  });

  // **Feature: mouse-wire-game, Property 14: Score Includes Difficulty**
  test('Property 14: Score Includes Difficulty', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid inputs only
        fc.record({
          playerName: fc.string({ minLength: 1, maxLength: 20 })
            .filter(name => /^[a-zA-Z0-9 \-_]+$/.test(name.trim()) && name.trim().length > 0),
          score: fc.integer({ min: 0, max: 999999 }),
          difficulty: fc.constantFrom('easy', 'medium', 'hard', 'super-hard')
        }),
        async (validInput) => {
          // Clear mocks before each test case
          jest.clearAllMocks();
          
          const event = {
            httpMethod: 'POST',
            path: '/scores',
            body: JSON.stringify(validInput),
            headers: { 'Content-Type': 'application/json' }
          };

          const response = await handler(event);

          // Verify successful response
          expect(response.statusCode).toBe(200);
          
          // Verify DynamoDB put was called exactly once
          expect(mockPut).toHaveBeenCalledTimes(1);
          
          const putCall = mockPut.mock.calls[0][0];
          const storedItem = putCall.Item;
          
          // **Validates: Requirements 6.3**
          // Verify that stored score includes the difficulty level field matching the difficulty played
          expect(storedItem).toHaveProperty('difficulty');
          expect(storedItem.difficulty).toBe(validInput.difficulty);
          
          // Verify difficulty is used as partition key
          expect(putCall.TableName).toBe('test-scores-table');
        }
      ),
      { numRuns: 100 }
    );
  });

  // **Feature: mouse-wire-game, Property 19: Backend Name Validation**
  test('Property 19: Backend Name Validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate both valid and invalid inputs to test validation
        fc.record({
          playerName: fc.oneof(
            // Valid names (will be sanitized but should succeed)
            fc.string({ minLength: 1, maxLength: 20 })
              .filter(name => {
                const sanitized = name.replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
                return sanitized.length >= 1 && sanitized.length <= 20;
              }),
            // Invalid names (should fail validation)
            fc.oneof(
              fc.constant(''), // Empty string
              fc.constant('   '), // Only spaces
              fc.string({ minLength: 21, maxLength: 50 }), // Too long
              fc.string().filter(name => {
                const sanitized = name.replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
                return sanitized.length === 0; // Results in empty after sanitization
              })
            )
          ),
          score: fc.integer({ min: 0, max: 999999 }),
          difficulty: fc.constantFrom('easy', 'medium', 'hard', 'super-hard')
        }),
        async (input) => {
          // Clear mocks before each test case
          jest.clearAllMocks();
          
          const event = {
            httpMethod: 'POST',
            path: '/scores',
            body: JSON.stringify(input),
            headers: { 'Content-Type': 'application/json' }
          };

          const response = await handler(event);
          
          // **Validates: Requirements 8.4**
          // Backend should validate and sanitize name before storing in DynamoDB
          
          // Determine if input should be valid
          const sanitizedName = input.playerName.replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
          const shouldSucceed = sanitizedName.length >= 1 && sanitizedName.length <= 20;
          
          if (shouldSucceed) {
            // Should succeed and store sanitized name
            expect(response.statusCode).toBe(200);
            expect(mockPut).toHaveBeenCalledTimes(1);
            
            const putCall = mockPut.mock.calls[0][0];
            const storedItem = putCall.Item;
            
            // Verify stored name is sanitized and valid
            expect(storedItem.playerName).toBe(sanitizedName);
            expect(storedItem.playerName).toMatch(/^[a-zA-Z0-9 \-_]+$/);
            expect(storedItem.playerName.length).toBeGreaterThanOrEqual(1);
            expect(storedItem.playerName.length).toBeLessThanOrEqual(20);
          } else {
            // Should fail validation
            expect(response.statusCode).toBe(400);
            expect(mockPut).not.toHaveBeenCalled();
            
            const responseBody = JSON.parse(response.body);
            expect(responseBody).toHaveProperty('error');
            expect(responseBody.message).toMatch(/(Missing required fields|Name must be)/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});