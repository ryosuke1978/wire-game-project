// Jest setup file for Lambda tests

// Mock AWS SDK globally
jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn()
  }
}));

// Set default environment variables for tests
process.env.AWS_REGION = 'us-east-1';
process.env.TABLE_NAME = 'test-scores-table';