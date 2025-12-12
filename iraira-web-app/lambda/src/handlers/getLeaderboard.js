const AWS = require('aws-sdk');

// DynamoDB client configuration
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
  ...(process.env.DYNAMODB_ENDPOINT && { endpoint: process.env.DYNAMODB_ENDPOINT })
});

const TABLE_NAME = process.env.TABLE_NAME || 'wire-game-scores';

/**
 * Validate query parameters for leaderboard request
 * @param {Object} queryParams - Query parameters from API Gateway event
 * @returns {Object} - Validated parameters
 * @throws {Error} - If validation fails
 */
function validateQueryParams(queryParams) {
  const { difficulty, limit } = queryParams || {};
  
  // Validate difficulty (required)
  const validDifficulties = ['easy', 'medium', 'hard', 'super-hard'];
  if (!difficulty || !validDifficulties.includes(difficulty)) {
    throw new Error(`Difficulty parameter is required and must be one of: ${validDifficulties.join(', ')}`);
  }
  
  // Validate limit (optional, default to 10)
  let parsedLimit = 10;
  if (limit) {
    parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      throw new Error('Limit must be a number between 1 and 100');
    }
  }
  
  return {
    difficulty,
    limit: parsedLimit
  };
}

/**
 * Get leaderboard Lambda handler
 * @param {Object} event - API Gateway event
 * @returns {Object} - API Gateway response
 */
exports.handler = async (event) => {
  console.log('Get leaderboard request:', JSON.stringify({
    httpMethod: event.httpMethod,
    path: event.path,
    queryStringParameters: event.queryStringParameters
  }));
  
  try {
    // Validate query parameters
    const validatedParams = validateQueryParams(event.queryStringParameters);
    
    console.log('Querying leaderboard:', JSON.stringify({
      difficulty: validatedParams.difficulty,
      limit: validatedParams.limit
    }));
    
    // Query DynamoDB for scores by difficulty
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'difficulty = :difficulty',
      ExpressionAttributeValues: {
        ':difficulty': validatedParams.difficulty
      },
      ScanIndexForward: true, // Sort by timestamp ascending (oldest first)
      Limit: validatedParams.limit * 10 // Get more items to sort by score
    };
    
    const result = await dynamodb.query(params).promise();
    
    console.log(`Found ${result.Items.length} scores for difficulty ${validatedParams.difficulty}`);
    
    // Sort by score (ascending - lower scores are better) and limit to top scores
    const topScores = result.Items
      .sort((a, b) => a.score - b.score) // Sort by score ascending (best times first)
      .slice(0, validatedParams.limit) // Take only the requested number of top scores
      .map(item => ({
        playerName: item.playerName,
        score: item.score,
        difficulty: item.difficulty,
        timestamp: item.timestamp
      }));
    
    console.log(`Returning top ${topScores.length} scores`);
    
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
        message: 'Leaderboard retrieved successfully',
        data: topScores,
        meta: {
          difficulty: validatedParams.difficulty,
          count: topScores.length,
          limit: validatedParams.limit
        }
      })
    };
    
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    
    // Determine error type and status code
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error.message.includes('Difficulty parameter is required') || 
        error.message.includes('must be one of') ||
        error.message.includes('Limit must be')) {
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