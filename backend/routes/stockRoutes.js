import express from 'express';
import stockService from '../services/stockService.js';
import Stock from '../models/Stock.js';

const router = express.Router();

// Define market suffix for Indian stocks
const MARKET_SUFFIXES = {
  'india': '.NS', // NSE (India)
  'in': '.NS'
};

/**
 * @route   GET /api/stocks/:symbol
 * @desc    Get stock data by symbol
 * @access  Public
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { market = 'india' } = req.query; // Default to India market
    
    // If symbol already has a suffix, don't add one
    const hasSuffix = symbol.includes('.');
    
    // Otherwise, add the correct suffix based on market
    const suffix = hasSuffix ? '' : (MARKET_SUFFIXES[market.toLowerCase()] || '');
    const formattedSymbol = hasSuffix ? symbol : `${symbol}${suffix}`;
    
    const stockData = await stockService.getStockData(formattedSymbol);
    res.json(stockData);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stock data',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/stocks
 * @desc    Get all stocks or search by name
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { search, limit = 10, market = 'india' } = req.query;
    
    // If it's a search query
    if (search) {
      let query = { 
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { displaySymbol: { $regex: search, $options: 'i' } }
        ] 
      };
      
      // If market is specified and not 'all', filter by market suffix
      if (market && market !== 'all') {
        const suffix = MARKET_SUFFIXES[market.toLowerCase()] || '';
        if (suffix) {
          query.symbol = { $regex: suffix + '$' };
        }
      }
      
      const stocks = await Stock.find(query)
        .select('symbol displaySymbol name price change changePercent lastUpdated')
        .sort({ lastUpdated: -1 })
        .limit(parseInt(limit));
      
      return res.json(stocks);
    }
    
    // Otherwise, get market overview
    try {
      const marketData = await stockService.getMarketOverview(market, parseInt(limit));
      return res.json(marketData);
    } catch (err) {
      // Fallback to database
      console.error('Error fetching market overview, falling back to DB:', err);
      
      let query = {};
      
      // If market is specified and not 'all', filter by market suffix
      if (market && market !== 'all') {
        const suffix = MARKET_SUFFIXES[market.toLowerCase()] || '';
        if (suffix) {
          query.symbol = { $regex: suffix + '$' };
        }
      }
      
      const stocks = await Stock.find(query)
        .select('symbol displaySymbol name price change changePercent lastUpdated')
        .sort({ price: -1 })
        .limit(parseInt(limit));
      
      return res.json(stocks);
    }
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stocks',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/stocks/markets/available
 * @desc    Get list of supported markets
 * @access  Public
 */
router.get('/markets/available', (req, res) => {
  // Return list of supported markets
  const markets = Object.keys(MARKET_SUFFIXES).map(key => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    suffix: MARKET_SUFFIXES[key]
  }));
  
  res.json(markets);
});

/**
 * @route   GET /api/stocks/market/:market
 * @desc    Get market overview for specific market
 * @access  Public
 */
