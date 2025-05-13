/**
 * Centralized error handling utility for API requests
 */

// Error types for better categorization
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  AUTH: 'AUTHENTICATION_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// User-friendly error messages
const ErrorMessages = {
  [ErrorTypes.NETWORK]: 'Network connection error. Please check your internet connection.',
  [ErrorTypes.SERVER]: 'Server error. Our team has been notified.',
  [ErrorTypes.TIMEOUT]: 'Request timed out. Please try again.',
  [ErrorTypes.AUTH]: 'Authentication error. Please log in again.',
  [ErrorTypes.VALIDATION]: 'Invalid data provided. Please check your inputs.',
  [ErrorTypes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again later.'
};

/**
 * Categorize API errors by type
 * @param {Error} error - The error object from axios
 * @returns {Object} Categorized error with type, message, and details
 */
export const categorizeError = (error) => {
  let errorType = ErrorTypes.UNKNOWN;
  let errorDetails = {};

  if (error.message === 'Network Error') {
    errorType = ErrorTypes.NETWORK;
  } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    errorType = ErrorTypes.TIMEOUT;
  } else if (error.response) {
    // Server responded with an error status
    const { status, data } = error.response;
    
    errorDetails = {
      status,
      data,
      endpoint: error.config?.url || 'unknown'
    };

    if (status === 401 || status === 403) {
      errorType = ErrorTypes.AUTH;
    } else if (status === 404) {
      errorType = ErrorTypes.NOT_FOUND;
    } else if (status === 422 || status === 400) {
      errorType = ErrorTypes.VALIDATION;
    } else if (status >= 500) {
      errorType = ErrorTypes.SERVER;
    }
  }

  return {
    type: errorType,
    message: ErrorMessages[errorType],
    details: errorDetails,
    originalError: error
  };
};

/**
 * Log errors to console and potentially to a monitoring service
 * @param {Object} error - Categorized error object
 * @param {string} context - Where the error occurred
 */
export const logError = (error, context = 'API Request') => {
  console.error(`[${context}] ${error.message}`, {
    type: error.type,
    details: error.details,
    timestamp: new Date().toISOString()
  });

  // In production, you could send this to a monitoring service like Sentry
  if (import.meta.env.VITE_API_ENVIRONMENT === 'production') {
    // Example: Sentry.captureException(error.originalError, { extra: { context, ...error.details } });
    console.log('Error would be sent to monitoring service in production');
  }
};

/**
 * Handle API errors consistently across the application
 * @param {Error} error - The error from axios
 * @param {string} context - Where the error occurred
 * @returns {Object} Processed error with user-friendly message
 */
export const handleApiError = (error, context) => {
  const categorizedError = categorizeError(error);
  logError(categorizedError, context);
  return categorizedError;
};

/**
 * Add global axios interceptors for error handling
 * @param {AxiosInstance} axiosInstance - The axios instance to add interceptors to
 */
export const setupAxiosInterceptors = (axiosInstance) => {
  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      const categorizedError = categorizeError(error);
      logError(categorizedError, error.config?.url || 'API Request');
      return Promise.reject(categorizedError);
    }
  );
};
