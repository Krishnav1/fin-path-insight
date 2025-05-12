import express from 'express';
import indianStockService from '../services/indianStockService.js';

const router = express.Router();

/**
 * @route   GET /api/indian-stocks/search
 * @desc    Search for Indian stocks
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const stocks = await indianStockService.searchIndianStocks(query);
    res.json(stocks);
  } catch (error) {
    console.error('Error searching Indian stocks:', error);
    res.status(500).json({ 
      error: 'Failed to search Indian stocks',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/indian-stocks/:symbol
 * @desc    Get Indian stock data by symbol
 * @access  Public
 */
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1y', interval = '1d' } = req.query;
    
    const stockData = await indianStockService.getIndianStockData(symbol, period, interval);
    res.json(stockData);
  } catch (error) {
    console.error('Error fetching Indian stock data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Indian stock data',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/indian-stocks
 * @desc    Get multiple Indian stocks or market overview
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { symbols, period = '1y', interval = '1d' } = req.query;
    
    if (symbols) {
      // If symbols are provided, fetch data for those specific stocks
      const symbolsArray = symbols.split(',');
      const stocksData = await indianStockService.getMultipleIndianStocks(symbolsArray, period, interval);
      return res.json(stocksData);
    }
    
    // Otherwise, return top Indian stocks
    const topStocks = await indianStockService.searchIndianStocks('');
    res.json(topStocks);
  } catch (error) {
    console.error('Error fetching Indian stocks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Indian stocks',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/indian-stocks/market/indices
 * @desc    Get Indian market indices (Nifty 50, Sensex)
 * @access  Public
 */
router.get('/market/indices', async (req, res) => {
  try {
    const indicesData = await indianStockService.getIndianMarketIndices();
    res.json(indicesData);
  } catch (error) {
    console.error('Error fetching Indian market indices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Indian market indices',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/indian-stocks/market/gainers-losers
 * @desc    Get top gainers and losers in Indian market
 * @access  Public
 */
router.get('/market/gainers-losers', async (req, res) => {
  try {
    const gainersLosersData = await indianStockService.getIndianTopGainersLosers();
    res.json(gainersLosersData);
  } catch (error) {
    console.error('Error fetching Indian gainers and losers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Indian gainers and losers',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/indian-stocks/market/sectors
 * @desc    Get sector performance for Indian market
 * @access  Public
 */
router.get('/market/sectors', async (req, res) => {
  try {
    const sectorData = await indianStockService.getIndianSectorPerformance();
    res.json(sectorData);
  } catch (error) {
    console.error('Error fetching Indian sector performance:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Indian sector performance',
      message: error.message
    });
  }
});

export default router;
