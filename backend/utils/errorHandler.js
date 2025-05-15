/**
 * Error Handler Utility for FinPath Insight Backend
 * 
 * This module provides centralized error handling functionality for the backend,
 * including error categorization, logging, and formatting for consistent error responses.
 */

// Error types for categorization
const ERROR_TYPES = {
  NETWORK: 'Network',
  SERVER: 'Server',
  DATABASE: 'Database',
  VALIDATION: 'Validation',
  AUTHENTICATION: 'Authentication',
  AUTHORIZATION: 'Authorization',
  TIMEOUT: 'Timeout',
  NOT_FOUND: 'NotFound',
  RATE_LIMIT: 'RateLimit',
  EXTERNAL_API: 'ExternalAPI',
  SUPABASE: 'Supabase',
  UNKNOWN: 'Unknown'
};

/**
 * Maps Supabase error codes to error types
 */
const SUPABASE_ERROR_TYPES = {
  'PGRST116': ERROR_TYPES.NOT_FOUND, // No rows returned
  'PGRST301': ERROR_TYPES.VALIDATION, // Failed to parse JSON
  'PGRST302': ERROR_TYPES.VALIDATION, // Failed to parse JSON array
  'PGRST401': ERROR_TYPES.AUTHENTICATION, // JWT verification error
  'PGRST402': ERROR_TYPES.AUTHORIZATION, // JWT claim invalid
  '23505': ERROR_TYPES.VALIDATION, // Unique violation
  '22P02': ERROR_TYPES.VALIDATION, // Invalid text representation
  '23503': ERROR_TYPES.VALIDATION, // Foreign key violation
  '23514': ERROR_TYPES.VALIDATION, // Check violation
  '42P01': ERROR_TYPES.DATABASE, // Relation does not exist
  '42501': ERROR_TYPES.AUTHORIZATION, // Insufficient privilege
  '42601': ERROR_TYPES.VALIDATION, // Syntax error
  '42703': ERROR_TYPES.VALIDATION, // Undefined column
  '42P02': ERROR_TYPES.VALIDATION, // Undefined parameter
};

/**
 * Determines the error type based on the error object
 * @param {Error} error - The error object
 * @param {string} defaultType - Default error type if not determined
 * @returns {string} - The error type
 */
function determineErrorType(error, defaultType = ERROR_TYPES.UNKNOWN) {
  if (!error) return defaultType;

  // Check for Supabase errors
  if (error.code && SUPABASE_ERROR_TYPES[error.code]) {
    return SUPABASE_ERROR_TYPES[error.code];
  }

  // Check for network errors
  if (error.message && (
    error.message.includes('network') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ENOTFOUND')
  )) {
    return ERROR_TYPES.NETWORK;
  }

  // Check for timeout errors
  if (error.message && (
    error.message.includes('timeout') ||
    error.message.includes('ETIMEDOUT')
  )) {
    return ERROR_TYPES.TIMEOUT;
  }

  // Check for not found errors
  if (error.status === 404 || (error.message && error.message.includes('not found'))) {
    return ERROR_TYPES.NOT_FOUND;
  }

  // Check for authentication errors
  if (error.status === 401 || (error.message && (
    error.message.includes('unauthorized') ||
    error.message.includes('authentication') ||
    error.message.includes('auth')
  ))) {
    return ERROR_TYPES.AUTHENTICATION;
  }

  // Check for authorization errors
  if (error.status === 403 || (error.message && (
    error.message.includes('forbidden') ||
    error.message.includes('permission')
  ))) {
    return ERROR_TYPES.AUTHORIZATION;
  }

  // Check for rate limit errors
  if (error.status === 429 || (error.message && error.message.includes('rate limit'))) {
    return ERROR_TYPES.RATE_LIMIT;
  }

  // Check for server errors
  if (error.status && error.status >= 500) {
    return ERROR_TYPES.SERVER;
  }

  // Check for validation errors
  if (error.status === 400 || (error.message && (
    error.message.includes('validation') ||
    error.message.includes('invalid')
  ))) {
    return ERROR_TYPES.VALIDATION;
  }

  return defaultType;
}

/**
 * Creates a user-friendly error message based on the error type
 * @param {string} errorType - The error type
 * @param {string} customMessage - Custom error message
 * @returns {string} - User-friendly error message
 */
