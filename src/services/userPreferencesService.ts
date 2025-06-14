/**
 * User Preferences Service
 * Handles watchlist and other user preferences that are stored in localStorage
 */

// Watchlist key in localStorage
const WATCHLIST_KEY = 'fin-path-insight_watchlist';

// Define watchlist item interface
export interface WatchlistItem {
  symbol: string;     // Stock symbol (e.g., "RELIANCE.NSE")
  addedAt: number;    // Timestamp when added
}

/**
 * Get the user's watchlist
 */
export function getWatchlist(): WatchlistItem[] {
  try {
    const watchlistStr = localStorage.getItem(WATCHLIST_KEY);
    return watchlistStr ? JSON.parse(watchlistStr) : [];
  } catch (error) {
    console.error('Error getting watchlist:', error);
    return [];
  }
}

/**
 * Add a stock to the watchlist
 */
export function addToWatchlist(symbol: string, p0: string): WatchlistItem[] {
  try {
    // Ensure we have the .NSE suffix
    const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.NSE`;
    
    // Get current watchlist
    const watchlist = getWatchlist();
    
    // Check if already in watchlist
    if (!watchlist.some(item => item.symbol === formattedSymbol)) {
      watchlist.push({
        symbol: formattedSymbol,
        addedAt: Date.now(),
      });
      
      // Save updated watchlist
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    }
    
    return watchlist;
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return getWatchlist();
  }
}

/**
 * Remove a stock from the watchlist
 */
export function removeFromWatchlist(symbol: string): WatchlistItem[] {
  try {
    // Ensure we have the .NSE suffix
    const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.NSE`;
    
    // Get current watchlist
    let watchlist = getWatchlist();
    
    // Filter out the symbol
    watchlist = watchlist.filter(item => item.symbol !== formattedSymbol);
    
    // Save updated watchlist
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    
    return watchlist;
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return getWatchlist();
  }
}

/**
 * Check if a stock is in the watchlist
 */
export function isInWatchlist(symbol: string): boolean {
  try {
    // Ensure we have the .NSE suffix
    const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.NSE`;
    
    // Get watchlist and check
    const watchlist = getWatchlist();
    return watchlist.some(item => item.symbol === formattedSymbol);
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
}

/**
 * Clear the entire watchlist
 */
export function clearWatchlist(): void {
  try {
    localStorage.removeItem(WATCHLIST_KEY);
  } catch (error) {
    console.error('Error clearing watchlist:', error);
  }
}
