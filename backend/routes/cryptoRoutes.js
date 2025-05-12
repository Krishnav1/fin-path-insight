import express from 'express';
import cryptoService from '../services/cryptoService.js';
import Crypto from '../models/Crypto.js';

const router = express.Router();

/**
 * @route   GET /api/crypto/:coinId
 * @desc    Get crypto data by coinId
 * @access  Public
 */
router.get('/:coinId', async (req, res) => {
  try {
    const { coinId } = req.params;
    const cryptoData = await cryptoService.getCryptoData(coinId);
    res.json(cryptoData);
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch crypto data',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/crypto
 * @desc    Get all cryptos or search by name/symbol
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { search, limit = 10 } = req.query;
    
    if (search) {
      // Use CoinGecko search API if search parameter is provided
      const searchResults = await cryptoService.searchCryptos(search);
      return res.json(searchResults);
    }
    
    // Otherwise, return cached cryptos from our database
    const cryptos = await Crypto.find()
      .select('coinId symbol name price change24h changePercent24h marketCap lastUpdated')
      .sort({ marketCap: -1 })
      .limit(parseInt(limit));
    
    res.json(cryptos);
  } catch (error) {
    console.error('Error fetching cryptocurrencies:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cryptocurrencies',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/crypto/:coinId/market
 * @desc    Get crypto market data
 * @access  Public
 */
router.get('/:coinId/market', async (req, res) => {
  try {
    const { coinId } = req.params;
    const { days = '365' } = req.query;
    
    const marketData = await cryptoService.fetchCryptoMarketData(coinId, days);
    res.json(marketData);
  } catch (error) {
    console.error('Error fetching crypto market data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch crypto market data',
      message: error.message
    });
  }
});

export default router; 