function createUserFriendlyMessage(errorType, customMessage) {
  if (customMessage) return customMessage;

  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      return 'Network error occurred. Please check your internet connection and try again.';
    case ERROR_TYPES.SERVER:
      return 'Server error occurred. Our team has been notified and is working on a fix.';
    case ERROR_TYPES.DATABASE:
      return 'Database error occurred. Please try again later.';
    case ERROR_TYPES.VALIDATION:
      return 'Invalid data provided. Please check your input and try again.';
    case ERROR_TYPES.AUTHENTICATION:
      return 'Authentication failed. Please log in again.';
    case ERROR_TYPES.AUTHORIZATION:
      return 'You do not have permission to perform this action.';
    case ERROR_TYPES.TIMEOUT:
      return 'Request timed out. Please try again later.';
    case ERROR_TYPES.NOT_FOUND:
      return 'The requested resource was not found.';
    case ERROR_TYPES.RATE_LIMIT:
      return 'Too many requests. Please try again later.';
    case ERROR_TYPES.EXTERNAL_API:
      return 'Error communicating with external service. Please try again later.';
    case ERROR_TYPES.SUPABASE:
      return 'Database service error. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
}

/**
 * Logs the error with appropriate severity level
 * @param {Error} error - The error object
 * @param {string} errorType - The error type
 * @param {string} context - The context where the error occurred
 */
function logError(error, errorType, context) {
  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    type: errorType,
    context,
    message: error.message,
    stack: error.stack,
    details: error.details || error.data || {}
  };

  // Log to console with appropriate severity
  if (
    errorType === ERROR_TYPES.SERVER ||
    errorType === ERROR_TYPES.DATABASE ||
    errorType === ERROR_TYPES.SUPABASE
  ) {
    console.error('[ERROR]', JSON.stringify(errorDetails, null, 2));
  } else if (
    errorType === ERROR_TYPES.NETWORK ||
    errorType === ERROR_TYPES.TIMEOUT ||
    errorType === ERROR_TYPES.EXTERNAL_API
  ) {
    console.warn('[WARNING]', JSON.stringify(errorDetails, null, 2));
  } else {
    console.info('[INFO]', JSON.stringify(errorDetails, null, 2));
  }

  // In production, you might want to send critical errors to a monitoring service
  if (process.env.NODE_ENV === 'production' && 
      (errorType === ERROR_TYPES.SERVER || errorType === ERROR_TYPES.DATABASE)) {
    // TODO: Send to monitoring service like Sentry
  }
}

/**
 * Main error handler function
 * @param {Error} error - The error object
 * @param {string} context - The context where the error occurred
 * @param {string} customMessage - Custom error message for the user
 * @returns {Object} - Standardized error object
 */
export function handleError(error, context = 'General', customMessage = '') {
  // Determine error type
  const errorType = determineErrorType(error, context === 'Database' ? ERROR_TYPES.DATABASE : ERROR_TYPES.UNKNOWN);
  
  // Create user-friendly message
  const userMessage = createUserFriendlyMessage(errorType, customMessage);
  
  // Log the error
  logError(error, errorType, context);
  
  // Create standardized error object
  const standardError = new Error(userMessage);
  standardError.type = errorType;
  standardError.context = context;
  standardError.originalError = error;
  standardError.timestamp = new Date().toISOString();
  standardError.statusCode = error.status || error.statusCode || getStatusCodeForErrorType(errorType);
  
  return standardError;
}

/**
 * Gets HTTP status code for error type
 * @param {string} errorType - The error type
 * @returns {number} - HTTP status code
 */
function getStatusCodeForErrorType(errorType) {
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      return 503; // Service Unavailable
    case ERROR_TYPES.SERVER:
      return 500; // Internal Server Error
    case ERROR_TYPES.DATABASE:
    case ERROR_TYPES.SUPABASE:
      return 500; // Internal Server Error
    case ERROR_TYPES.VALIDATION:
      return 400; // Bad Request
    case ERROR_TYPES.AUTHENTICATION:
      return 401; // Unauthorized
    case ERROR_TYPES.AUTHORIZATION:
      return 403; // Forbidden
    case ERROR_TYPES.TIMEOUT:
      return 504; // Gateway Timeout
    case ERROR_TYPES.NOT_FOUND:
      return 404; // Not Found
    case ERROR_TYPES.RATE_LIMIT:
      return 429; // Too Many Requests
    case ERROR_TYPES.EXTERNAL_API:
      return 502; // Bad Gateway
    default:
      return 500; // Internal Server Error
  }
}

/**
 * Creates a standardized error response for API endpoints
 * @param {Error} error - The error object
 * @param {Object} res - Express response object
 */
export function sendErrorResponse(error, res) {
  // If error is not handled by our handler, process it
  if (!error.type) {
    error = handleError(error);
  }
  
  // Send standardized response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      type: error.type,
      message: error.message,
      context: error.context,
      timestamp: error.timestamp
    }
  });
}

export default {
  ERROR_TYPES,
  handleError,
  sendErrorResponse
};
