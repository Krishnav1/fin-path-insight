import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { callEdgeFunction } from '@/lib/edge-function-client';
import { API_ENDPOINTS } from '@/config/api-config';

// Supabase client setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define GeminiAnalysis interface for portfolio analysis results
export interface GeminiAnalysis {
  overview: {
    total_invested: string;
    market_value: string;
    absolute_return: string;
    percent_return: string;
    top_gainer: string;
    worst_performer: string;
  };
  stock_breakdown: Array<{
    symbol: string;
    sector: string;
    percent_gain: string;
    recommendation: string;
  }>;
  diversification: {
    sector_breakdown: Record<string, string>;
    risk_flag: 'High' | 'Medium' | 'Low';
  };
  recommendations: string[];
  summary: string;
}

// Define Stock interface
export interface Stock {
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  value: number;
  profit: number;
  profitPercentage: number;
  allocation: number;
  sector: string;
  id?: string;
}

// Define ImportedStock interface
export interface ImportedStock {
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  sector: string;
  buyDate?: string;
  currentPrice?: number;
  id?: string;
}

export function usePortfolio() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysis | null>(null);
  const [analysisCache, setAnalysisCache] = useState<{timestamp: number, data: GeminiAnalysis} | null>(null);

  // Fetch user's portfolio and holdings
  const fetchUserPortfolio = async () => {
    if (!user) {
      toast({
        title: 'Not Authenticated',
        description: 'Please log in to view your portfolio.',
        variant: 'destructive'
      });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // 1. Get or create user's portfolio
      const { data: portfolios, error: portfolioError } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      let currentPortfolioId;

      if (portfolioError) throw portfolioError;

      if (portfolios && portfolios.length > 0) {
        currentPortfolioId = portfolios[0].id;
      } else {
        // Create a portfolio if none exists
        if (!user) {
          toast({
            title: 'Not Authenticated',
            description: 'Please log in to create a portfolio.',
            variant: 'destructive'
          });
          return;
        }
        const { data: newPortfolio, error: createError } = await supabase
          .from('portfolios')
          .insert([{ 
            user_id: user.id, 
            name: 'My Portfolio', 
            description: 'My investment portfolio',
            is_public: false
          }])
          .select();

        if (createError) throw createError;
        currentPortfolioId = newPortfolio[0].id;
      }

      setPortfolioId(currentPortfolioId);

      // 2. Get portfolio holdings
      const { data: holdings, error: holdingsError } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('portfolio_id', currentPortfolioId);

      if (holdingsError) throw holdingsError;

      if (holdings && holdings.length > 0) {
        // Format holdings to match the UI state format
        const formattedStocks = holdings.map(holding => ({
          symbol: holding.symbol,
          name: holding.name || holding.symbol,
          quantity: Number(holding.quantity),
          buyPrice: Number(holding.buy_price || holding.purchase_price),
          currentPrice: Number(holding.current_price || holding.buy_price || holding.purchase_price),
          value: Number(holding.quantity) * Number(holding.current_price || holding.buy_price || holding.purchase_price),
          profit: Number(holding.current_price - holding.buy_price) * Number(holding.quantity),
          profitPercentage: ((Number(holding.current_price) / Number(holding.buy_price)) - 1) * 100,
          allocation: 0, // Will calculate this after getting all holdings
          sector: holding.sector || 'Other',
        }));

        // Calculate allocation percentages
        const totalValue = formattedStocks.reduce((sum, stock) => sum + stock.value, 0);
        formattedStocks.forEach(stock => {
          stock.allocation = (stock.value / totalValue) * 100;
        });

        setStocks(formattedStocks);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast({
        title: 'Error',
        description: 'Failed to load portfolio data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch current stock price from EODHD API via Supabase Edge Function
  const fetchStockData = async (symbol: string) => {
    try {
      // Make authenticated request to Supabase Edge Function using the centralized client
      const { data, error } = await callEdgeFunction(
        `${API_ENDPOINTS.EODHD_REALTIME}/${symbol}?fmt=json`,
        'GET'
      );
      
      if (error) throw new Error(`Failed to fetch stock data: ${error.message}`);
      return data?.close || data?.previousClose || null;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      return null;
    }
  };
  
  // Refresh stock prices manually or periodically
  const refreshStockPrices = async () => {
    if (!stocks.length || !user || !portfolioId) {
      toast({
        title: 'Nothing to Refresh',
        description: 'No stocks found in your portfolio.',
        variant: 'default'
      });
      return;
    }
    
    try {
      setRefreshing(true);
      toast({
        title: 'Refreshing Prices',
        description: 'Fetching latest stock prices...',
        variant: 'default'
      });
      
      const updatedStocks = [...stocks];
      let hasUpdates = false;
      
      // Get fresh prices for all stocks
      for (const stock of updatedStocks) {
        const currentPrice = await fetchStockData(stock.symbol);
        if (currentPrice && currentPrice !== stock.currentPrice) {
          hasUpdates = true;
          
          // Update calculations based on new price
          stock.currentPrice = currentPrice;
          stock.value = stock.quantity * currentPrice;
          stock.profit = (currentPrice - stock.buyPrice) * stock.quantity;
          stock.profitPercentage = ((currentPrice / stock.buyPrice) - 1) * 100;
          
          // Update in Supabase
          await supabase
            .from('portfolio_holdings')
            .update({ current_price: currentPrice })
            .eq('portfolio_id', portfolioId)
            .eq('symbol', stock.symbol);
        }
      }
      
      // Recalculate allocation percentages if any prices changed
      if (hasUpdates) {
        const totalValue = updatedStocks.reduce((sum, stock) => sum + stock.value, 0);
        updatedStocks.forEach(stock => {
          stock.allocation = (stock.value / totalValue) * 100;
        });
        
        setStocks(updatedStocks);
        toast({
          title: 'Prices Updated',
          description: 'Stock prices have been refreshed',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error refreshing stock prices:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Analyze portfolio using Vertex AI with caching
  const analyzePortfolio = async () => {
    if (!user) return;
    
    if (stocks.length === 0) {
      toast({
        title: 'No Stocks',
        description: 'Please add stocks to your portfolio first',
        variant: 'destructive'
      });
      return;
    }

    // Check if we have a valid cache before making an API call
    if (analysisCache && analysisCache.timestamp) {
      const cacheAge = Date.now() - analysisCache.timestamp;
      const cacheExpiryTime = 6 * 60 * 60 * 1000; // 6 hours
      
      if (cacheAge < cacheExpiryTime) {
        setAnalysisResult(analysisCache.data);
        toast({
          title: 'Analysis Loaded',
          description: 'Using cached analysis results (less than 6 hours old)',
          variant: 'default'
        });
        return;
      }
    }

    try {
      setAnalyzing(true);
      
      // Format portfolio data for the analyze-portfolio function
      const portfolioData = {
        holdings: stocks.map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          quantity: stock.quantity,
          price: stock.currentPrice,
          value: stock.value,
          sector: stock.sector
        }))
      };

      // Call the analyze-portfolio edge function
      console.log('Sending portfolio data for analysis:', portfolioData);
      // Use the Supabase edge function URL instead of Netlify
      // Use centralized edge function client
      const { data, error } = await callEdgeFunction(
        API_ENDPOINTS.ANALYZE_PORTFOLIO,
        'POST',
        portfolioData
      );

      if (error || !data) {
        const errorText = error ? error.message : 'Unknown error';
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to analyze portfolio: ${errorText}`);
      }
      
      setAnalysisResult(data);
      
      // Cache the analysis result
      setAnalysisCache({
        timestamp: Date.now(),
        data: data
      });

      // Save analysis to Supabase
      try {
        await supabase
          .from('portfolio_analysis')
          .insert([{
            user_id: user.id,
            portfolio_id: portfolioId,
            analysis_data: data,
            created_at: new Date().toISOString()
          }]);
      } catch (dbError) {
        console.error('Error saving analysis to database:', dbError);
        // Continue even if database save fails
      }

      toast({
        title: 'Analysis Complete',
        description: 'Your portfolio has been analyzed successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      
      // Check if we have a cached analysis to fall back to
      if (analysisCache && analysisCache.data) {
        toast({
          title: 'Analysis Failed - Using Cached Data',
          description: 'Using previous analysis results due to an error',
          variant: 'default'
        });
        setAnalysisResult(analysisCache.data);
      } else {
        toast({
          title: 'Analysis Failed',
          description: 'Could not complete portfolio analysis. Please try again later.',
          variant: 'destructive'
        });
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // Add a stock to portfolio
  const addStock = async (newStock: {
    symbol: string;
    name: string;
    quantity: string;
    buyPrice: string;
    sector: string;
    currentPrice: string;
  }) => {
    if (!user) {
      toast({
        title: 'Not Authenticated',
        description: 'Please log in to add stocks to your portfolio.',
        variant: 'destructive'
      });
      return;
    }
    if (!portfolioId) {
      toast({
        title: 'Portfolio Not Found',
        description: 'Could not find your portfolio. Please refresh the page.',
        variant: 'destructive'
      });
      return;
    }
    if (!newStock.symbol || !newStock.name || !newStock.quantity || !newStock.buyPrice) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      // Use manually entered or refreshed currentPrice, fallback to buyPrice if empty
      const currentPrice = newStock.currentPrice ? Number(newStock.currentPrice) : Number(newStock.buyPrice);
      // Add to Supabase
      const { error } = await supabase
        .from('portfolio_holdings')
        .insert([{
          user_id: user.id,
          portfolio_id: portfolioId,
          symbol: newStock.symbol,
          name: newStock.name,
          quantity: Number(newStock.quantity),
          buy_price: Number(newStock.buyPrice),
          current_price: currentPrice,
          sector: newStock.sector || 'Other',
          buy_date: new Date().toISOString().split('T')[0]
        }]);
      if (error) throw error;
      // Update UI
      await fetchUserPortfolio();
      toast({
        title: 'Success',
        description: `${newStock.symbol} added to your portfolio`,
        variant: 'default'
      });
      return true;
    } catch (error) {
      console.error('Error adding stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to add stock to portfolio',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Edit a stock in portfolio
  const editStock = async (editingStock: Stock, updatedStock: {
    name: string;
    quantity: string;
    buyPrice: string;
    sector: string;
    currentPrice: string;
  }) => {
    if (!editingStock || !user || !portfolioId) return false;
    
    if (!updatedStock.name || !updatedStock.quantity || !updatedStock.buyPrice) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return false;
    }
    
    try {
      setLoading(true);
      
      // Update in Supabase
      const { error } = await supabase
        .from('portfolio_holdings')
        .update({
          name: updatedStock.name,
          quantity: Number(updatedStock.quantity),
          buy_price: Number(updatedStock.buyPrice),
          sector: updatedStock.sector || 'Other',
          current_price: Number(updatedStock.currentPrice)
        })
        .eq('portfolio_id', portfolioId)
        .eq('symbol', editingStock.symbol);
        
      if (error) throw error;
      
      // Get current price
      const currentPrice = Number(updatedStock.currentPrice);
      
      // Update local state
      const updatedStocks = stocks.map(stock => {
        if (stock.symbol === editingStock.symbol) {
          const updatedStockObj = {
            ...stock,
            name: updatedStock.name,
            quantity: Number(updatedStock.quantity),
            buyPrice: Number(updatedStock.buyPrice),
            sector: updatedStock.sector || 'Other',
            value: Number(updatedStock.quantity) * currentPrice,
            profit: (currentPrice - Number(updatedStock.buyPrice)) * Number(updatedStock.quantity),
            profitPercentage: ((currentPrice / Number(updatedStock.buyPrice)) - 1) * 100,
            currentPrice: currentPrice
          };
          return updatedStockObj;
        }
        return stock;
      });
      
      // Recalculate allocations
      const totalValue = updatedStocks.reduce((sum, stock) => sum + stock.value, 0);
      updatedStocks.forEach(stock => {
        stock.allocation = (stock.value / totalValue) * 100;
      });
      
      setStocks(updatedStocks);
      
      toast({
        title: 'Stock Updated',
        description: `${editingStock.symbol} has been updated`,
        variant: 'default'
      });
      return true;
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to update stock',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a stock from portfolio
  const deleteStock = async (stock: Stock) => {
    if (!user || !portfolioId) return false;
    
    try {
      setLoading(true);
      
      // Delete from Supabase
      const { error } = await supabase
        .from('portfolio_holdings')
        .delete()
        .eq('portfolio_id', portfolioId)
        .eq('symbol', stock.symbol);
        
      if (error) throw error;
      
      // Update local state
      const updatedStocks = stocks.filter(s => s.symbol !== stock.symbol);
      
      // Recalculate allocations
      if (updatedStocks.length > 0) {
        const totalValue = updatedStocks.reduce((sum, s) => sum + s.value, 0);
        updatedStocks.forEach(s => {
          s.allocation = (s.value / totalValue) * 100;
        });
      }
      
      setStocks(updatedStocks);
      
      toast({
        title: 'Stock Removed',
        description: `${stock.symbol} has been removed from your portfolio`,
        variant: 'default'
      });
      return true;
    } catch (error) {
      console.error('Error deleting stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete stock',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Initialize portfolio data on component mount
  useEffect(() => {
    if (user) {
      fetchUserPortfolio();
    }
  }, [user]);
  
  // Set up periodic refresh of stock prices (every 5 minutes)
  useEffect(() => {
    if (!stocks.length) return;
    
    const refreshInterval = setInterval(() => {
      refreshStockPrices();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [stocks]);
  
  // Cache expiration check for analysis results
  useEffect(() => {
    if (analysisCache && analysisCache.timestamp) {
      const cacheAge = Date.now() - analysisCache.timestamp;
      const cacheExpiryTime = 24 * 60 * 60 * 1000; // 24 hours
      
      if (cacheAge < cacheExpiryTime) {
        setAnalysisResult(analysisCache.data);
      } else {
        setAnalysisCache(null);
      }
    }
  }, [analysisCache]);

  return {
    loading,
    refreshing,
    stocks,
    portfolioId,
    analyzing,
    analysisResult,
    fetchUserPortfolio,
    fetchStockData,
    refreshStockPrices,
    analyzePortfolio,
    addStock,
    editStock,
    deleteStock
  };
}
