import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { handleError } from '../utils/errorHandler.js';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || supabaseAnonKey;

// Create a Supabase client with the anon key (for public operations)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a Supabase admin client with the service key (for admin operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get stock data for a specific symbol
 * @param {string} symbol - The stock symbol
 * @returns {Promise<Object>} - Stock data
 */
export async function getStockData(symbol) {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('symbol', symbol)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleError(error, 'Database', `Failed to get stock data for ${symbol}`);
  }
}

/**
 * Get multiple stocks data
 * @param {Array<string>} symbols - Array of stock symbols
 * @param {string} market - Market (india, us)
 * @returns {Promise<Array<Object>>} - Array of stock data
 */
export async function getMultipleStocks(symbols, market = 'india') {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .in('symbol', symbols)
      .eq('market', market);
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleError(error, 'Database', `Failed to get multiple stocks data`);
  }
}

/**
 * Get market overview data
 * @param {string} market - Market (india, us)
 * @returns {Promise<Object>} - Market overview data
 */
export async function getMarketOverview(market = 'india') {
  try {
    // Get market indices
    const { data: indices, error: indicesError } = await supabase
      .from('market_indices')
      .select('*')
      .eq('market', market)
      .order('importance', { ascending: false });
    
    if (indicesError) throw indicesError;
    
    // Get market status
    const { data: status, error: statusError } = await supabase
      .from('market_status')
      .select('*')
      .eq('market', market)
      .single();
    
    if (statusError) throw statusError;
    
    // Get top gainers (stocks with highest positive change_percent)
    const { data: topGainers, error: gainersError } = await supabase
      .from('stocks')
      .select('symbol, name, price, change, change_percent')
      .eq('market', market)
      .gt('change_percent', 0)
      .order('change_percent', { ascending: false })
      .limit(5);
    
    if (gainersError) throw gainersError;
    
    // Get top losers (stocks with lowest negative change_percent)
    const { data: topLosers, error: losersError } = await supabase
      .from('stocks')
      .select('symbol, name, price, change, change_percent')
      .eq('market', market)
      .lt('change_percent', 0)
      .order('change_percent', { ascending: true })
      .limit(5);
    
    if (losersError) throw losersError;
    
    return {
      indices,
      status,
      topGainers,
      topLosers,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw handleError(error, 'Database', `Failed to get market overview for ${market}`);
  }
}

/**
 * Get stock chart data
 * @param {string} symbol - Stock symbol
 * @param {string} interval - Time interval (1d, 1w, 1m)
 * @param {string} range - Time range (1d, 1w, 1m, 3m, 6m, 1y, 2y, 5y)
 * @returns {Promise<Object>} - Chart data
 */
export async function getChartData(symbol, interval = '1d', range = '1m') {
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
    throw handleError(error, 'Database', `Failed to get chart data for ${symbol}`);
  }
}

/**
 * Get latest news
 * @param {string} market - Market (india, us)
 * @param {number} limit - Number of news items to return
 * @returns {Promise<Array<Object>>} - Array of news items
 */
export async function getNews(market = 'india', limit = 10) {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('market', market)
      .order('published_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleError(error, 'Database', `Failed to get news for ${market}`);
  }
}

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User profile
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleError(error, 'Database', 'Failed to get user profile');
  }
}

/**
 * Get user watchlist
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User watchlist
 */
export async function getUserWatchlist(userId) {
  try {
    const { data, error } = await supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    
    // If no watchlist exists, create one
    if (!data) {
      const { data: newWatchlist, error: createError } = await supabase
        .from('watchlists')
        .insert([{ user_id: userId, stocks: [] }])
        .select()
        .single();
      
      if (createError) throw createError;
      return newWatchlist;
    }
    
    return data;
  } catch (error) {
    throw handleError(error, 'Database', 'Failed to get user watchlist');
  }
}