router.get('/market/:market', async (req, res) => {
  try {
    const { market } = req.params;
    const { limit = 10 } = req.query;
    
    if (!MARKET_SUFFIXES[market.toLowerCase()]) {
      return res.status(400).json({ error: 'Invalid market' });
    }
    
    const marketData = await stockService.getMarketOverview(market, parseInt(limit));
    res.json(marketData);
  } catch (error) {
    console.error(`Error fetching market data for ${req.params.market}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch market data',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/stocks/:symbol/chart
 * @desc    Get stock chart data
 * @access  Public
 */
router.get('/:symbol/chart', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1d', range = '1y', market = 'india' } = req.query;
    
    // If symbol already has a suffix, don't add one
    const hasSuffix = symbol.includes('.');
    
    // Otherwise, add the correct suffix based on market
    const suffix = hasSuffix ? '' : (MARKET_SUFFIXES[market.toLowerCase()] || '');
    const formattedSymbol = hasSuffix ? symbol : `${symbol}${suffix}`;
    
    const chartData = await stockService.fetchChartData(formattedSymbol, interval, range);
    res.json(chartData);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chart data',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/stocks/:symbol/financials
 * @desc    Get stock financial data
 * @access  Public
 */
router.get('/:symbol/financials', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { market = 'india' } = req.query;
    
    // If symbol already has a suffix, don't add one
    const hasSuffix = symbol.includes('.');
    
    // Otherwise, add the correct suffix based on market
    const suffix = hasSuffix ? '' : (MARKET_SUFFIXES[market.toLowerCase()] || '');
    const formattedSymbol = hasSuffix ? symbol : `${symbol}${suffix}`;
    
    const financialData = await stockService.fetchFinancialData(formattedSymbol);
    res.json(financialData);
  } catch (error) {
    console.error('Error fetching financial data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch financial data',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/stocks/peers
 * @desc    Get peer comparison data for a stock based on sector
 * @access  Public
 */
router.get('/peers', async (req, res) => {
  try {
    const { symbol, sector } = req.query;
    
    if (!symbol || !sector) {
      return res.status(400).json({ error: 'Symbol and sector are required' });
    }
    
    const cacheKey = `stock_peers_${symbol}_${sector.toLowerCase().replace(/\s+/g, '_')}`;
    const cachedData = getCached(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Get peer stocks based on sector
    // This is a simplified version - in production you would have a 
    // more sophisticated way of determining peers
    const sectorStocks = await Stock.find({
      $and: [
        { $or: [
          { sector: { $regex: new RegExp(sector, 'i') } },
          { industry: { $regex: new RegExp(sector, 'i') } }
        ]},
        { symbol: { $ne: symbol } } // Exclude the current stock
      ]
    })
    .select('symbol name marketCap peRatio roe')
    .sort({ marketCap: -1 })
    .limit(5);
    
    // If we don't have enough peers, add some default ones based on sector
    if (sectorStocks.length < 3) {
      const peers = generateDefaultPeers(sector, symbol);
      const peerData = [...sectorStocks, ...peers].slice(0, 5);
      setCached(cacheKey, peerData);
      return res.json(peerData);
    }
    
    setCached(cacheKey, sectorStocks);
    return res.json(sectorStocks);
  } catch (error) {
    console.error('Error fetching peer comparison:', error);
    res.status(500).json({ 
      error: 'Failed to fetch peer comparison',
      message: error.message
    });
  }
});

/**
 * Generate default peer data when database doesn't have enough matches
 */
function generateDefaultPeers(sector, excludeSymbol) {
  // Default tech peers
  let peers = [
    { symbol: 'AAPL', name: 'Apple Inc.', marketCap: 2.85e12, peRatio: 28.5, roe: 160.9 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', marketCap: 2.76e12, peRatio: 35.7, roe: 42.5 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', marketCap: 1.83e12, peRatio: 25.3, roe: 30.1 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', marketCap: 1.64e12, peRatio: 42.1, roe: 27.8 },
    { symbol: 'META', name: 'Meta Platforms Inc.', marketCap: 1.02e12, peRatio: 23.4, roe: 23.8 }
  ];
  
  // Adjust based on sector
  const sectorLower = sector.toLowerCase();
  
  if (sectorLower.includes('financial') || sectorLower.includes('bank')) {
    peers = [
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', marketCap: 0.44e12, peRatio: 12.5, roe: 15.2 },
      { symbol: 'BAC', name: 'Bank of America Corp.', marketCap: 0.29e12, peRatio: 11.3, roe: 11.8 },
      { symbol: 'WFC', name: 'Wells Fargo & Co.', marketCap: 0.19e12, peRatio: 10.5, roe: 9.3 },
      { symbol: 'C', name: 'Citigroup Inc.', marketCap: 0.15e12, peRatio: 9.8, roe: 8.1 },
      { symbol: 'GS', name: 'Goldman Sachs Group', marketCap: 0.12e12, peRatio: 13.8, roe: 14.6 }
    ];
  } 
  else if (sectorLower.includes('healthcare') || sectorLower.includes('pharma')) {
    peers = [
      { symbol: 'JNJ', name: 'Johnson & Johnson', marketCap: 0.41e12, peRatio: 24.7, roe: 25.8 },
      { symbol: 'PFE', name: 'Pfizer Inc.', marketCap: 0.18e12, peRatio: 9.5, roe: 15.4 },
      { symbol: 'MRK', name: 'Merck & Co. Inc.', marketCap: 0.23e12, peRatio: 21.3, roe: 38.2 },
      { symbol: 'ABBV', name: 'AbbVie Inc.', marketCap: 0.25e12, peRatio: 28.9, roe: 114.1 },
      { symbol: 'LLY', name: 'Eli Lilly and Co.', marketCap: 0.35e12, peRatio: 40.2, roe: 67.5 }
    ];
  } 
  else if (sectorLower.includes('telecom') || sectorLower.includes('communication')) {
    peers = [
      { symbol: 'T', name: 'AT&T Inc.', marketCap: 0.14e12, peRatio: 9.7, roe: 6.3 },
      { symbol: 'VZ', name: 'Verizon Communications', marketCap: 0.16e12, peRatio: 10.2, roe: 22.1 },
      { symbol: 'TMUS', name: 'T-Mobile US Inc.', marketCap: 0.21e12, peRatio: 15.6, roe: 10.4 },
      { symbol: 'CMCSA', name: 'Comcast Corporation', marketCap: 0.19e12, peRatio: 12.8, roe: 18.1 },
      { symbol: 'CHTR', name: 'Charter Communications', marketCap: 0.06e12, peRatio: 11.4, roe: 21.3 }
    ];
  }
  else if (sectorLower.includes('energy') || sectorLower.includes('oil')) {
    peers = [
      { symbol: 'XOM', name: 'Exxon Mobil Corp.', marketCap: 0.39e12, peRatio: 8.5, roe: 19.2 },
      { symbol: 'CVX', name: 'Chevron Corp.', marketCap: 0.32e12, peRatio: 10.2, roe: 18.7 },
      { symbol: 'COP', name: 'ConocoPhillips', marketCap: 0.11e12, peRatio: 7.8, roe: 21.1 },
      { symbol: 'SLB', name: 'Schlumberger Ltd.', marketCap: 0.07e12, peRatio: 14.3, roe: 20.8 },
      { symbol: 'EOG', name: 'EOG Resources Inc.', marketCap: 0.07e12, peRatio: 9.2, roe: 22.3 }
    ];
  }
  else if (sectorLower.includes('retail') || sectorLower.includes('consumer')) {
    peers = [
      { symbol: 'WMT', name: 'Walmart Inc.', marketCap: 0.41e12, peRatio: 28.2, roe: 14.6 },
      { symbol: 'TGT', name: 'Target Corp.', marketCap: 0.06e12, peRatio: 17.5, roe: 27.3 },
      { symbol: 'COST', name: 'Costco Wholesale Corp.', marketCap: 0.25e12, peRatio: 38.7, roe: 28.8 },
      { symbol: 'HD', name: 'Home Depot Inc.', marketCap: 0.32e12, peRatio: 22.5, roe: 782.3 },
      { symbol: 'LOW', name: "Lowe's Companies", marketCap: 0.13e12, peRatio: 19.2, roe: 263.7 }
    ];
  }
  
  // Filter out the current symbol
  return peers.filter(peer => peer.symbol !== excludeSymbol);
}

export default router; 