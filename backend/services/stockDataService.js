import { PythonShell } from 'python-shell';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

// Get the directory name using ES module syntax
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Python script
const pythonScriptPath = path.join(__dirname, '..', 'scripts', 'python', 'fetch_stock_data.py');

/**
 * Execute the Python script with the given arguments
 * @param {Array} args - Arguments to pass to the Python script
 * @returns {Promise<Object>} - Parsed JSON result
 */
const runPythonScript = async (args) => {
  try {
    const options = {
      mode: 'json',
      pythonPath: 'python', // Make sure Python is in your PATH
      pythonOptions: ['-u'], // unbuffered output
      scriptPath: path.dirname(pythonScriptPath),
      args: args
    };

    const results = await PythonShell.run(path.basename(pythonScriptPath), options);
    return results[0]; // PythonShell returns an array of messages, we expect a single JSON object
  } catch (error) {
    console.error('Error running Python script:', error);
    return { error: error.message || 'Failed to execute Python script' };
  }
};

/**
 * Fetch data for a single stock
 * @param {string} ticker - Stock ticker symbol (e.g., 'RELIANCE' for Reliance Industries)
 * @param {string} period - Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
 * @param {string} interval - Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
 * @returns {Promise<Object>} - Stock data
 */
export const getStockData = async (ticker, period = '1y', interval = '1d') => {
  try {
    return await runPythonScript(['stock', ticker, period, interval]);
  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error);
    return { error: error.message || `Failed to fetch data for ${ticker}` };
  }
};

/**
 * Fetch data for multiple stocks
 * @param {Array<string>} tickers - Array of stock ticker symbols
 * @param {string} period - Data period
 * @param {string} interval - Data interval
 * @returns {Promise<Object>} - Data for multiple stocks
 */
export const getMultipleStocksData = async (tickers, period = '1y', interval = '1d') => {
  try {
    return await runPythonScript(['multiple', tickers.join(','), period, interval]);
  } catch (error) {
    console.error('Error fetching data for multiple stocks:', error);
    return { error: error.message || 'Failed to fetch data for multiple stocks' };
  }
};

/**
 * Fetch data for major Indian market indices
 * @returns {Promise<Object>} - Index data
 */
export const getMarketIndices = async () => {
  try {
    return await runPythonScript(['indices']);
  } catch (error) {
    console.error('Error fetching market indices:', error);
    return { error: error.message || 'Failed to fetch market indices' };
  }
};

/**
 * Get top gainers and losers for the day
 * @returns {Promise<Object>} - Gainers and losers data
 */
export const getTopGainersLosers = async () => {
  try {
    return await runPythonScript(['gainers-losers']);
  } catch (error) {
    console.error('Error fetching top gainers and losers:', error);
    return { error: error.message || 'Failed to fetch top gainers and losers' };
  }
};

/**
 * Get performance by sector for Indian market
 * @returns {Promise<Object>} - Sector performance data
 */
export const getSectorPerformance = async () => {
  try {
    return await runPythonScript(['sectors']);
  } catch (error) {
    console.error('Error fetching sector performance:', error);
    return { error: error.message || 'Failed to fetch sector performance' };
  }
};

/**
 * Search for Indian stocks by name or ticker
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of matching stocks
 */
export const searchStocks = async (query) => {
  try {
    // This is a simplified implementation
    // In a production app, you might want to use a more comprehensive API or database
    const commonIndianStocks = [
      { ticker: 'RELIANCE', name: 'Reliance Industries Ltd.' },
      { ticker: 'TCS', name: 'Tata Consultancy Services Ltd.' },
      { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd.' },
      { ticker: 'INFY', name: 'Infosys Ltd.' },
      { ticker: 'ICICIBANK', name: 'ICICI Bank Ltd.' },
      { ticker: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.' },
      { ticker: 'SBIN', name: 'State Bank of India' },
      { ticker: 'BHARTIARTL', name: 'Bharti Airtel Ltd.' },
      { ticker: 'ITC', name: 'ITC Ltd.' },
      { ticker: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.' },
      { ticker: 'LT', name: 'Larsen & Toubro Ltd.' },
      { ticker: 'AXISBANK', name: 'Axis Bank Ltd.' },
      { ticker: 'BAJFINANCE', name: 'Bajaj Finance Ltd.' },
      { ticker: 'ASIANPAINT', name: 'Asian Paints Ltd.' },
      { ticker: 'MARUTI', name: 'Maruti Suzuki India Ltd.' },
      { ticker: 'TATAMOTORS', name: 'Tata Motors Ltd.' },
      { ticker: 'WIPRO', name: 'Wipro Ltd.' },
      { ticker: 'HCLTECH', name: 'HCL Technologies Ltd.' },
      { ticker: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.' },
      { ticker: 'ONGC', name: 'Oil and Natural Gas Corporation Ltd.' }
    ];
    
    if (!query || query.trim() === '') {
      return commonIndianStocks;
    }
    
    const lowerQuery = query.toLowerCase();
    return commonIndianStocks.filter(stock => 
      stock.ticker.toLowerCase().includes(lowerQuery) || 
      stock.name.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Error searching stocks:', error);
    return { error: error.message || 'Failed to search stocks' };
  }
};

export default {
  getStockData,
  getMultipleStocksData,
  getMarketIndices,
  getTopGainersLosers,
  getSectorPerformance,
  searchStocks
};
