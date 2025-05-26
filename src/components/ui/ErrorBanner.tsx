import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EdgeFunctionErrorType } from '@/lib/edge-function-client';

interface ErrorBannerProps {
  title?: string;
  message: string;
  errorType?: EdgeFunctionErrorType;
  onDismiss?: () => void;
  onRetry?: () => void;
}

/**
 * A reusable error banner component that displays user-friendly error messages
 * with appropriate actions based on the error type.
 */
export function ErrorBanner({ 
  title, 
  message, 
  errorType = EdgeFunctionErrorType.UNKNOWN,
  onDismiss,
  onRetry
}: ErrorBannerProps) {
  // Get appropriate title based on error type if not provided
  const errorTitle = title || getErrorTitle(errorType);
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <div className="flex-1">
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </div>
      <div className="flex gap-2">
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="h-8 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
        {onDismiss && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDismiss}
            className="h-8 px-2 text-xs"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  );
}

// Helper function to get appropriate title based on error type
function getErrorTitle(errorType: EdgeFunctionErrorType): string {
  switch (errorType) {
    case EdgeFunctionErrorType.AUTHENTICATION:
      return 'Authentication Error';
    case EdgeFunctionErrorType.NETWORK:
      return 'Network Error';
    case EdgeFunctionErrorType.TIMEOUT:
      return 'Request Timeout';
    case EdgeFunctionErrorType.SERVER:
      return 'Server Error';
    case EdgeFunctionErrorType.VALIDATION:
      return 'Validation Error';
    default:
      return 'Error';
  }
}
