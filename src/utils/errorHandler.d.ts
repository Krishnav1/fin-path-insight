export const ERROR_TYPES: {
  NETWORK: string;
  SERVER: string;
  TIMEOUT: string;
  AUTH: string;
  VALIDATION: string;
  NOT_FOUND: string;
  UNKNOWN: string;
  API_LIMIT: string;
};

export const ERROR_MESSAGES: Record<string, string>;

export interface ErrorObject {
  type: string;
  message: string;
  context?: string;
  timestamp?: string;
}

export function categorizeError(error: any): string;
export function getUserMessage(error: any): string;
export function logError(error: any, context?: string): void;
export function handleError(error: any, context?: string): string;
export function createErrorResponse(error: any, context?: string): {
  success: boolean;
  error: ErrorObject;
};

declare const errorHandler: {
  ERROR_TYPES: typeof ERROR_TYPES;
  ERROR_MESSAGES: typeof ERROR_MESSAGES;
  categorizeError: typeof categorizeError;
  getUserMessage: typeof getUserMessage;
  logError: typeof logError;
  handleError: typeof handleError;
  createErrorResponse: typeof createErrorResponse;
};

export default errorHandler;
