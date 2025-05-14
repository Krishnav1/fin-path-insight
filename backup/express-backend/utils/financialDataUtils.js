// backend/utils/financialDataUtils.js
// Utility functions for fetching real-time financial data

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configure dotenv to load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Alpha Vantage API key
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';

/**
 * Extract stock symbols from user query using regex
 * @param {string} query - User query
 * @returns {Array} - Array of extracted stock symbols
 */
export function extractStockSymbols(query) {
  // Common Indian stock symbols and indices
  const indianStockRegex = /\b(NIFTY|SENSEX|TCS|INFY|RELIANCE|HDFCBANK|ICICIBANK|SBI|HDFC|BAJFINANCE|BHARTIARTL|ITC|KOTAKBANK|LT|M&M|MARUTI|ONGC|SUNPHARMA|TATAMOTORS|TATASTEEL|WIPRO)\b/gi;
  
  // US stock symbols (common ones)
  const usStockRegex = /\b(AAPL|MSFT|GOOGL|AMZN|META|TSLA|NVDA|JPM|V|JNJ|WMT|PG|BAC|MA|DIS|NFLX|INTC|VZ|KO|PEP|T|CSCO|ORCL|IBM)\b/gi;
  
  // Mutual fund regex (simplified)
  const mutualFundRegex = /\b(SBI|HDFC|ICICI|AXIS|UTI|KOTAK|ADITYA BIRLA|NIPPON INDIA|DSP|TATA|FRANKLIN|IDFC)\s+(MUTUAL FUND|MF|SMALL CAP|LARGE CAP|MID CAP|EQUITY|DEBT|HYBRID|BALANCED|INDEX|ETF)\b/gi;
  
  // Extract all matches
  const indianStocks = [...query.matchAll(indianStockRegex)].map(match => match[0].toUpperCase());
  const usStocks = [...query.matchAll(usStockRegex)].map(match => match[0].toUpperCase());
  const mutualFunds = [...query.matchAll(mutualFundRegex)].map(match => match[0]);
  
  // Combine all matches and remove duplicates
  const allSymbols = [...new Set([...indianStocks, ...usStocks, ...mutualFunds])];
  
  return allSymbols;
}

/**
 * Fetch stock data from Alpha Vantage API
 * @param {string} symbol - Stock symbol
 * @returns {Promise<Object>} - Stock data
 */
