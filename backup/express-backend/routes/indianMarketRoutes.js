import express from 'express';
import { getMarketStatus, getMarketOverviewData, getIndexGainersLosers, getTopNseStocks } from '../services/nseMarketService.js';

const router = express.Router();

// Route to get the current Indian market status
router.get('/status', async (req, res) => {
  try {
    const marketStatus = await getMarketStatus();
    if (marketStatus.error) {
      res.status(500).json({ message: 'Error fetching market status', details: marketStatus.error });
    } else {
      res.json(marketStatus);
    }
  } catch (error) {
    console.error('Route error /market/status:', error);
    res.status(500).json({ message: 'Server error while fetching market status' });
  }
});

// Route to get market overview data (key indices and market breadth)
router.get('/overview', async (req, res) => {
  try {
    const overviewData = await getMarketOverviewData();
    if (overviewData.error) {
      res.status(500).json({ message: 'Error fetching market overview data', details: overviewData.error });
    } else {
      res.json(overviewData);
    }
  } catch (error) {
    console.error('Route error /market/overview:', error);
    res.status(500).json({ message: 'Server error while fetching market overview data' });
  }
});

// Route to get top N gainers and losers for a specific index
router.get('/index-movers/:indexSymbol', async (req, res) => {
  try {
    const { indexSymbol } = req.params;
    const topN = req.query.topN ? parseInt(req.query.topN, 10) : 5; // Default to top 5 if not specified

    if (!indexSymbol) {
      return res.status(400).json({ message: 'Index symbol parameter is required.' });
    }

    const moversData = await getIndexGainersLosers(indexSymbol, topN);

    if (moversData.error) {
      res.status(500).json({ message: `Error fetching gainers/losers for index ${indexSymbol}`, details: moversData.error });
    } else {
      res.json(moversData);
    }
  } catch (error) {
    console.error(`Route error /market/index-movers/${req.params.indexSymbol}:`, error);
    res.status(500).json({ message: 'Server error while fetching index gainers/losers' });
  }
});

// Route to get top NSE stocks
router.get('/top-stocks', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const topStocks = await getTopNseStocks(limit);
    
    if (topStocks.error) {
      res.status(500).json({ message: 'Error fetching top NSE stocks', details: topStocks.error });
    } else {
      res.json(topStocks);
    }
  } catch (error) {
    console.error('Route error /market/top-stocks:', error);
    res.status(500).json({ message: 'Server error while fetching top NSE stocks' });
  }
});

// Route to get stock details (placeholder for future implementation)
router.get('/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // This is a placeholder response until the actual implementation
    res.json({
      symbol: symbol,
      message: 'Stock details endpoint is under development',
      redirectTo: `/company-analysis/${symbol}` // For frontend to use for redirection
    });
  } catch (error) {
    console.error(`Route error /market/stock/${req.params.symbol}:`, error);
    res.status(500).json({ message: 'Server error while fetching stock details' });
  }
});

export default router;
