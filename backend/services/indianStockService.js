import { PythonShell } from 'python-shell';
import path from 'path';
import { fileURLToPath } from 'url';

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
 * Fetch data for a single Indian stock
 * @param {string} symbol - Stock ticker symbol (e.g., 'RELIANCE' for Reliance Industries)
 * @param {string} period - Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
 * @param {string} interval - Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
 * @returns {Promise<Object>} - Stock data
 */
export const getIndianStockData = async (symbol, period = '1y', interval = '1d') => {
  try {
    // Ensure we're getting the most accurate and up-to-date NSE price data
    const options = {
      mode: 'text',
      pythonPath: 'python', // or 'python3' depending on your system
      pythonOptions: ['-u'], // unbuffered output
      scriptPath: path.join(__dirname, '../scripts/python'),
      args: ['stock_data', symbol, period, interval]
    };

    return new Promise((resolve, reject) => {
      PythonShell.run('fetch_stock_data.py', options, (err, results) => {
        if (err) {
          console.error(`Error fetching stock data for ${symbol}:`, err);
          reject(err);
          return;
        }

        try {
          // Parse the JSON result
          const data = JSON.parse(results[0]);
          
          // Ensure the price data is accurate by rounding to 2 decimal places
          // This matches the NSE display format
          if (data.currentPrice != null) {
            data.currentPrice = parseFloat(data.currentPrice.toFixed(2));
          }
          if (data.dayChange != null) {
            data.dayChange = parseFloat(data.dayChange.toFixed(2));
          }
          if (data.dayChangePctRawDecimal != null) {
            const dayChangePctAsPercentageValue = data.dayChangePctRawDecimal * 100;
            data.dayChangePct = parseFloat(dayChangePctAsPercentageValue.toFixed(2));
          }
          if (data.periodChangePct != null) {
            data.periodChangePct = parseFloat(data.periodChangePct.toFixed(2));
          }
          
          if (data.history && Array.isArray(data.history)) {
            data.history = data.history.map(day => ({
              ...day,
              Open: parseFloat(day.Open.toFixed(2)),
              High: parseFloat(day.High.toFixed(2)),
              Low: parseFloat(day.Low.toFixed(2)),
              Close: parseFloat(day.Close.toFixed(2))
            }));
          }
          
          resolve(data);
        } catch (parseErr) {
          console.error('Error parsing stock data result:', parseErr);
          reject(parseErr);
        }
      });
    });
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return { error: error.message || `Failed to fetch data for ${symbol}` };
  }
};

/**
 * Fetch data for multiple Indian stocks
 * @param {Array<string>} tickers - Array of stock ticker symbols
 * @param {string} period - Data period
 * @param {string} interval - Data interval
 * @returns {Promise<Object>} - Data for multiple stocks
 */
export const getMultipleIndianStocks = async (tickers, period = '1y', interval = '1d') => {
  try {
    return await runPythonScript(['multiple', tickers.join(','), period, interval]);
  } catch (error) {
    console.error('Error fetching data for multiple stocks:', error);
    return { error: error.message || 'Failed to fetch data for multiple stocks' };
  }
};

/**
 * Fetch data for major Indian market indices (Nifty 50, Sensex)
 * @returns {Promise<Object>} - Index data
 */
export const getIndianMarketIndices = async () => {
  try {
    const data = await runPythonScript(['indices']);
    
    // Format prices consistently for all indices
    if (data && typeof data === 'object' && !data.error) {
      Object.keys(data).forEach(key => {
        const index = data[key];
        if (index && typeof index === 'object' && !index.error) {
          if (index.currentPrice != null) {
            index.currentPrice = parseFloat(index.currentPrice.toFixed(2));
          }
          if (index.dayChange != null) {
            index.dayChange = parseFloat(index.dayChange.toFixed(2));
          }
          if (index.dayChangePct != null) {
            index.dayChangePct = parseFloat(index.dayChangePct.toFixed(2));
          }
        }
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching market indices:', error);
    return { error: error.message || 'Failed to fetch market indices' };
  }
};

/**
 * Get top gainers and losers for the day in Indian market
 * @returns {Promise<Object>} - Gainers and losers data
 */
export const getIndianTopGainersLosers = async () => {
  try {
    const data = await runPythonScript(['gainers-losers']);
    
    // Format prices consistently for gainers and losers
    if (data && typeof data === 'object' && !data.error) {
      const formatStockList = (list) => {
        if (Array.isArray(list)) {
          return list.map(stock => ({
            ...stock,
            price: stock.price != null ? parseFloat(stock.price.toFixed(2)) : null,
            change: stock.change != null ? parseFloat(stock.change.toFixed(2)) : null,
            changePct: stock.changePct != null ? parseFloat(stock.changePct.toFixed(2)) : null
          }));
        }
        return list;
      };

      data.gainers = formatStockList(data.gainers);
      data.losers = formatStockList(data.losers);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching top gainers and losers:', error);
    return { error: error.message || 'Failed to fetch top gainers and losers' };
  }
};

/**
 * Get performance by sector for Indian market
 * @returns {Promise<Object>} - Sector performance data
 */
export const getIndianSectorPerformance = async () => {
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
export const searchIndianStocks = async (query) => {
  try {
    // Common Indian stocks
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
  getIndianStockData,
  getMultipleIndianStocks,
  getIndianMarketIndices,
  getIndianTopGainersLosers,
  getIndianSectorPerformance,
  searchIndianStocks
};
