import axios from 'axios';
import Stock from '../models/Stock.js';
import { getCached, setCached } from './cacheService.js';

// Since the yfinance npm module doesn't work well, we'll use direct axios calls
const YAHOO_FINANCE_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance';

// Add a retry mechanism for API calls
const axiosWithRetry = async (url, config, retries = 3, delay = 1000) => {
  try {
    return await axios.get(url, config);
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    console.log(`Retrying API call to ${url}, ${retries} retries left`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return axiosWithRetry(url, config, retries - 1, delay * 2);
  }
};

// Validate stock data before returning
const validateStockData = (data, symbol) => {
  if (!data) return false;
  
  const requiredFields = ['symbol', 'price', 'name'];
  const hasRequiredFields = requiredFields.every(field => data[field] !== undefined);
  
  const isReasonable = 
    (data.price > 0) && 
    (Math.abs(data.changePercent) < 30); // No reasonable stock changes more than 30% in a day
    
  return hasRequiredFields && isReasonable;
};

/**
 * Fetches stock quote data from Yahoo Finance
 * @param {string} symbol - Stock symbol like "TCS.NS"
 * @returns {Promise<Object>} - Stock data
 */
export const fetchStockQuote = async (symbol) => {
  const cacheKey = `stock_quote_${symbol}`;
  const cachedData = getCached(cacheKey);
  
  if (cachedData && validateStockData(cachedData, symbol)) {
    return cachedData;
  }
  
  try {
    const url = `${YAHOO_FINANCE_BASE_URL}/quote`;
    const response = await axiosWithRetry(url, {
      params: {
        symbols: symbol,
      },
      timeout: 10000 // 10s timeout
    });
    
    if (!response.data || !response.data.quoteResponse || !response.data.quoteResponse.result || 
        !response.data.quoteResponse.result[0]) {
      throw new Error(`Invalid response data for symbol: ${symbol}`);
    }
    
    const result = response.data.quoteResponse.result[0];
    
    // Process quote data with proper defaults
    const stockData = {
      symbol: result.symbol,
      displaySymbol: result.symbol.split('.')[0], // Convert "TCS.NS" to "TCS"
      name: result.shortName || result.longName || symbol,
      price: result.regularMarketPrice || result.currentPrice || 0,
      change: result.regularMarketChange || 0,
      changePercent: result.regularMarketChangePercent || 0,
      marketCap: result.marketCap || 0,
      peRatio: result.trailingPE || 0,
      eps: result.epsTrailingTwelveMonths || 0,
      volume: result.regularMarketVolume || 0,
      lastUpdated: new Date()
    };
    
    // Validate data before caching
    if (validateStockData(stockData, symbol)) {
      setCached(cacheKey, stockData);
      return stockData;
    } else {
      throw new Error(`Invalid stock data received for ${symbol}`);
    }
  } catch (error) {
    console.error(`Error fetching stock quote for ${symbol}:`, error);
    
    // If we have cached data, return it even if it's outdated rather than failing
    if (cachedData) {
      console.log(`Returning outdated cached data for ${symbol}`);
      return cachedData;
    }
    
    throw error;
  }
};

/**
 * Fetches detailed stock information from Yahoo Finance
 * @param {string} symbol - Stock symbol like "TCS.NS"
 * @returns {Promise<Object>} - Stock details
 */
export const fetchStockDetails = async (symbol) => {
  const cacheKey = `stock_details_${symbol}`;
  const cachedData = getCached(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    // First get the modules we need
    const url = `${YAHOO_FINANCE_BASE_URL}/quoteSummary/${symbol}`;
    const response = await axios.get(url, {
      params: {
        modules: 'financialData,defaultKeyStatistics,quoteType'
      }
    });
    
    const result = response.data.quoteSummary.result[0];
    if (!result) {
      throw new Error(`No detailed data found for symbol: ${symbol}`);
    }
    
    // Extract financial metrics
    const financialData = result.financialData || {};
    const keyStats = result.defaultKeyStatistics || {};
    
    const stockDetails = {
      roe: financialData.returnOnEquity?.raw,
      debtToEquity: financialData.debtToEquity?.raw,
      // Additional metrics can be extracted here
    };
    
    setCached(cacheKey, stockDetails);
    return stockDetails;
  } catch (error) {
    console.error(`Error fetching stock details for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Fetches historical chart data for a stock
 * @param {string} symbol - Stock symbol like "TCS.NS"
 * @param {string} interval - Data interval (1d, 1wk, 1mo)
 * @param {string} range - Time range (1y, 2y, 5y)
 * @returns {Promise<Array>} - Chart data points
 */
export const fetchChartData = async (symbol, interval = '1d', range = '1y') => {
  const cacheKey = `stock_chart_${symbol}_${interval}_${range}`;
  const cachedData = getCached(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const url = `${YAHOO_FINANCE_BASE_URL}/chart/${symbol}`;
    const response = await axios.get(url, {
      params: {
        interval,
        range,
      }
    });
    
    const result = response.data.chart.result[0];
    if (!result) {
      throw new Error(`No chart data found for symbol: ${symbol}`);
    }
    
    const { timestamp, indicators } = result;
    const quote = indicators.quote[0];
    
    // Format chart data
    const chartData = timestamp.map((time, index) => ({
      date: new Date(time * 1000),
      close: quote.close[index],
      volume: quote.volume[index]
    })).filter(point => point.close !== null);
    
    setCached(cacheKey, chartData);
    return chartData;
  } catch (error) {
    console.error(`Error fetching chart data for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Fetches financial data for the last 3 years
 * @param {string} symbol - Stock symbol like "TCS.NS"
 * @returns {Promise<Array>} - Financial data for last 3 years
 */
export const fetchFinancialData = async (symbol) => {
  const cacheKey = `stock_financials_${symbol}`;
  const cachedData = getCached(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  try {
    const url = `${YAHOO_FINANCE_BASE_URL}/quoteSummary/${symbol}`;
    const response = await axios.get(url, {
      params: {
        modules: 'incomeStatementHistory,cashflowStatementHistory'
      }
    });
    
    const result = response.data.quoteSummary.result[0];
    if (!result || !result.incomeStatementHistory) {
      throw new Error(`No financial data found for symbol: ${symbol}`);
    }
    
    const statements = result.incomeStatementHistory.incomeStatementHistory;
    
    // Extract last 3 years of financial data
    const financialData = statements.slice(0, 3).map(statement => ({
      year: new Date(statement.endDate.raw * 1000).getFullYear(),
      revenue: statement.totalRevenue?.raw,
      netIncome: statement.netIncome?.raw
    }));
    
    setCached(cacheKey, financialData);
    return financialData;
  } catch (error) {
    console.error(`Error fetching financial data for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Gets complete stock data, combining all data sources
 * @param {string} symbol - Stock symbol like "TCS.NS"
 * @returns {Promise<Object>} - Complete stock data
 */
export const getStockData = async (symbol) => {
  try {
    // Check if we already have this stock in DB with recent data
    const existingStock = await Stock.findOne({ symbol });
    const now = new Date();
    
    // If stock exists and was updated recently (within cache TTL), return it
    if (existingStock && 
        existingStock.lastUpdated && 
        (now - existingStock.lastUpdated) < (parseInt(process.env.CACHE_TTL || '300', 10) * 1000)) {
      return existingStock;
    }
    
    // Fetch all stock data in parallel
    try {
      const [quoteData, details, chartData, financialData] = await Promise.all([
        fetchStockQuote(symbol),
        fetchStockDetails(symbol),
        fetchChartData(symbol),
        fetchFinancialData(symbol)
      ]);
      
      // Combine all data
      const stockData = {
        ...quoteData,
        ...details,
        chartData,
        financialData,
        lastUpdated: new Date()
      };
      
      // Update or create stock in database
      if (existingStock) {
        await Stock.findByIdAndUpdate(existingStock._id, stockData);
      } else {
        await new Stock(stockData).save();
      }
      
      return stockData;
    } catch (error) {
      // If parallel requests fail but we have existing data, return that instead
      if (existingStock) {
        console.log(`Using existing DB data for ${symbol} due to API errors`);
        return existingStock;
      }
      throw error;
    }
  } catch (error) {
    console.error(`Error getting complete stock data for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Get market overview data (top stocks by market cap for a given market)
 * @param {string} market - Market name (e.g., 'india', 'us', 'uk')
 * @param {number} limit - Number of stocks to return
 * @returns {Promise<Array>} - Market overview data
 */
export const getMarketOverview = async (market = 'india', limit = 10) => {
  const cacheKey = `market_overview_${market}_${limit}`;
  const cachedData = getCached(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }
  
  // Determine the suffix for the market
  const marketSuffixes = {
    'india': '.NS', // NSE (India)
    'in': '.NS',
    'us': '', // Default US is no suffix
    'uk': '.L', // London Stock Exchange
    'hk': '.HK', // Hong Kong
    'germany': '.DE', // German exchanges
    'australia': '.AX', // Australian Securities Exchange
    'canada': '.TO', // Toronto Stock Exchange
    'france': '.PA', // Euronext Paris
    'brazil': '.SA' // B3 (Brazil)
  };
  
  const suffix = marketSuffixes[market.toLowerCase()] || '';
  
  try {
    // Try to get data from database first
    let query = suffix ? { symbol: { $regex: suffix + '$' } } : {};
    
    const stocks = await Stock.find(query)
      .select('symbol displaySymbol name price change changePercent lastUpdated marketCap volume')
      .sort({ marketCap: -1 })
      .limit(parseInt(limit));
    
    if (stocks.length >= limit) {
      setCached(cacheKey, stocks);
      return stocks;
    }
    
    // If not enough stocks found, use default data based on market
    const marketData = generateDefaultMarketOverview(market, limit);
    setCached(cacheKey, marketData);
    return marketData;
  } catch (error) {
    console.error(`Error getting market overview for ${market}:`, error);
    
    // Fallback to default data
    const marketData = generateDefaultMarketOverview(market, limit);
    setCached(cacheKey, marketData);
    return marketData;
  }
};

/**
 * Generate default market overview data
 * @param {string} market - Market name
 * @param {number} limit - Number of stocks to return
 * @returns {Array} - Market overview data
 */
function generateDefaultMarketOverview(market, limit) {
  const now = new Date();
  
  const markets = {
    'india': [
      { symbol: 'RELIANCE.NS', displaySymbol: 'RELIANCE', name: 'Reliance Industries Ltd.', price: 2785.50, change: 42.70, changePercent: 1.55, marketCap: 18.85e12, volume: 5843210 },
      { symbol: 'TCS.NS', displaySymbol: 'TCS', name: 'Tata Consultancy Services Ltd.', price: 3542.80, change: -12.30, changePercent: -0.35, marketCap: 12.45e12, volume: 1254789 },
      { symbol: 'HDFCBANK.NS', displaySymbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', price: 1657.45, change: 22.35, changePercent: 1.37, marketCap: 9.25e12, volume: 3578912 },
      { symbol: 'INFY.NS', displaySymbol: 'INFY', name: 'Infosys Ltd.', price: 1478.90, change: -5.60, changePercent: -0.38, marketCap: 6.15e12, volume: 2154786 },
      { symbol: 'ICICIBANK.NS', displaySymbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', price: 958.75, change: 15.40, changePercent: 1.63, marketCap: 6.05e12, volume: 4125763 },
      { symbol: 'HINDUNILVR.NS', displaySymbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', price: 2428.15, change: -8.75, changePercent: -0.36, marketCap: 5.70e12, volume: 854239 },
      { symbol: 'SBIN.NS', displaySymbol: 'SBIN', name: 'State Bank of India', price: 658.40, change: 12.85, changePercent: 1.99, marketCap: 5.65e12, volume: 7851432 },
      { symbol: 'BHARTIARTL.NS', displaySymbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', price: 1012.30, change: 5.70, changePercent: 0.57, marketCap: 5.34e12, volume: 2654378 },
      { symbol: 'KOTAKBANK.NS', displaySymbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', price: 1745.60, change: -2.35, changePercent: -0.13, marketCap: 4.35e12, volume: 1023547 },
      { symbol: 'ITC.NS', displaySymbol: 'ITC', name: 'ITC Ltd.', price: 428.25, change: 1.15, changePercent: 0.27, marketCap: 4.22e12, volume: 9875421 }
    ],
    'us': [
      { symbol: 'AAPL', displaySymbol: 'AAPL', name: 'Apple Inc.', price: 178.72, change: 3.15, changePercent: 1.79, marketCap: 2.85e12, volume: 58432100 },
      { symbol: 'MSFT', displaySymbol: 'MSFT', name: 'Microsoft Corporation', price: 386.06, change: 4.23, changePercent: 1.11, marketCap: 2.76e12, volume: 21547890 },
      { symbol: 'GOOGL', displaySymbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.17, change: 1.28, changePercent: 0.91, marketCap: 1.83e12, volume: 25436789 },
      { symbol: 'AMZN', displaySymbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.75, change: 2.43, changePercent: 1.38, marketCap: 1.64e12, volume: 41257630 },
      { symbol: 'NVDA', displaySymbol: 'NVDA', name: 'NVIDIA Corporation', price: 432.38, change: 15.72, changePercent: 3.77, marketCap: 1.21e12, volume: 35421897 },
      { symbol: 'META', displaySymbol: 'META', name: 'Meta Platforms Inc.', price: 472.22, change: 8.45, changePercent: 1.82, marketCap: 1.02e12, volume: 18546230 },
      { symbol: 'BRK.B', displaySymbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', price: 408.98, change: -1.23, changePercent: -0.30, marketCap: 0.89e12, volume: 3541267 },
      { symbol: 'LLY', displaySymbol: 'LLY', name: 'Eli Lilly and Company', price: 754.37, change: 12.85, changePercent: 1.73, marketCap: 0.86e12, volume: 3251478 },
      { symbol: 'TSLA', displaySymbol: 'TSLA', name: 'Tesla Inc.', price: 178.21, change: -3.57, changePercent: -1.96, marketCap: 0.82e12, volume: 78514320 },
      { symbol: 'V', displaySymbol: 'V', name: 'Visa Inc.', price: 267.94, change: 1.25, changePercent: 0.47, marketCap: 0.53e12, volume: 6543219 }
    ],
    'uk': [
      { symbol: 'SHELL.L', displaySymbol: 'SHELL', name: 'Shell plc', price: 2574.50, change: 32.50, changePercent: 1.28, marketCap: 176.4e9, volume: 7524163 },
      { symbol: 'AZN.L', displaySymbol: 'AZN', name: 'AstraZeneca PLC', price: 10524.00, change: 124.00, changePercent: 1.19, marketCap: 163.1e9, volume: 2136547 },
      { symbol: 'HSBA.L', displaySymbol: 'HSBA', name: 'HSBC Holdings plc', price: 657.60, change: 5.80, changePercent: 0.89, marketCap: 125.3e9, volume: 25413689 },
      { symbol: 'ULVR.L', displaySymbol: 'ULVR', name: 'Unilever PLC', price: 4138.00, change: -15.00, changePercent: -0.36, marketCap: 103.5e9, volume: 3254789 },
      { symbol: 'RIO.L', displaySymbol: 'RIO', name: 'Rio Tinto Group', price: 5042.00, change: 72.00, changePercent: 1.45, marketCap: 92.7e9, volume: 4512367 },
      { symbol: 'BP.L', displaySymbol: 'BP', name: 'BP p.l.c.', price: 478.45, change: 7.55, changePercent: 1.60, marketCap: 82.3e9, volume: 32541789 },
      { symbol: 'GSK.L', displaySymbol: 'GSK', name: 'GSK plc', price: 1612.40, change: 18.40, changePercent: 1.15, marketCap: 65.8e9, volume: 6543219 },
      { symbol: 'DGE.L', displaySymbol: 'DGE', name: 'Diageo plc', price: 2765.00, change: -24.50, changePercent: -0.88, marketCap: 61.4e9, volume: 3512648 },
      { symbol: 'LGEN.L', displaySymbol: 'LGEN', name: 'Legal & General Group Plc', price: 245.30, change: 2.10, changePercent: 0.86, marketCap: 54.7e9, volume: 12547896 },
      { symbol: 'VOD.L', displaySymbol: 'VOD', name: 'Vodafone Group Plc', price: 67.88, change: -0.54, changePercent: -0.79, marketCap: 47.5e9, volume: 45127896 }
    ]
  };
  
  const defaultMarket = markets[market.toLowerCase()] || markets['us'];
  
  // Add lastUpdated field to each stock
  return defaultMarket.slice(0, limit).map(stock => ({
    ...stock,
    lastUpdated: now
  }));
}

export default {
  fetchStockQuote,
  fetchStockDetails,
  fetchChartData,
  fetchFinancialData,
  getStockData,
  getMarketOverview
}; 