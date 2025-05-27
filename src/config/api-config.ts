// API Configuration for Supabase Edge Functions
// This file centralizes all API endpoints for the application

// Supabase project URL - using your actual Supabase project URL
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ydakwyplcqoshxcdllah.supabase.co';

// Supabase API endpoints
export const API_ENDPOINTS = {
  // Base URL
  SUPABASE_URL: SUPABASE_URL,
  
  // Edge Function endpoints
  ANALYZE_PORTFOLIO: `${SUPABASE_URL}/functions/v1/analyze-portfolio`,
  MARKET_DATA: `${SUPABASE_URL}/functions/v1/market-data`,
  EODHD_PROXY: `${SUPABASE_URL}/functions/v1/eodhd-proxy`,
  EODHD_FUNDAMENTALS: `${SUPABASE_URL}/functions/v1/eodhd-fundamentals`,
  EODHD_REALTIME: `${SUPABASE_URL}/functions/v1/eodhd-realtime`,
  FINGENIE_CHAT: `${SUPABASE_URL}/functions/v1/fingenie-chat`,
  FINGENIE_ORACLE: `${SUPABASE_URL}/functions/v1/fingenie-oracle`,
  INVESTMENT_REPORT: `${SUPABASE_URL}/functions/v1/investment-report`,
  COMPANY_DATA_INGEST: `${SUPABASE_URL}/functions/v1/company-data-ingest`,
  REFRESH_COMPANY_DATA: `${SUPABASE_URL}/functions/v1/refresh-company-data`,
};

// API Keys - these should be stored in environment variables
export const API_KEYS = {
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
  EODHD_API_KEY: import.meta.env.VITE_EODHD_API_KEY || '',
  ALPHA_VANTAGE_API_KEY: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '',
};

// Headers for Supabase Edge Function calls
export const getSupabaseHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
  };
};

// NOTE: Do not use this function directly. Use the centralized edge-function-client.ts instead.
// This is kept for backward compatibility only.
// @deprecated - Use callEdgeFunction from @/lib/edge-function-client instead
export const callEdgeFunction = async (endpoint: string, method: string = 'GET', body?: any) => {
  console.warn(
    'DEPRECATED: Using old callEdgeFunction. Please update to use the new edge-function-client.ts instead.'
  );
  
  const { callEdgeFunction: newCallEdgeFunction } = await import('@/lib/edge-function-client');
  const result = await newCallEdgeFunction(endpoint, method as any, body);
  
  if (result.error) {
    throw new Error(result.error.message);
  }
  
  return result.data;
};
