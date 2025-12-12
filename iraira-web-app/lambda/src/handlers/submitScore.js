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
 * Validate input data for score submission
 * @param {Object} data - Input data to validate
 * @returns {Object} - Validated and sanitized data
 * @throws {Error} - If validation fails
 */
function validateInput(data) {
  const { playerName, score, difficulty } = data;
  
  // Validate required fields
  if (playerName === undefined || playerName === null || 
      score === undefined || score === null || 
      difficulty === undefined || difficulty === null) {
    throw new Error('Missing required fields: playerName, score, difficulty');
  }
  
  // Validate score
  if (typeof score !== 'number' || score < 0 || !Number.isFinite(score)) {
    throw new Error('Score must be a positive number');
  }
  
  // Validate difficulty
  const validDifficulties = ['easy', 'medium', 'hard', 'super-hard'];
  if (!validDifficulties.includes(difficulty)) {
    throw new Error(`Difficulty must be one of: ${validDifficulties.join(', ')}`);
  }
  
  // Sanitize and validate name
  const sanitizedName = sanitizeName(playerName);
  
  return {
    playerName: sanitizedName,
    score: Math.round(score), // Ensure integer score
    difficulty
  };
}

/**
 * Submit score Lambda handler
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.handler = async (event) => {
  console.log('Submit score request:', JSON.stringify({
    httpMethod: event.httpMethod,
    path: event.path,
    headers: event.headers,
    body: event.body ? 'present' : 'missing'
  }));
  
  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        })
      };
    }
    
    // Validate and sanitize input
    const validatedData = validateInput(requestBody);
    
    // Generate timestamp
    const timestamp = Date.now();
    
    // Prepare DynamoDB item
    const item = {
      difficulty: validatedData.difficulty,
      timestamp: timestamp,
      playerName: validatedData.playerName,
      score: validatedData.score
    };
    
    console.log('Storing score:', JSON.stringify({
      playerName: item.playerName,
      score: item.score,
      difficulty: item.difficulty,
      timestamp: item.timestamp
    }));
    
    // Store in DynamoDB
    const params = {
      TableName: TABLE_NAME,
      Item: item
    };
    
    await dynamodb.put(params).promise();
    
    console.log('Score stored successfully');
    
    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        message: 'Score submitted successfully',
        data: {
          playerName: item.playerName,
          score: item.score,
          difficulty: item.difficulty,
          timestamp: item.timestamp
        }
      })
    };
    
  } catch (error) {
    console.error('Error submitting score:', error);
    
    // Determine error type and status code
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error.message.includes('Missing required fields') || 
        error.message.includes('must be') ||
        error.message.includes('Difficulty must be') ||
        error.message.includes('Name must be')) {
      statusCode = 400;
      errorMessage = error.message;
    }
    
    return {
      statusCode: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({
        error: statusCode === 400 ? 'Validation Error' : 'Internal Server Error',
        message: errorMessage
      })
    };
  }
};