export async function fetchStockData(symbol) {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.error('Alpha Vantage API key not found');
    return null;
  }
  
  try {
    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });
    
    if (response.data && response.data['Global Quote']) {
      return response.data['Global Quote'];
    } else {
      console.error('Invalid response from Alpha Vantage API:', response.data);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch mutual fund data from Alpha Vantage API
 * @param {string} symbol - Mutual fund symbol
 * @returns {Promise<Object>} - Mutual fund data
 */
export async function fetchMutualFundData(symbol) {
  // For now, this is a placeholder as Alpha Vantage doesn't directly support Indian mutual funds
  // We would need to use a specialized API for Indian mutual funds
  return {
    name: symbol,
    message: "Detailed mutual fund data requires a specialized Indian financial data API."
  };
}

/**
 * Fetch Indian market data (NIFTY, SENSEX)
 * @returns {Promise<Object>} - Indian market data
 */
export async function fetchIndianMarketData() {
  try {
    // Fetch NIFTY data
    const niftyResponse = await fetchStockData('NIFTY');
    
    // Fetch SENSEX data
    const sensexResponse = await fetchStockData('SENSEX');
    
    return {
      nifty: niftyResponse,
      sensex: sensexResponse
    };
  } catch (error) {
    console.error('Error fetching Indian market data:', error);
    return null;
  }
}

/**
 * Fetch financial news headlines
 * @param {string} symbol - Optional stock symbol to filter news
 * @returns {Promise<Array>} - Array of news headlines
 */
export async function fetchFinancialNews(symbol = '') {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.error('Alpha Vantage API key not found');
    return [];
  }
  
  try {
    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'NEWS_SENTIMENT',
        tickers: symbol || undefined,
        topics: symbol ? undefined : 'financial_markets',
        limit: 5,
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });
    
    if (response.data && response.data.feed) {
      return response.data.feed.map(item => ({
        title: item.title,
        summary: item.summary,
        url: item.url,
        time_published: item.time_published,
        sentiment: item.overall_sentiment_label
      }));
    } else {
      console.error('Invalid response from Alpha Vantage News API:', response.data);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching financial news:`, error);
    return [];
  }
}

/**
 * Get real-time financial data based on user query
 * @param {string} query - User query
 * @returns {Promise<Object>} - Financial data relevant to the query
 */
export async function getRealtimeFinancialData(query) {
  // Extract stock symbols from query
  const symbols = extractStockSymbols(query);
  
  if (symbols.length === 0) {
    // If no specific symbols found, return general market data
    try {
      const marketData = await fetchIndianMarketData();
      const newsData = await fetchFinancialNews();
      
      return {
        marketData,
        newsData,
        symbols: []
      };
    } catch (error) {
      console.error('Error fetching general market data:', error);
      return null;
    }
  }
  
  // Process each symbol
  const results = {};
  for (const symbol of symbols) {
    try {
      // Check if it's a mutual fund
      if (symbol.includes('MUTUAL FUND') || symbol.includes('MF')) {
        results[symbol] = await fetchMutualFundData(symbol);
      } else {
        // Assume it's a stock
        results[symbol] = await fetchStockData(symbol);
      }
    } catch (error) {
      console.error(`Error processing symbol ${symbol}:`, error);
      results[symbol] = { error: 'Failed to fetch data' };
    }
  }
  
  // Get relevant news for the first symbol (to avoid API rate limits)
  let newsData = [];
  if (symbols.length > 0) {
    try {
      newsData = await fetchFinancialNews(symbols[0]);
    } catch (error) {
      console.error(`Error fetching news for ${symbols[0]}:`, error);
    }
  }
  
  return {
    symbolData: results,
    newsData,
    symbols
  };
}

/**
 * Format financial data for inclusion in AI prompt
 * @param {Object} financialData - Financial data object
 * @returns {string} - Formatted financial data string
 */
export function formatFinancialDataForPrompt(financialData) {
  if (!financialData) return '';
  
  let formattedData = '--- REAL-TIME FINANCIAL DATA ---\n\n';
  
  // Format market data if available
  if (financialData.marketData) {
    formattedData += 'MARKET OVERVIEW:\n';
    
    if (financialData.marketData.nifty) {
      formattedData += `NIFTY: ${financialData.marketData.nifty['05. price']} (${financialData.marketData.nifty['09. change']} / ${financialData.marketData.nifty['10. change percent']})\n`;
    }
    
    if (financialData.marketData.sensex) {
      formattedData += `SENSEX: ${financialData.marketData.sensex['05. price']} (${financialData.marketData.sensex['09. change']} / ${financialData.marketData.sensex['10. change percent']})\n`;
    }
    
    formattedData += '\n';
  }
  
  // Format symbol data if available
  if (financialData.symbolData && Object.keys(financialData.symbolData).length > 0) {
    formattedData += 'SYMBOL DATA:\n';
    
    for (const [symbol, data] of Object.entries(financialData.symbolData)) {
      if (data && data['05. price']) {
        formattedData += `${symbol}: Price: ${data['05. price']} | Change: ${data['09. change']} (${data['10. change percent']}) | Volume: ${data['06. volume']} | Last Updated: ${data['07. latest trading day']}\n`;
      } else if (data && data.name) {
        formattedData += `${data.name}: ${data.message || 'No detailed data available'}\n`;
      } else {
        formattedData += `${symbol}: Data unavailable\n`;
      }
    }
    
    formattedData += '\n';
  }
  
  // Format news data if available
  if (financialData.newsData && financialData.newsData.length > 0) {
    formattedData += 'LATEST FINANCIAL NEWS:\n';
    
    for (const news of financialData.newsData) {
      formattedData += `- ${news.title} (Sentiment: ${news.sentiment})\n`;
      formattedData += `  Summary: ${news.summary.substring(0, 100)}...\n\n`;
    }
  }
  
  return formattedData;
}
