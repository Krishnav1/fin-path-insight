import axios from 'axios';

// API base URL
const API_BASE_URL = '/api';

// Stock types
export interface StockSummary {
  symbol: string;
  displaySymbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

export interface FinancialData {
  year: number;
  revenue: number;
  netIncome: number;
}

export interface ChartDataPoint {
  date: string;
  close: number;
  volume: number;
}

export interface StockDetails {
  symbol: string;
  displaySymbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  peRatio: number;
  eps: number;
  roe: number;
  debtToEquity: number;
  volume: number;
  financialData: FinancialData[];
  chartData: ChartDataPoint[];
  lastUpdated: string;
}

// Crypto types
export interface CryptoSummary {
  coinId: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  lastUpdated: string;
}

export interface MarketDataPoint {
  date: string;
  price: number;
  volume: number | null;
}

export interface CryptoDetails {
  coinId: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  totalVolume: number;
  circulatingSupply: number;
  maxSupply: number | null;
  ath: number;
  athDate: string;
  marketData: MarketDataPoint[];
  lastUpdated: string;
}

export interface CryptoSearchResult {
  id: string;
  symbol: string;
  name: string;
  thumb: string;
}

// Stock API
export const getStocks = async (search?: string): Promise<StockSummary[]> => {
  try {
    const params = search ? { search } : {};
    const response = await axios.get(`${API_BASE_URL}/stocks`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching stocks:', error);
    throw error;
  }
};

export const getStockDetails = async (symbol: string): Promise<StockDetails> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stocks/${symbol}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching stock details for ${symbol}:`, error);
    throw error;
  }
};

export const getStockChart = async (
  symbol: string,
  interval: string = '1d',
  range: string = '1y'
): Promise<ChartDataPoint[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stocks/${symbol}/chart`, {
      params: { interval, range }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching stock chart for ${symbol}:`, error);
    throw error;
  }
};

export const getStockFinancials = async (symbol: string): Promise<FinancialData[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stocks/${symbol}/financials`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching financials for ${symbol}:`, error);
    throw error;
  }
};

// Crypto API
export const getCryptos = async (search?: string): Promise<CryptoSummary[] | CryptoSearchResult[]> => {
  try {
    const params = search ? { search } : {};
    const response = await axios.get(`${API_BASE_URL}/crypto`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching cryptocurrencies:', error);
    throw error;
  }
};

export const getCryptoDetails = async (coinId: string): Promise<CryptoDetails> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/crypto/${coinId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching crypto details for ${coinId}:`, error);
    throw error;
  }
};

export const getCryptoMarket = async (
  coinId: string,
  days: string = '365'
): Promise<MarketDataPoint[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/crypto/${coinId}/market`, {
      params: { days }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching crypto market data for ${coinId}:`, error);
    throw error;
  }
};

// Static data API for high-traffic scenarios
export const getStaticStockData = async (symbol: string): Promise<StockDetails | null> => {
  try {
    const cleanSymbol = symbol.split('.')[0]; // Convert "TCS.NS" to "TCS"
    const response = await axios.get(`/data/stock-${cleanSymbol}.json`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching static stock data for ${symbol}:`, error);
    return null; // Fall back to dynamic data
  }
};

export const getStaticCryptoData = async (coinId: string): Promise<CryptoDetails | null> => {
  try {
    const response = await axios.get(`/data/crypto-${coinId}.json`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching static crypto data for ${coinId}:`, error);
    return null; // Fall back to dynamic data
  }
};

export const getStaticStocksList = async (): Promise<StockSummary[]> => {
  try {
    const response = await axios.get('/data/stocks-list.json');
    return response.data.stocks;
  } catch (error) {
    console.error('Error fetching static stocks list:', error);
    return []; // Fall back to dynamic data
  }
};

export const getStaticCryptosList = async (): Promise<CryptoSummary[]> => {
  try {
    const response = await axios.get('/data/cryptos-list.json');
    return response.data.cryptos;
  } catch (error) {
    console.error('Error fetching static cryptos list:', error);
    return []; // Fall back to dynamic data
  }
}; 