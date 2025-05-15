import { nseData } from 'nse-data';

/**
 * Fetches the current market status from NSE.
 * @returns {Promise<Object>} Market status data or error object.
 */
export const getMarketStatus = async () => {
  try {
    // Check if nseData has the marketStatus function directly
    if (typeof nseData.marketStatus === 'function') {
      const status = await nseData.marketStatus();
      return status;
    } 
    // Fallback for different import styles if encountered
    else if (nseData.nseData && typeof nseData.nseData.marketStatus === 'function') {
      const status = await nseData.nseData.marketStatus();
      return status;
    } 
    // Handle case where the function doesn't exist
    else {
      console.error('nse-data: marketStatus function not found in the expected locations.');
      return { error: 'Market status data is currently unavailable.' };
    }
  } catch (error) {
    console.error('Error fetching market status from nse-data:', error);
    return { error: 'Failed to fetch market status. Please try again later.' };
  }
};

/**
 * Fetches key indices and overall market breadth from NSE.
 * Currently disabled due to API issues.
 * @returns {Promise<Object>} Market overview data (indices, breadth) or error object.
 */
export const getMarketOverviewData = async () => {
  // Return a temporary error message until the API issues are resolved
  return { error: 'Market overview data is temporarily unavailable. We are working on fixing this issue.' };
  
  /* Implementation to be fixed and re-enabled later:
  try {
    if (typeof nseData.indexDetails === 'function') {
      const overviewData = await nseData.indexDetails();
      return {
        indices: overviewData.data,
        marketBreadth: {
          advances: overviewData.advances,
          declines: overviewData.declines,
          unchanged: overviewData.unchanged,
        },
        timestamp: overviewData.timestamp,
      };
    } else if (nseData.nseData && typeof nseData.nseData.indexDetails === 'function') {
      const overviewData = await nseData.nseData.indexDetails();
      return {
        indices: overviewData.data,
        marketBreadth: {
          advances: overviewData.advances,
          declines: overviewData.declines,
          unchanged: overviewData.unchanged,
        },
        timestamp: overviewData.timestamp,
      };
    } else {
      console.error('nse-data: indexDetails function not found');
      return { error: 'Market overview data is currently unavailable.' };
    }
  } catch (error) {
    console.error('Error fetching market overview data:', error);
    return { error: 'Failed to fetch market overview data. Please try again later.' };
  }
  */
};

/**
 * Fetches top N gainers and losers for a specific index from NSE.
 * Currently disabled due to API issues.
 * @param {string} indexSymbol - The symbol of the index (e.g., 'NIFTY 50').
 * @param {number} topN - The number of top gainers/losers to return.
 * @returns {Promise<Object>} Object containing topGainers and topLosers lists or error object.
 */
export const getIndexGainersLosers = async (indexSymbol, topN = 5) => {
  // Return a temporary error message until the API issues are resolved
  return { 
    error: `Top gainers and losers data for ${indexSymbol} is temporarily unavailable. We are working on fixing this issue.` 
  };
  
  /* Implementation to be fixed and re-enabled later:
  try {
    let rawIndexInfo;
    if (typeof nseData.indexInfo === 'function') {
      rawIndexInfo = await nseData.indexInfo(indexSymbol);
    } else if (nseData.nseData && typeof nseData.nseData.indexInfo === 'function') {
      rawIndexInfo = await nseData.nseData.indexInfo(indexSymbol);
    } else {
      console.error('nse-data: indexInfo function not found');
      return { error: `Data for ${indexSymbol} is currently unavailable.` };
    }

    if (!rawIndexInfo || !rawIndexInfo.data || rawIndexInfo.data.length === 0) {
      return { error: `No data found for index: ${indexSymbol}` };
    }

    const stocks = rawIndexInfo.data.filter(stock => typeof stock.pChange === 'number');
    const sortedStocks = [...stocks].sort((a, b) => b.pChange - a.pChange);

    const topGainers = sortedStocks.slice(0, topN);
    const topLosers = sortedStocks.slice(-topN).reverse();

    return {
      indexName: rawIndexInfo.name,
      timestamp: rawIndexInfo.timestamp,
      topGainers,
      topLosers,
    };
  } catch (error) {
    console.error(`Error fetching data for ${indexSymbol}:`, error);
    return { error: `Failed to fetch data for ${indexSymbol}. Please try again later.` };
  }
  */
};

