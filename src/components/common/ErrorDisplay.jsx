import React from 'react';
import { ERROR_TYPES } from '../../utils/errorHandler';

/**
 * A reusable component to display errors with appropriate styling and retry functionality
 */
const ErrorDisplay = ({ 
  error, 
  onRetry, 
  className = '',
  showRetry = true,
  compact = false
}) => {
  // Determine error type and icon
  const errorType = error?.type || ERROR_TYPES.UNKNOWN;
  
  // Define icon based on error type
  let icon = '❌'; // Default error icon
  
  switch (errorType) {
    case ERROR_TYPES.NETWORK:
      icon = '🌐';
      break;
    case ERROR_TYPES.TIMEOUT:
      icon = '⏱️';
      break;
    case ERROR_TYPES.API_LIMIT:
      icon = '🚫';
      break;
    case ERROR_TYPES.NOT_FOUND:
      icon = '🔍';
      break;
    case ERROR_TYPES.SERVER:
      icon = '🖥️';
      break;
    default:
      icon = '❌';
  }
  
  // Get error message
  const message = error?.message || 'An unknown error occurred';
  
  // Compact version just shows an icon with tooltip
  if (compact) {
    return (
      <div 
        className={`inline-flex items-center text-red-600 ${className}`}
        title={message}
      >
        <span className="text-lg mr-1">{icon}</span>
        {showRetry && onRetry && (
          <button 
            onClick={onRetry}
            className="text-sm text-blue-500 hover:text-blue-700 ml-2"
            title="Retry"
          >
            🔄
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex items-start">
        <div className="text-2xl mr-3">{icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-red-800">
            {errorType === ERROR_TYPES.UNKNOWN ? 'Error' : errorType.charAt(0).toUpperCase() + errorType.slice(1) + ' Error'}
          </h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
          
          {/* Show additional context in development */}
          {import.meta.env.DEV && error?.context && (
            <p className="text-xs text-gray-500 mt-2">Context: {error.context}</p>
          )}
          
          {/* Show retry button if provided */}
          {showRetry && onRetry && (
            <button 
              onClick={onRetry}
              className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-800 font-medium py-1 px-3 rounded"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
