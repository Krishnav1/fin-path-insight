import axios from 'axios';

const BASE_URL = '/api/market-data'; // Update if your proxy path is different
const FUNCTIONS_BASE_URL = '/functions/v1'; // Supabase Edge Functions base URL

// Helper to map EODHD response to frontend format
function mapEodhdStock(item) {
  return {
    symbol: item.symbol || item.code,
    name: item.name || item.symbol || item.code,
    currentPrice: item.price || item.close,
    change: item.change,
    changePercent: item.changePercent || item.change_p,
    volume: item.volume,
    lastUpdated: item.lastUpdated,
  };
}

// Fetch one or more stocks (global or Indian)
export async function fetchStocks({ symbols = [], market = 'global' }) {
  if (!Array.isArray(symbols)) symbols = [symbols];
  const symbolParam = symbols.join(',');
  try {
    const response = await axios.get(
      `${BASE_URL}?type=stocks&symbol=${encodeURIComponent(symbolParam)}&market=${market}`
    );
    // Always return an array
    return (Array.isArray(response.data) ? response.data : [response.data])
      .map(mapEodhdStock);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    throw error;
  }
}

// Fetch top gainers and losers from backend
export async function fetchGainersLosers() {
  try {
    const response = await axios.get('/api/market-data/gainers-losers');
    return response.data;
  } catch (error) {
    console.error('Error fetching gainers/losers:', error);
    throw error;
  }
}

// Fetch sector performance from backend
export async function fetchSectorPerformance() {
  try {
    const response = await axios.get('/api/market-data/sector-performance');
    return response.data;
  } catch (error) {
    console.error('Error fetching sector performance:', error);
    throw error;
  }
}
// Generic function to fetch market stocks for any market
export async function fetchMarketStocks(market, { search = '', limit = 20 } = {}) {
  try {
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (limit) params.push(`limit=${limit}`);
    const url = `${FUNCTIONS_BASE_URL}/${market}-market${params.length ? '?' + params.join('&') : ''}`;
    const response = await axios.get(url);
    // Response shape: { stocks: [...] }
    return (response.data.stocks || []).map(item => mapEodhdStock(item));
  } catch (error) {
    console.error(`Error fetching ${market} market stocks:`, error);
    throw error;
  }
}

// Fetch Indian market stocks
export async function fetchIndianMarketStocks(options = {}) {
  return fetchMarketStocks('indian', options);
}

// Fetch US market stocks
export async function fetchUSMarketStocks(options = {}) {
  return fetchMarketStocks('us', options);
}

// Fetch European market stocks
export async function fetchEuropeanMarketStocks(options = {}) {
  return fetchMarketStocks('european', options);
}

// Fetch China market stocks
export async function fetchChinaMarketStocks(options = {}) {
  return fetchMarketStocks('china', options);
}

// Fetch market indices for a specific market
export async function fetchMarketIndices(market = 'us') {
  try {
    const url = `${FUNCTIONS_BASE_URL}/market-indices?market=${market}`;
    const response = await axios.get(url);
    return response.data.indices || [];
  } catch (error) {
    console.error(`Error fetching ${market} market indices:`, error);
    throw error;
  }
}

// Add more functions as needed for indices, history, etc.