/**
 * Fetches a list of top NSE stocks by market cap or volume
 * @param {number} limit - Number of stocks to return (default: 10)
 * @returns {Promise<Object>} List of top stocks or error object
 */
export const getTopNseStocks = async (limit = 10) => {
  try {
    // For now, return a static list of top NSE stocks
    // In a production environment, this would fetch from the NSE API
    const topStocks = [
      {
        symbol: 'RELIANCE',
        companyName: 'Reliance Industries Ltd.',
        lastPrice: 2876.45,
        change: 23.75,
        pChange: 0.83,
        marketCap: 1946523.45, // in crores
        sector: 'Oil & Gas'
      },
      {
        symbol: 'TCS',
        companyName: 'Tata Consultancy Services Ltd.',
        lastPrice: 3521.65,
        change: -12.35,
        pChange: -0.35,
        marketCap: 1287654.32,
        sector: 'IT'
      },
      {
        symbol: 'HDFCBANK',
        companyName: 'HDFC Bank Ltd.',
        lastPrice: 1678.90,
        change: 15.45,
        pChange: 0.93,
        marketCap: 1156789.23,
        sector: 'Financial Services'
      },
      {
        symbol: 'INFY',
        companyName: 'Infosys Ltd.',
        lastPrice: 1432.55,
        change: -5.65,
        pChange: -0.39,
        marketCap: 987654.21,
        sector: 'IT'
      },
      {
        symbol: 'HINDUNILVR',
        companyName: 'Hindustan Unilever Ltd.',
        lastPrice: 2543.20,
        change: 32.15,
        pChange: 1.28,
        marketCap: 876543.21,
        sector: 'FMCG'
      },
      {
        symbol: 'ICICIBANK',
        companyName: 'ICICI Bank Ltd.',
        lastPrice: 945.75,
        change: 8.25,
        pChange: 0.88,
        marketCap: 765432.10,
        sector: 'Financial Services'
      },
      {
        symbol: 'BAJFINANCE',
        companyName: 'Bajaj Finance Ltd.',
        lastPrice: 6789.45,
        change: -45.30,
        pChange: -0.66,
        marketCap: 654321.09,
        sector: 'Financial Services'
      },
      {
        symbol: 'BHARTIARTL',
        companyName: 'Bharti Airtel Ltd.',
        lastPrice: 876.35,
        change: 12.45,
        pChange: 1.44,
        marketCap: 543210.98,
        sector: 'Telecom'
      },
      {
        symbol: 'KOTAKBANK',
        companyName: 'Kotak Mahindra Bank Ltd.',
        lastPrice: 1765.90,
        change: -8.75,
        pChange: -0.49,
        marketCap: 432109.87,
        sector: 'Financial Services'
      },
      {
        symbol: 'ASIANPAINT',
        companyName: 'Asian Paints Ltd.',
        lastPrice: 3210.45,
        change: 28.65,
        pChange: 0.90,
        marketCap: 321098.76,
        sector: 'Consumer Durables'
      }
    ];

    return {
      stocks: topStocks.slice(0, limit),
      timestamp: new Date().toISOString(),
      source: 'Static data (for demonstration)'
    };
  } catch (error) {
    console.error('Error fetching top NSE stocks:', error);
    return { error: 'Failed to fetch top NSE stocks. Please try again later.' };
  }
};

/**
 * Future functions to be implemented:
 * 
 * 1. Get detailed information for a specific index
 * export const getIndexDetails = async (indexSymbol) => { ... };
 * 
 * 2. Get detailed information for a specific stock
 * export const getStockDetails = async (stockSymbol) => { ... };
 * 
 * 3. Get sector performance data
 * export const getSectorPerformance = async () => { ... };
 * 
 * 4. Get market heatmap data
 * export const getMarketHeatmap = async () => { ... };
 */
