import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getMarketNews } from '@/services/indianMarketService';

// Define news item interface
export interface NewsItem {
  id?: string;
  title: string;
  content: string;
  excerpt?: string;
  snippet?: string;
  source: string;
  publishedAt: string;
  link: string;
  url?: string;
  image_url?: string;
  imageUrl?: string;
  symbols?: string[];
  tickers?: string[];
  tags?: string[];
  category?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

// Define categories and their associated keywords for categorization
export const NEWS_CATEGORIES = ["All", "Markets", "Economy", "Companies", "Technology", "Crypto", "Regulation", "Investing"];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Markets": ["market", "stock", "index", "nifty", "sensex", "nasdaq", "dow", "s&p", "rally", "bearish", "bullish", "trading"],
  "Economy": ["economy", "inflation", "gdp", "growth", "recession", "central bank", "fed", "rbi", "interest rate", "monetary"],
  "Companies": ["company", "earnings", "revenue", "profit", "ceo", "corporate", "business", "acquisition", "merger"],
  "Technology": ["tech", "technology", "digital", "software", "hardware", "ai", "artificial intelligence", "cloud", "data"],
  "Crypto": ["crypto", "bitcoin", "ethereum", "blockchain", "coin", "token", "defi", "nft", "web3"],
  "Regulation": ["regulation", "compliance", "law", "legal", "policy", "government", "regulatory", "sebi", "sec"],
  "Investing": ["invest", "portfolio", "asset", "fund", "etf", "mutual fund", "dividend", "return", "wealth"]
};

interface NewsContextState {
  globalNews: NewsItem[];
  indianNews: NewsItem[];
  categoryNews: Record<string, NewsItem[]>;
  loading: boolean;
  error: string | null;
  nextRefreshTime: Date;
  fetchNews: (category?: string) => Promise<void>;
  refreshNews: () => Promise<void>;
  categorizeNews: (news: NewsItem) => NewsItem;
}

// Create the context with default values
const NewsContext = createContext<NewsContextState>({
  globalNews: [],
  indianNews: [],
  categoryNews: {},
  loading: false,
  error: null,
  nextRefreshTime: new Date(),
  fetchNews: async () => {},
  refreshNews: async () => {},
  categorizeNews: (news) => news,
});

// Define News Provider props
interface NewsProviderProps {
  children: ReactNode;
}

// Auto-refresh interval in milliseconds (30 minutes)
const AUTO_REFRESH_INTERVAL = 30 * 60 * 1000;

export function NewsProvider({ children }: NewsProviderProps) {
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [indianNews, setIndianNews] = useState<NewsItem[]>([]);
  const [categoryNews, setCategoryNews] = useState<Record<string, NewsItem[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nextRefreshTime, setNextRefreshTime] = useState<Date>(new Date(Date.now() + AUTO_REFRESH_INTERVAL));

  // Helper function to categorize news based on content
  const categorizeNews = useCallback((news: NewsItem): NewsItem => {
    const content = `${news.title} ${news.content || news.snippet || news.excerpt || ''}`.toLowerCase();
    
    // Check content against keywords for each category
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => content.includes(keyword.toLowerCase()))) {
        return { ...news, category };
      }
    }
    
    return { ...news, category: "Other" };
  }, []);

  // Format news data from API
  const formatNewsData = useCallback((newsData: any[]): NewsItem[] => {
    if (!Array.isArray(newsData) || newsData.length === 0) {
      return [];
    }
    
    return newsData.map((article: any) => {
      // Generate a unique ID if not present
      const id = article.id || `${article.title?.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
      
      // Extract or create excerpt from content
      const excerpt = article.excerpt || article.snippet || 
        (article.content ? article.content.substring(0, 150) + '...' : 'No description available');
      
      // Use image_url or set a placeholder
      const imageUrl = article.image_url || article.imageUrl || 
        `https://placehold.co/600x400/e9f5ff/003566?text=Financial+News`;
      
      // Format the date string
      const publishedAt = article.date || article.published || article.publishedAt || new Date().toISOString();
      
      // Create a structured news item
      const newsItem: NewsItem = {
        id,
        title: article.title || 'No Title Available',
        content: article.content || article.text || excerpt,
        excerpt,
        snippet: excerpt,
        source: article.source || 'EODHD News',
        publishedAt,
        link: article.link || article.url || '#',
        url: article.link || article.url || '#',
        imageUrl,
        image_url: imageUrl,
        symbols: article.symbols || article.tickers || [],
        tags: article.tags || []
      };
      
      // Add category based on content analysis
      return categorizeNews(newsItem);
    });
  }, [categorizeNews]);

  // Fetch news data
  const fetchNews = useCallback(async (category?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Global news fetch parameters
      const globalParams = {
        limit: 30,
        sort: 'date',
        order: 'desc'
      };
      
      // Indian news fetch parameters (using major Indian stock symbols)
      const indianParams = {
        symbols: ['RELIANCE.NSE', 'TCS.NSE', 'HDFCBANK.NSE', 'INFY.NSE', 'SBIN.NSE'],
        limit: 30,
        sort: 'date',
        order: 'desc'
      };
      
      // Fetch news from Indian API
      const newsData = await getMarketNews(undefined, 50);
      
      // Format news data
      const formattedNews = newsData.map(item => ({
        id: item.url,
        title: item.title,
        content: item.description || '',
        excerpt: item.description || '',
        snippet: item.description || '',
        source: item.source,
        publishedAt: item.published_at,
        link: item.url,
        url: item.url,
        image_url: item.image_url,
        imageUrl: item.image_url,
        symbols: item.symbols || [],
        category: item.category
      }));
      
      // Set both global and Indian news to the same data
      setGlobalNews(formattedNews);
      setIndianNews(formattedNews);
      
      // Organize news by category
      const newsByCategory: Record<string, NewsItem[]> = {
        "All": formattedNews
      };
      
      // Categorize all news items
      formattedNews.forEach(item => {
        if (item.category) {
          newsByCategory[item.category] = newsByCategory[item.category] || [];
          newsByCategory[item.category].push(item);
        }
      });
      
      setCategoryNews(newsByCategory);
      
      // Set next refresh time
      setNextRefreshTime(new Date(Date.now() + AUTO_REFRESH_INTERVAL));
    } catch (err: any) {
      console.error("Error fetching news:", err);
      setError(err.message || "Failed to load news data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [formatNewsData, categorizeNews]);
  
  // Handle refresh action
  const refreshNews = useCallback(async () => {
    await fetchNews();
  }, [fetchNews]);
  
  // Auto-refresh on component mount and timer
  useEffect(() => {
    // Initial fetch
    fetchNews();
    
    // Set up auto-refresh timer
    const timer = setInterval(() => {
      fetchNews();
    }, AUTO_REFRESH_INTERVAL);
    
    // Cleanup timer on unmount
    return () => clearInterval(timer);
  }, [fetchNews]);
  
  // Create the context value object
  const value = {
    globalNews,
    indianNews,
    categoryNews,
    loading,
    error,
    nextRefreshTime,
    fetchNews,
    refreshNews,
    categorizeNews,
  };
  
  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}

// Custom hook for using the news context
export function useNews() {
  const context = useContext(NewsContext);
  
  if (context === undefined) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  
  return context;
}
