import axios from 'axios';

const BASE_URL = '/api/market-data'; // Update if your proxy path is different

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
// Fetch Indian market stocks from the new backend endpoint
export async function fetchIndianMarketStocks({ search = '', limit = 20 } = {}) {
  try {
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (limit) params.push(`limit=${limit}`);
    const url = `/functions/v1/indian-market${params.length ? '?' + params.join('&') : ''}`;
    const response = await axios.get(url);
    // Response shape: { stocks: [...] }
    return (response.data.stocks || []).map(item => {
      // Remove .NSE if present (defensive)
      const cleanSymbol = item.symbol.replace(/\.NSE$/, '');
      return { ...mapEodhdStock(item), symbol: cleanSymbol };
    });
  } catch (error) {
    console.error('Error fetching Indian market stocks:', error);
    throw error;
  }
}

// Add more functions as needed for indices, history, etc.
