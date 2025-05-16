// API configuration file
// This file manages API endpoints for different environments

// Define the base API URL based on the environment
const getBaseApiUrl = () => {
  // For production, use the Deno Deploy URL
  if (import.meta.env.PROD) {
    return 'https://fininsight-api.deno.dev';
  }
  
  // For development, use the local Deno server
  return 'http://localhost:8000';
};

// API endpoints
export const API = {
  baseUrl: getBaseApiUrl(),
  endpoints: {
    // FinGenie Chat API
    fingenieChat: `${getBaseApiUrl()}/api/fingenieChat`,
    
    // Investment Report API
    getInvestmentReport: `${getBaseApiUrl()}/api/getInvestmentReport`,
    
    // FinGenie Oracle API
    finGenieOracle: `${getBaseApiUrl()}/api/finGenieOracle`,
  }
};

export default API;
