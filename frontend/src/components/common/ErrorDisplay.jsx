import React from 'react';
import { ErrorTypes } from '../../utils/errorHandler';

/**
 * A reusable error display component that shows appropriate messages based on error type
 */
const ErrorDisplay = ({ error, onRetry, className = '' }) => {
  if (!error) return null;

  // Default to unknown error if no type is provided
  const errorType = error.type || ErrorTypes.UNKNOWN;
  
  // Determine appropriate icon based on error type
  let icon = '⚠️';
  if (errorType === ErrorTypes.NETWORK) icon = '🌐';
  if (errorType === ErrorTypes.TIMEOUT) icon = '⏱️';
  if (errorType === ErrorTypes.AUTH) icon = '🔒';
  if (errorType === ErrorTypes.NOT_FOUND) icon = '🔍';
  if (errorType === ErrorTypes.SERVER) icon = '🖥️';

  return (
    <div className={`error-display error-${errorType.toLowerCase()} ${className}`}>
      <div className="error-icon">{icon}</div>
      <div className="error-content">
        <h3 className="error-title">{error.message || 'An error occurred'}</h3>
        {error.details?.status && (
          <p className="error-status">Status: {error.details.status}</p>
        )}
        {error.details?.data?.message && (
          <p className="error-detail">{error.details.data.message}</p>
        )}
        {onRetry && (
          <button 
            className="error-retry-button"
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
