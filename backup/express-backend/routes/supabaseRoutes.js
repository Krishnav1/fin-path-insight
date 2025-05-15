/**
 * Supabase Routes for FinPath Insight
 * Provides endpoints for Supabase health check and data operations
 */

import express from 'express';
import supabaseService from '../services/supabaseService.js';
import { sendErrorResponse } from '../utils/errorHandler.js';

const router = express.Router();

/**
 * @route   GET /api/supabase/health
 * @desc    Check Supabase connection health
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await supabaseService.checkHealth();
    
    // Return health status
    res.json({
      success: healthStatus.status === 'ok',
      message: healthStatus.message,
      timestamp: healthStatus.timestamp,
      service: 'supabase'
    });
  } catch (error) {
    sendErrorResponse(error, res);
  }
});

/**
 * @route   GET /api/supabase/stocks/:symbol
 * @desc    Get stock data for a specific symbol
 * @access  Public
 */
router.get('/stocks/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const stockData = await supabaseService.getStockData(symbol);
    
    if (!stockData) {
      return res.status(404).json({
        success: false,
        message: `Stock data for ${symbol} not found`
      });
    }
    
    res.json({
      success: true,
      data: stockData
    });
  } catch (error) {
    sendErrorResponse(error, res);
  }
});

/**
 * @route   GET /api/supabase/market-overview
 * @desc    Get market overview data
 * @access  Public
 */
router.get('/market-overview', async (req, res) => {
  try {
    const { market = 'india' } = req.query;
    const marketData = await supabaseService.getMarketOverview(market);
    
    res.json({
      success: true,
      data: marketData
    });
  } catch (error) {
    sendErrorResponse(error, res);
  }
});

/**
 * @route   GET /api/supabase/news
 * @desc    Get latest news
 * @access  Public
 */
router.get('/news', async (req, res) => {
  try {
    const { market = 'india', limit = 10 } = req.query;
    const news = await supabaseService.getNews(market, parseInt(limit));
    
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    sendErrorResponse(error, res);
  }
});

/**
 * @route   GET /api/supabase/charts/:symbol
 * @desc    Get chart data for a specific symbol
 * @access  Public
 */
router.get('/charts/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1d', range = '1m' } = req.query;
    const chartData = await supabaseService.getChartData(symbol, interval, range);
    
    if (!chartData) {
      return res.status(404).json({
        success: false,
        message: `Chart data for ${symbol} not found`
      });
    }
    
    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    sendErrorResponse(error, res);
  }
});

/**
 * @route   GET /api/supabase/user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/user/profile', async (req, res) => {
  try {
    // This would normally use authentication middleware to get the user ID
    // For now, we'll use a placeholder
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const profile = await supabaseService.getUserProfile(userId);
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    sendErrorResponse(error, res);
  }
});

/**
 * @route   GET /api/supabase/user/watchlist
 * @desc    Get user watchlist
 * @access  Private
 */
router.get('/user/watchlist', async (req, res) => {
  try {
    // This would normally use authentication middleware to get the user ID
    // For now, we'll use a placeholder
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const watchlist = await supabaseService.getUserWatchlist(userId);
    
    res.json({
      success: true,
      data: watchlist
    });
  } catch (error) {
    sendErrorResponse(error, res);
  }
});

/**
 * @route   PUT /api/supabase/user/watchlist
 * @desc    Update user watchlist
 * @access  Private
 */
router.put('/user/watchlist', async (req, res) => {
  try {
    // This would normally use authentication middleware to get the user ID
    // For now, we'll use a placeholder
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { stocks } = req.body;
    
    if (!stocks || !Array.isArray(stocks)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid watchlist data'
      });
    }
    
    const updatedWatchlist = await supabaseService.updateUserWatchlist(userId, stocks);
    
    res.json({
      success: true,
      data: updatedWatchlist
    });
  } catch (error) {
    sendErrorResponse(error, res);
  }
});

export default router;
