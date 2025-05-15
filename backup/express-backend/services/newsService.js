// backend/services/newsService.js
// Service for fetching financial news from various APIs

import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configure dotenv to load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// API Keys from environment variables
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';
const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const GNEWS_API_KEY = process.env.GNEWS_API_KEY || '';

/**
 * Fetch news from Alpha Vantage API
 * @param {string} query - Search query (company name or market)
 * @param {number} limit - Number of news articles to fetch
 * @returns {Promise<Array>} - Array of news articles
 */
export async function fetchNewsFromAlphaVantage(query, limit = 5) {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.error('Alpha Vantage API key not found');
    return null;
  }
  
  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'NEWS_SENTIMENT',
        keywords: query,
        limit: limit,
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });
    
    if (response.data && response.data.feed) {
      return response.data.feed.map(article => ({
        title: article.title,
        url: article.url,
        source: article.source,
        publishedAt: article.time_published,
        snippet: article.summary || article.title
      }));
    } else {
      console.error('Invalid response from Alpha Vantage News API:', response.data);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching news from Alpha Vantage for "${query}":`, error);
    return null;
  }
}

/**
 * Fetch news from NewsAPI.org
 * @param {string} query - Search query (company name or market)
 * @param {number} limit - Number of news articles to fetch
 * @returns {Promise<Array>} - Array of news articles
 */
export async function fetchNewsFromNewsAPI(query, limit = 5) {
  if (!NEWS_API_KEY) {
    console.error('NewsAPI key not found');
    return null;
  }
  
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: limit,
        apiKey: NEWS_API_KEY
      }
    });
    
    if (response.data && response.data.articles) {
      return response.data.articles.map(article => ({
        title: article.title,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        snippet: article.description || article.title,
        urlToImage: article.urlToImage
      }));
    } else {
      console.error('Invalid response from NewsAPI:', response.data);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching news from NewsAPI for "${query}":`, error);
    return null;
  }
}

/**
 * Fetch news from GNews API
 * @param {string} query - Search query (company name or market)
 * @param {number} limit - Number of news articles to fetch
 * @returns {Promise<Array>} - Array of news articles
 */
export async function fetchNewsFromGNews(query, limit = 5) {
  if (!GNEWS_API_KEY) {
    console.error('GNews API key not found');
    return null;
  }
  
  try {
    const response = await axios.get('https://gnews.io/api/v4/search', {
      params: {
        q: query,
        lang: 'en',
        max: limit,
        token: GNEWS_API_KEY
      }
    });
    
    if (response.data && response.data.articles) {
      return response.data.articles.map(article => ({
        title: article.title,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        snippet: article.description || article.title,
        urlToImage: article.image
      }));
    } else {
      console.error('Invalid response from GNews API:', response.data);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching news from GNews for "${query}":`, error);
    return null;
  }
}

/**
 * Fetch financial news using available APIs with fallback options
 * @param {string} query - Search query (company name or market)
 * @param {number} limit - Number of news articles to fetch
 * @param {string} category - News category (markets, economy, companies, etc.)
 * @returns {Promise<Array>} - Array of news articles
 */
export async function fetchFinancialNews(query, limit = 5, category = '') {
  // Add category to query if provided
  const enhancedQuery = category ? `${query} ${category}` : query;
  
  // Try Alpha Vantage first (most reliable for financial news)
  const alphaVantageNews = await fetchNewsFromAlphaVantage(enhancedQuery, limit);
  if (alphaVantageNews && alphaVantageNews.length > 0) {
    // Add category to each news item
    return alphaVantageNews.map(item => ({
      ...item,
      category: category || detectNewsCategory(item.title, item.snippet)
    }));
  }
  
  // Try NewsAPI as second option
  const newsAPINews = await fetchNewsFromNewsAPI(enhancedQuery, limit);
  if (newsAPINews && newsAPINews.length > 0) {
    // Add category to each news item
    return newsAPINews.map(item => ({
      ...item,
      category: category || detectNewsCategory(item.title, item.snippet)
    }));
  }
  
  // Try GNews as third option
  const gNewsNews = await fetchNewsFromGNews(enhancedQuery, limit);
  if (gNewsNews && gNewsNews.length > 0) {
    // Add category to each news item
    return gNewsNews.map(item => ({
      ...item,
      category: category || detectNewsCategory(item.title, item.snippet)
    }));
  }
  
  // If all APIs fail, return null to trigger fallback to mock data
  return null;
}

/**
 * Detect news category based on content
 * @param {string} title - News title
 * @param {string} content - News content
 * @returns {string} - Detected category
 */
function detectNewsCategory(title, content) {
  const combinedText = `${title} ${content}`.toLowerCase();
  
  // Define category keywords
  const categoryKeywords = {
    'markets': ['market', 'stock', 'index', 'trading', 'nasdaq', 'nyse', 'sensex', 'nifty', 'dow', 's&p', 'bull', 'bear'],
    'economy': ['economy', 'gdp', 'inflation', 'recession', 'economic', 'fed', 'central bank', 'interest rate', 'fiscal', 'monetary'],
    'companies': ['company', 'earnings', 'profit', 'revenue', 'ceo', 'acquisition', 'merger', 'ipo', 'quarterly', 'annual report'],
    'technology': ['tech', 'technology', 'ai', 'artificial intelligence', 'software', 'hardware', 'app', 'digital', 'cyber', 'cloud'],
    'crypto': ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'token', 'coin', 'defi', 'nft', 'mining', 'wallet'],
    'regulation': ['regulation', 'compliance', 'sec', 'law', 'legal', 'policy', 'regulator', 'fine', 'settlement', 'investigation'],
    'investing': ['invest', 'portfolio', 'asset', 'fund', 'etf', 'mutual fund', 'dividend', 'bond', 'retirement', 'strategy']
  };
  
  // Count keyword matches for each category
  const categoryScores = {};
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    categoryScores[category] = keywords.reduce((score, keyword) => {
      return score + (combinedText.includes(keyword) ? 1 : 0);
    }, 0);
  }
  
  // Find category with highest score
  let bestCategory = 'markets'; // Default category
  let highestScore = 0;
  
  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }
  
  return bestCategory;
}

/**
 * Get company-specific news
 * @param {string} symbol - Stock symbol
 * @param {string} companyName - Company name
 * @returns {Promise<Array>} - Array of news articles
 */
export async function getCompanyNews(symbol, companyName) {
  // Create a query that includes both the company name and symbol
  const query = `${companyName} ${symbol} stock`;
  
  // Fetch news using the combined query
  return await fetchFinancialNews(query, 5);
}

/**
 * Get market-specific news
 * @param {string} market - Market name (e.g., 'india', 'us')
 * @returns {Promise<Array>} - Array of news articles
 */
export async function getMarketNews(market) {
  let marketQuery = 'stock market';
  
  if (market === 'india') {
    marketQuery = 'indian stock market nse bse';
  } else if (market === 'us') {
    marketQuery = 'us stock market nasdaq nyse';
  } else if (market === 'uk') {
    marketQuery = 'uk stock market lse ftse';
  } else if (market === 'global') {
    marketQuery = 'global stock market finance';
  }
  
  // Fetch news using the market query
  return await fetchFinancialNews(marketQuery, 5);
}
