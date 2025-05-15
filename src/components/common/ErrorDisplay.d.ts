import { ReactNode } from 'react';
import { ErrorObject } from '../../utils/errorHandler';

interface ErrorDisplayProps {
  error: ErrorObject | string;
  onRetry?: () => void;
  className?: string;
  showRetry?: boolean;
  compact?: boolean;
}

declare const ErrorDisplay: React.FC<ErrorDisplayProps>;

export default ErrorDisplay;