/**
 * Update user watchlist
 * @param {string} userId - User ID
 * @param {Array<string>} stocks - Array of stock symbols
 * @returns {Promise<Object>} - Updated watchlist
 */
export async function updateUserWatchlist(userId, stocks) {
  try {
    const { data, error } = await supabase
      .from('watchlists')
      .update({ stocks, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    throw handleError(error, 'Database', 'Failed to update user watchlist');
  }
}

/**
 * Save stock data to database
 * @param {Array<Object>} stocks - Array of stock data
 * @returns {Promise<Object>} - Result of the operation
 */
export async function saveStocks(stocks) {
  try {
    // Use upsert to insert or update stocks
    const { data, error } = await supabaseAdmin
      .from('stocks')
      .upsert(stocks, { 
        onConflict: 'symbol',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
    return { success: true, count: stocks.length };
  } catch (error) {
    throw handleError(error, 'Database', 'Failed to save stocks data');
  }
}

/**
 * Save market indices to database
 * @param {Array<Object>} indices - Array of market indices data
 * @returns {Promise<Object>} - Result of the operation
 */
export async function saveMarketIndices(indices) {
  try {
    // Use upsert to insert or update indices
    const { data, error } = await supabaseAdmin
      .from('market_indices')
      .upsert(indices, { 
        onConflict: 'symbol',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
    return { success: true, count: indices.length };
  } catch (error) {
    throw handleError(error, 'Database', 'Failed to save market indices data');
  }
}

/**
 * Update market status
 * @param {string} market - Market (india, us)
 * @param {string} status - Market status (open, closed)
 * @param {string} nextOpen - Next market open time
 * @param {string} nextClose - Next market close time
 * @returns {Promise<Object>} - Result of the operation
 */
export async function updateMarketStatus(market, status, nextOpen, nextClose) {
  try {
    const { data, error } = await supabaseAdmin
      .from('market_status')
      .upsert([{
        market,
        status,
        next_open: nextOpen,
        next_close: nextClose,
        timestamp: new Date().toISOString()
      }], { 
        onConflict: 'market',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    throw handleError(error, 'Database', `Failed to update market status for ${market}`);
  }
}

/**
 * Save chart data to database
 * @param {string} symbol - Stock symbol
 * @param {string} interval - Time interval (1d, 1w, 1m)
 * @param {string} range - Time range (1d, 1w, 1m, 3m, 6m, 1y, 2y, 5y)
 * @param {Object} prices - Chart data
 * @returns {Promise<Object>} - Result of the operation
 */
export async function saveChartData(symbol, interval, range, prices) {
  try {
    const { data, error } = await supabaseAdmin
      .from('charts')
      .upsert([{
        symbol,
        interval,
        range,
        prices,
        timestamp: new Date().toISOString()
      }], { 
        onConflict: 'symbol,interval,range',
        ignoreDuplicates: false 
      });
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    throw handleError(error, 'Database', `Failed to save chart data for ${symbol}`);
  }
}

/**
 * Check database health
 * @returns {Promise<Object>} - Health status
 */
export async function checkHealth() {
  try {
    const { data, error } = await supabase
      .from('health_check')
      .select('*')
      .eq('service', 'supabase')
      .single();
    
    if (error) throw error;
    
    // Update the health check timestamp
    await supabaseAdmin
      .from('health_check')
      .update({ timestamp: new Date().toISOString() })
      .eq('service', 'supabase');
    
    return { 
      status: 'ok',
      message: 'Supabase connection successful',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Supabase health check failed:', error);
    return { 
      status: 'error',
      message: error.message || 'Supabase connection failed',
      timestamp: new Date().toISOString()
    };
  }
}

export default {
  supabase,
  supabaseAdmin,
  getStockData,
  getMultipleStocks,
  getMarketOverview,
  getChartData,
  getNews,
  getUserProfile,
  getUserWatchlist,
  updateUserWatchlist,
  saveStocks,
  saveMarketIndices,
  updateMarketStatus,
  saveChartData,
  checkHealth
};
