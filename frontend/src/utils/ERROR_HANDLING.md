# Error Handling System Documentation

This document explains the error handling system implemented in the FinPath Insight application.

## Overview

The error handling system provides a centralized way to handle API errors consistently across the application. It includes:

1. **Error categorization** - Classifies errors into specific types
2. **User-friendly messages** - Provides readable messages for each error type
3. **Error logging** - Logs errors with contextual information
4. **Reusable display component** - Shows errors with appropriate styling and retry options

## Components

### 1. Error Handler Utility (`errorHandler.js`)

The core utility that handles error categorization and processing:

```javascript
// Import in your component or service
import { handleApiError, ErrorTypes } from '../utils/errorHandler';
```

#### Error Types

The system categorizes errors into the following types:

- `NETWORK_ERROR` - Connection issues
- `SERVER_ERROR` - Backend server errors (500 range)
- `TIMEOUT_ERROR` - Request timeouts
- `AUTHENTICATION_ERROR` - Auth issues (401, 403)
- `VALIDATION_ERROR` - Invalid data (400, 422)
- `NOT_FOUND_ERROR` - Resource not found (404)
- `UNKNOWN_ERROR` - Uncategorized errors

#### Main Functions

- `categorizeError(error)` - Categorizes an error by type
- `logError(error, context)` - Logs error with context
- `handleApiError(error, context)` - Main function to process errors
- `setupAxiosInterceptors(axiosInstance)` - Sets up global error handling

### 2. Error Display Component (`ErrorDisplay.jsx`)

A reusable React component to display errors with appropriate styling:

```javascript
// Import in your component
import ErrorDisplay from '../common/ErrorDisplay';

// Use in your JSX
<ErrorDisplay 
  error={error} 
  onRetry={() => fetchData()} 
  className="custom-error-class"
/>
```

## Implementation Examples

### In API Services

```javascript
// Example from fastApiService.js
try {
  const response = await fastApiClient.get('/api/endpoint');
  return response.data;
} catch (error) {
  const processedError = handleApiError(error, 'Error fetching data');
  throw processedError;
}
```

### In React Components

```javascript
// Example component with error handling
const MyComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getData();
      setData(response);
    } catch (err) {
      setError(err); // Already processed by handleApiError
    } finally {
      setLoading(false);
    }
  };

  // In your JSX
  if (error) {
    return <ErrorDisplay error={error} onRetry={fetchData} />;
  }
  
  // Rest of component...
}
```

## Best Practices

1. **Always use the error handler** - Use `handleApiError` for all API calls
2. **Provide context** - Include meaningful context when calling `handleApiError`
3. **Include retry functionality** - When appropriate, provide a retry function
4. **Log appropriately** - Don't duplicate logs; the handler already logs errors
5. **Use environment-specific logging** - Production errors can be sent to monitoring services

## Environment Configuration

The error handling system behaves differently based on the environment:

- **Development**: Detailed error logging to console
- **Production**: More concise logs, potential integration with monitoring services

This is controlled by the `VITE_API_ENVIRONMENT` environment variable.

## Extending the System

To add new error types or customize error messages:

1. Add new types to the `ErrorTypes` object in `errorHandler.js`
2. Add corresponding messages to the `ErrorMessages` object
3. Update the categorization logic in `categorizeError` if needed
4. Update the `ErrorDisplay` component to handle the new error types

## Integration with Monitoring Services

For production, you can integrate with error monitoring services like Sentry:

```javascript
// In errorHandler.js, uncomment and configure:
if (import.meta.env.VITE_API_ENVIRONMENT === 'production') {
  Sentry.captureException(error.originalError, { 
    extra: { context, ...error.details } 
  });
}
```
