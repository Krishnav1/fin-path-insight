// API Configuration for Supabase Edge Functions
// This file centralizes all API endpoints for the application

// Supabase project URL - replace with your actual Supabase project URL
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';

// Supabase API endpoints
export const API_ENDPOINTS = {
  // Edge Function endpoints
  ANALYZE_PORTFOLIO: `${SUPABASE_URL}/functions/v1/analyze-portfolio`,
  MARKET_DATA: `${SUPABASE_URL}/functions/v1/market-data`,
  EODHD_PROXY: `${SUPABASE_URL}/functions/v1/eodhd-proxy`,
  EODHD_FUNDAMENTALS: `${SUPABASE_URL}/functions/v1/eodhd-fundamentals`,
  EODHD_REALTIME: `${SUPABASE_URL}/functions/v1/eodhd-realtime`,
  FINGENIE_CHAT: `${SUPABASE_URL}/functions/v1/fingenie-chat`,
  FINGENIE_ORACLE: `${SUPABASE_URL}/functions/v1/fingenie-oracle`,
  INVESTMENT_REPORT: `${SUPABASE_URL}/functions/v1/investment-report`,
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

// Helper function to make API calls to Supabase Edge Functions
export const callEdgeFunction = async (endpoint: string, method: string = 'GET', body?: any) => {
  try {
    const response = await fetch(endpoint, {
      method,
      headers: getSupabaseHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling edge function at ${endpoint}:`, error);
    throw error;
  }
};
