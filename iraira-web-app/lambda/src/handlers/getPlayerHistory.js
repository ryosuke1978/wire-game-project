const AWS = require('aws-sdk');

// DynamoDB client configuration
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  ...(process.env.DYNAMODB_ENDPOINT && { endpoint: process.env.DYNAMODB_ENDPOINT })
});

const TABLE_NAME = process.env.TABLE_NAME || 'wire-game-scores';

/**
 * Name sanitization function - removes all characters except alphanumeric, space, hyphen, underscore
 * @param {string} name - Input name to sanitize
 * @returns {string} - Sanitized name
 * @throws {Error} - If name is invalid after sanitization
 */
function sanitizeName(name) {
  if (typeof name !== 'string') {
    throw new Error('Name must be a string');
  }
  
  // Remove all characters except alphanumeric, space, hyphen, underscore
  const sanitized = name.replace(/[^a-zA-Z0-9 \-_]/g, '');
  
  // Trim whitespace
  const trimmed = sanitized.trim();
  
  // Validate length (1-20 characters)
  if (trimmed.length < 1 || trimmed.length > 20) {
    throw new Error('Name must be 1-20 characters after sanitization');
  }
  
  return trimmed;
}

/**
 * Validate query parameters for player history request
 * @param {Object} queryParams - Query parameters from API Gateway event
 * @returns {Object} - Validated parameters
 * @throws {Error} - If validation fails
 */
function validateQueryParams(queryParams) {
  const { playerName } = queryParams || {};
  
  // Validate playerName (required)
  if (!playerName) {
    throw new Error('playerName parameter is required');
  }
  
  // Handle empty string case
  if (playerName.trim() === '') {
    throw new Error('Name must be 1-20 characters after sanitization');
  }
  
  // Sanitize and validate player name
  const sanitizedName = sanitizeName(playerName);
  
  return {
    playerName: sanitizedName
  };
}

/**
 * Get player history Lambda handler
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.handler = async (event) => {
  console.log('Get player history request:', JSON.stringify({
    httpMethod: event.httpMethod,
    path: event.path,
    queryStringParameters: event.queryStringParameters
  }));
  
  try {
    // Validate query parameters
    const validatedParams = validateQueryParams(event.queryStringParameters);
    
    console.log('Querying player history:', JSON.stringify({
      playerName: validatedParams.playerName
    }));
    
    // Query DynamoDB GSI for scores by playerName
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'PlayerIndex',
      KeyConditionExpression: 'playerName = :playerName',
      ExpressionAttributeValues: {
        ':playerName': validatedParams.playerName
      },
      ScanIndexForward: true // Sort by timestamp ascending (chronological order - oldest first)
    };
    
    const result = await dynamodb.query(params).promise();
    
    console.log(`Found ${result.Items.length} scores for player ${validatedParams.playerName}`);
    
    // Format response data - exclude playerName from response as it's redundant
    const playerHistory = result.Items.map(item => ({
      score: item.score,
      difficulty: item.difficulty,
      timestamp: item.timestamp
    }));
    
    console.log(`Returning ${playerHistory.length} score entries`);
    
    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        message: 'Player history retrieved successfully',
        data: playerHistory,
        meta: {
          playerName: validatedParams.playerName,
          count: playerHistory.length
        }
      })
    };
    
  } catch (error) {
    console.error('Error getting player history:', error);
    
    // Determine error type and status code
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error.message.includes('playerName parameter is required') || 
        error.message.includes('Name must be')) {
      statusCode = 400;
      errorMessage = error.message;
    }
    
    return {
      statusCode: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        error: statusCode === 400 ? 'Validation Error' : 'Internal Server Error',
        message: errorMessage
      })
    };
  }
};