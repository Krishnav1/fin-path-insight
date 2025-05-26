/**
 * Edge Function Client
 * 
 * This is a centralized client for calling Supabase Edge Functions.
 * It ensures all calls include the proper authentication headers and
 * provides consistent error handling.
 */

import { supabase } from './supabase';

// Define error types for better handling
export enum EdgeFunctionErrorType {
  AUTHENTICATION = 'authentication',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  SERVER = 'server',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown'
}

export interface EdgeFunctionError {
  type: EdgeFunctionErrorType;
  status?: number;
  message: string;
  originalError?: any;
}

export interface EdgeFunctionResponse<T> {
  data: T | null;
  error: EdgeFunctionError | null;
}

// Default timeout for Edge Function calls (15 seconds)
const DEFAULT_TIMEOUT = 15000;

/**
 * Call a Supabase Edge Function with proper error handling
 */
export async function callEdgeFunction<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  options: {
    timeout?: number;
    retries?: number;
    customHeaders?: Record<string, string>;
  } = {}
): Promise<EdgeFunctionResponse<T>> {
  const { timeout = DEFAULT_TIMEOUT, retries = 0, customHeaders = {} } = options;
  
  try {
    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get the anon key from environment variables
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseAnonKey) {
      console.error('Missing Supabase anon key');
      return {
        data: null,
        error: {
          type: EdgeFunctionErrorType.AUTHENTICATION,
          message: 'Missing API key for authentication'
        }
      };
    }
    
    // Set up headers with authentication
    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      ...customHeaders
    };
    
    // Add Authorization header if we have a session
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    // Set up timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    console.log(`Calling Edge Function: ${endpoint}`, { method, headers: { ...headers, apikey: '[REDACTED]' } });
    
    // Make the API call
    const response = await fetch(endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error (${response.status}): ${response.statusText}`;
      
      try {
        // Try to parse error as JSON
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch (e) {
        // If not JSON, use the raw text
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      console.error(`Edge Function Error: ${errorMessage}`, { endpoint, status: response.status });
      
      // Determine error type based on status code
      let errorType = EdgeFunctionErrorType.UNKNOWN;
      if (response.status === 401 || response.status === 403) {
        errorType = EdgeFunctionErrorType.AUTHENTICATION;
      } else if (response.status >= 400 && response.status < 500) {
        errorType = EdgeFunctionErrorType.VALIDATION;
      } else if (response.status >= 500) {
        errorType = EdgeFunctionErrorType.SERVER;
      }
      
      return {
        data: null,
        error: {
          type: errorType,
          status: response.status,
          message: errorMessage
        }
      };
    }
    
    // Parse successful response
    const data = await response.json();
    return { data, error: null };
    
  } catch (error: any) {
    // Handle different error types
    console.error(`Edge Function call failed: ${error.message}`, { endpoint, error });
    
    let errorType = EdgeFunctionErrorType.UNKNOWN;
    let errorMessage = 'An unexpected error occurred';
    
    if (error.name === 'AbortError') {
      errorType = EdgeFunctionErrorType.TIMEOUT;
      errorMessage = `Request timed out after ${timeout}ms`;
    } else if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
      errorType = EdgeFunctionErrorType.NETWORK;
      errorMessage = 'Network connection error. Please check your internet connection.';
    }
    
    // If we have retries left, try again
    if (retries > 0) {
      console.log(`Retrying Edge Function call (${retries} retries left)...`);
      return callEdgeFunction<T>(endpoint, method, body, {
        ...options,
        retries: retries - 1
      });
    }
    
    return {
      data: null,
      error: {
        type: errorType,
        message: errorMessage,
        originalError: error
      }
    };
  }
}
