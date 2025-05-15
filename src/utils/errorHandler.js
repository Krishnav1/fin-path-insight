/**
 * Central Error Handler for FinPath Insight
 * Provides standardized error handling across the application
 */

// Error types for categorization
export const ERROR_TYPES = {
  NETWORK: 'network',
  SERVER: 'server',
  TIMEOUT: 'timeout',
  AUTH: 'auth',
  VALIDATION: 'validation',
  NOT_FOUND: 'not_found',
  UNKNOWN: 'unknown',
  API_LIMIT: 'api_limit'
};

// Error messages for user display
export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Network connection error. Please check your internet connection.',
  [ERROR_TYPES.SERVER]: 'Server error. Our team has been notified.',
  [ERROR_TYPES.TIMEOUT]: 'Request timed out. Please try again.',
  [ERROR_TYPES.AUTH]: 'Authentication error. Please log in again.',
  [ERROR_TYPES.VALIDATION]: 'Invalid data provided. Please check your inputs.',
  [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_TYPES.API_LIMIT]: 'API rate limit exceeded. Please try again later.',
  [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

/**
 * Categorize an error based on its properties
 * @param {Error} error - The error object
 * @returns {string} The error type
 */
export function categorizeError(error) {
  if (!error) return ERROR_TYPES.UNKNOWN;
  
  // Check if it's an Axios error
  if (error.isAxiosError) {
    if (!error.response) {
      // Network error or timeout
      return error.code === 'ECONNABORTED' ? ERROR_TYPES.TIMEOUT : ERROR_TYPES.NETWORK;
    }
    
    // Server errors
    const status = error.response.status;
    if (status >= 500) return ERROR_TYPES.SERVER;
    if (status === 404) return ERROR_TYPES.NOT_FOUND;
    if (status === 401 || status === 403) return ERROR_TYPES.AUTH;
    if (status === 429) return ERROR_TYPES.API_LIMIT;
    if (status === 400) return ERROR_TYPES.VALIDATION;
  }
  
  // Check error message for common patterns
  const message = error.message ? error.message.toLowerCase() : '';
  if (message.includes('network') || message.includes('connection')) return ERROR_TYPES.NETWORK;
  if (message.includes('timeout')) return ERROR_TYPES.TIMEOUT;
  if (message.includes('not found')) return ERROR_TYPES.NOT_FOUND;
  if (message.includes('unauthorized') || message.includes('forbidden')) return ERROR_TYPES.AUTH;
  if (message.includes('rate limit') || message.includes('too many requests')) return ERROR_TYPES.API_LIMIT;
  
  return ERROR_TYPES.UNKNOWN;
}

/**
 * Get a user-friendly error message
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export function getUserMessage(error) {
  const type = categorizeError(error);
  return ERROR_MESSAGES[type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
}

/**
 * Log an error with context
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred
 */
export function logError(error, context = '') {
  const type = categorizeError(error);
  const timestamp = new Date().toISOString();
  
  // In production, we could send this to a monitoring service like Sentry
  console.error(`[${timestamp}] [${type}] ${context}: ${error.message}`);
  
  if (error.response) {
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
  }
  
  if (error.request) {
    console.error('Request:', error.request);
  }
  
  // Log stack trace in development only
  if (process.env.NODE_ENV !== 'production') {
    console.error(error.stack);
  }
  
  // In a real production app, we would send this to a monitoring service
  if (import.meta.env.VITE_ENABLE_ERROR_MONITORING === 'true') {
    // Send to monitoring service (example implementation)
    // sendToMonitoringService(error, type, context);
  }
}

/**
 * Handle an error completely - log it and return user message
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred
 * @returns {string} User-friendly error message
 */
export function handleError(error, context = '') {
  logError(error, context);
  return getUserMessage(error);
}

/**
 * Create a standardized error response object
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred
 * @returns {Object} Standardized error response
 */
export function createErrorResponse(error, context = '') {
  const type = categorizeError(error);
  const message = getUserMessage(error);
  
  logError(error, context);
  
  return {
    success: false,
    error: {
      type,
      message,
      context,
      timestamp: new Date().toISOString()
    }
  };
}

export default {
  ERROR_TYPES,
  ERROR_MESSAGES,
  categorizeError,
  getUserMessage,
  logError,
  handleError,
  createErrorResponse
};
