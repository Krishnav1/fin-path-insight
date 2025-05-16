// This file has been converted from a Next.js API route to a compatible format for Vite/React
// Import the necessary modules for your database connection

// Define the MarketData interface
interface MarketDataType {
  type: string;
  symbol?: string;
  name?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  lastUpdated: Date;
  [key: string]: any;
}

// Function to fetch market data from your API
export async function fetchMarketData(type?: string): Promise<MarketDataType[]> {
  try {
    // Use the Deno API endpoint instead of direct database access
    const apiUrl = import.meta.env.PROD 
      ? `https://finpath-api.deno.dev/api/market-data${type ? `?type=${type}` : ''}` 
      : `http://localhost:8000/api/market-data${type ? `?type=${type}` : ''}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    // Return empty array on error
    return [];
  }
}

// Export the MarketData type for use in other components
export type { MarketDataType };