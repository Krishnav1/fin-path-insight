/**
 * Supabase Service for FinPath Insight
 * Provides database access and authentication using Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ydakwyplcqoshxcdllah.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYWt3eXBsY3Fvc2h4Y2RsbGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTAwNTMsImV4cCI6MjA2Mjc4NjA1M30.J0c0YqSsR9XbtbYLVOq6oqQwYQ3G7j65Q0stEtS4W2s';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Stock data table operations
 */
const stocksService = {
  /**
   * Get stock data for a specific symbol
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Stock data
   */
  async getStockData(symbol) {
    try {
      const { data, error } = await supabase
        .from('stocks')
        .select('*')
        .eq('symbol', symbol)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      return null;
    }
  },
  
  /**
   * Get market overview data
   * @param {string} market - Market (india, us, global)
   * @returns {Promise<Object>} Market overview data
   */
  async getMarketOverview(market = 'india') {
    try {
      // Get indices for the specified market
      const { data: indices, error: indicesError } = await supabase
        .from('market_indices')
        .select('*')
        .eq('market', market)
        .order('importance', { ascending: true });
      
      if (indicesError) throw indicesError;
      
      // Get top gainers for the specified market
      const { data: topGainers, error: gainersError } = await supabase
        .from('stocks')
        .select('*')
        .eq('market', market)
        .order('change_percent', { ascending: false })
        .limit(10);
      
      if (gainersError) throw gainersError;
      
      // Get top losers for the specified market
      const { data: topLosers, error: losersError } = await supabase
        .from('stocks')
        .select('*')
        .eq('market', market)
        .order('change_percent', { ascending: true })
        .limit(10);
      
      if (losersError) throw losersError;
      
      // Get most active stocks for the specified market
      const { data: mostActive, error: activeError } = await supabase
        .from('stocks')
        .select('*')
        .eq('market', market)
        .order('volume', { ascending: false })
        .limit(10);
      
      if (activeError) throw activeError;
      
      // Get market status
      const { data: marketStatus, error: statusError } = await supabase
        .from('market_status')
        .select('*')
        .eq('market', market)
        .single();
      
      if (statusError) throw statusError;
      
      return {
        indices,
        topGainers,
        topLosers,
        mostActive,
        marketStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching market overview:', error);
      return null;
    }
  },
  
  /**
   * Save or update stock data
   * @param {Object} stockData - Stock data to save
   * @returns {Promise<Object>} Saved stock data
   */
  async saveStockData(stockData) {
    try {
      const { data, error } = await supabase
        .from('stocks')
        .upsert(stockData, { onConflict: 'symbol' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving stock data:', error);
      return null;
    }
  },
  
  /**
   * Update multiple stocks at once
   * @param {Array} stocksData - Array of stock data objects
   * @returns {Promise<Array>} Updated stocks data
   */
  async updateStocks(stocksData) {
    try {
      const { data, error } = await supabase
        .from('stocks')
        .upsert(stocksData, { onConflict: 'symbol' })
        .select();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating stocks:', error);
      return [];
    }
  }
};

/**
 * User data and preferences operations
 */
const userService = {
  /**
   * Get user profile
   * @returns {Promise<Object>} User profile
   */
  async getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },
  
  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(profileData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...profileData })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  },
  
  /**
   * Get user watchlist
   * @returns {Promise<Array>} User watchlist
   */
  async getWatchlist() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('watchlists')
        .select('stocks')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data?.stocks || [];
    } catch (error) {
      console.error('Error fetching user watchlist:', error);
      return [];
    }
  },
  
  /**
   * Update user watchlist
   * @param {Array} symbols - Array of stock symbols
   * @returns {Promise<Array>} Updated watchlist
   */
  async updateWatchlist(symbols) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('watchlists')
        .upsert({ user_id: user.id, stocks: symbols })
        .select()
        .single();
      
      if (error) throw error;
      return data?.stocks || [];
    } catch (error) {
      console.error('Error updating user watchlist:', error);
      return [];
    }
  }
};

/**
 * News data operations
 */
const newsService = {
  /**
   * Get latest news
   * @param {string} market - Market (india, us, global)
   * @param {number} limit - Number of news items to return
   * @returns {Promise<Array>} News items
   */
  async getLatestNews(market = 'global', limit = 10) {
    try {
      const query = supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(limit);
      
      if (market !== 'global') {
        query.eq('market', market);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching latest news:', error);
      return [];
    }
  },
  
  /**
   * Get company news
   * @param {string} symbol - Stock symbol
   * @param {number} limit - Number of news items to return
   * @returns {Promise<Array>} News items
   */
  async getCompanyNews(symbol, limit = 5) {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .ilike('tags', `%${symbol}%`)
        .order('published_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching company news:', error);
      return [];
    }
  },
  
  /**
   * Save news item
   * @param {Object} newsItem - News item to save
   * @returns {Promise<Object>} Saved news item
   */
  async saveNewsItem(newsItem) {
    try {
      const { data, error } = await supabase
        .from('news')
        .upsert(newsItem, { onConflict: 'url' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving news item:', error);
      return null;
    }
  }
};

/**
 * Financial data operations
 */
const financialDataService = {
  /**
   * Get stock financials
   * @param {string} symbol - Stock symbol
   * @returns {Promise<Object>} Financial data
   */
  async getStockFinancials(symbol) {
    try {
      const { data, error } = await supabase
        .from('financials')
        .select('*')
        .eq('symbol', symbol)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching stock financials:', error);
      return null;
    }
  },
  
  /**
   * Get stock chart data
   * @param {string} symbol - Stock symbol
   * @param {string} interval - Chart interval (1d, 1w, 1m, etc.)
   * @param {string} range - Chart range (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max)
   * @returns {Promise<Object>} Chart data
   */
  async getStockChart(symbol, interval = '1d', range = '1y') {
    try {
      const { data, error } = await supabase
        .from('charts')
        .select('*')
        .eq('symbol', symbol)
        .eq('interval', interval)
        .eq('range', range)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching stock chart:', error);
      return null;
    }
  },
  
  /**
   * Save stock chart data
   * @param {Object} chartData - Chart data to save
   * @returns {Promise<Object>} Saved chart data
   */
  async saveStockChart(chartData) {
    try {
      const { data, error } = await supabase
        .from('charts')
        .upsert(chartData, { onConflict: 'symbol, interval, range' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving stock chart:', error);
      return null;
    }
  }
};

/**
 * Authentication operations
 */
const authService = {
  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  async signUp(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },
  
  /**
   * Sign in a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },
  
  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },
  
  /**
   * Get the current user
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  /**
   * Reset password
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }
};

// Export all services
export {
  supabase,
  stocksService,
  userService,
  newsService,
  financialDataService,
  authService
};

// Default export for convenience
export default {
  supabase,
  stocks: stocksService,
  users: userService,
  news: newsService,
  financials: financialDataService,
  auth: authService
};
