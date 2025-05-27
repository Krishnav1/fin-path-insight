import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { callEdgeFunction } from '@/lib/edge-function-client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PieChart, BarChart, LineChart } from '@/components/ui/charts';
import { 
  Upload, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Share2,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  Trash2,
  Edit,
  Plus,
  X,
  Save,
  RefreshCw
} from 'lucide-react';
import { Modal } from 'antd';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';
import { parse, unparse } from 'papaparse';
import { API_ENDPOINTS } from '@/config/api-config';


// Supabase client setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// EODHD API key
const EODHD_API_KEY = import.meta.env.VITE_EODHD_API_KEY || process.env.VITE_EODHD_API_KEY;

// Define GeminiAnalysis interface for portfolio analysis results
interface GeminiAnalysis {
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

// Define interface for CSV import stock data
interface ImportedStock {
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  sector: string;
  buyDate?: string;
  currentPrice?: number;
  id?: string;
}

export default function PortfolioAnalyzerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedStocks, setImportedStocks] = useState<ImportedStock[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);

  // Check user existence in Supabase after login
  useEffect(() => {
    const checkUserInSupabase = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles') // Changed from 'users' to 'profiles' which is the correct table
        .select('*')
        .eq('id', user.id)
        .single();
      if (error || !data) {
        console.error('Error checking user profile:', error);
        // Try to check if user exists in auth.users first
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (!authError && authData?.user) {
          // User exists in auth but not in profiles - create profile
          console.log('User exists in auth but not in profiles. Creating profile...');
          try {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert([{
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || 'User',
                email_verified: user.confirmed_at ? true : false
              }]);
              
            if (insertError) {
              console.error('Error creating user profile:', insertError);
              toast({
                title: 'Profile Creation Failed',
                description: 'Could not create your profile. Please contact support.',
                variant: 'destructive'
              });
              navigate('/login');
            } else {
              // Profile created successfully, continue with app
              console.log('Profile created successfully.');
              // Directly proceed to fetch portfolio (no need to navigate away)
              fetchUserPortfolio();
            }
          } catch (e) {
            console.error('Exception creating profile:', e);
            toast({
              title: 'Profile Creation Failed',
              description: 'Could not create your profile. Please contact support.',
              variant: 'destructive'
            });
            navigate('/login');
          }
        } else {
          // User doesn't exist in auth either
          toast({
            title: 'User Not Found',
            description: 'Your account could not be found in our database. Please contact support.',
            variant: 'destructive'
          });
          navigate('/login');
        }
      }
    };
    checkUserInSupabase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [newStock, setNewStock] = useState({ symbol: '', name: '', quantity: '', buyPrice: '', sector: '', currentPrice: '' });
  const [editingStock, setEditingStock] = useState<any>(null);
  const [stocks, setStocks] = useState<Array<{
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
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysis | null>(null);
  const [analysisCache, setAnalysisCache] = useState<{timestamp: number, data: GeminiAnalysis} | null>(null);

  // Fetch user's portfolio data on component mount
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
  const fetchStockData = async (symbol) => {
    try {
      // Import necessary modules
      const { API_ENDPOINTS } = await import('@/config/api-config');
      const { callEdgeFunction } = await import('@/lib/edge-function-client');
      
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
        
        // Automatically re-analyze portfolio with fresh prices
        analyzePortfolio();
      }
    } catch (error) {
      console.error('Error refreshing stock prices:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle adding a new stock to portfolio
  const handleAddStock = async () => {
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
      setShowAddStockModal(false);
      setNewStock({ symbol: '', name: '', quantity: '', buyPrice: '', sector: '', currentPrice: '' });
      toast({
        title: 'Success',
        description: `${newStock.symbol} added to your portfolio`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error adding stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to add stock to portfolio',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle refreshing current price for Add Stock modal
  async function handleRefreshCurrentPrice() {
    if (!newStock.symbol) {
      toast({ title: 'Symbol Required', description: 'Please enter a symbol first', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const price = await fetchStockData(newStock.symbol);
      if (price) {
        setNewStock(prev => ({ ...prev, currentPrice: price.toString() }));
        toast({ title: 'Price Fetched', description: `Current price: ₹${price}`, variant: 'default' });
      } else {
        toast({ title: 'Not Found', description: 'Could not fetch current price', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch price', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  // Handle editing a stock
  const handleEditStock = (stock: any) => {
    setEditingStock(stock);
    setNewStock({
      symbol: stock.symbol,
      name: stock.name,
      quantity: stock.quantity.toString(),
      buyPrice: stock.buyPrice.toString(),
      sector: stock.sector,
      currentPrice: stock.currentPrice.toString()
    });
    setShowEditStockModal(true);
  };
  
  // Handle deleting a stock
  const handleDeleteStock = async (stock: any) => {
    if (!user || !confirm(`Are you sure you want to delete ${stock.symbol} from your portfolio?`)) return;
    
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
    } catch (error) {
      console.error('Error deleting stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete stock',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Save edited stock
  const handleSaveEditedStock = async () => {
    if (!editingStock || !user) return;
    
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
      
      // Update in Supabase
      const { error } = await supabase
        .from('portfolio_holdings')
        .update({
          name: newStock.name,
          quantity: Number(newStock.quantity),
          buy_price: Number(newStock.buyPrice),
          sector: newStock.sector || 'Other',
          current_price: Number(newStock.currentPrice)
        })
        .eq('portfolio_id', portfolioId)
        .eq('symbol', editingStock.symbol);
        
      if (error) throw error;
      
      // Get current price
      const currentPrice = editingStock.currentPrice;
      
      // Update local state
      const updatedStocks = stocks.map(stock => {
        if (stock.symbol === editingStock.symbol) {
          const updatedStock = {
            ...stock,
            name: newStock.name,
            quantity: Number(newStock.quantity),
            buyPrice: Number(newStock.buyPrice),
            sector: newStock.sector || 'Other',
            value: Number(newStock.quantity) * currentPrice,
            profit: (currentPrice - Number(newStock.buyPrice)) * Number(newStock.quantity),
            profitPercentage: ((currentPrice / Number(newStock.buyPrice)) - 1) * 100,
            currentPrice: Number(newStock.currentPrice)
          };
          return updatedStock;
        }
        return stock;
      });
      
      // Recalculate allocations
      const totalValue = updatedStocks.reduce((sum, stock) => sum + stock.value, 0);
      updatedStocks.forEach(stock => {
        stock.allocation = (stock.value / totalValue) * 100;
      });
      
      setStocks(updatedStocks);
      setShowEditStockModal(false);
      setEditingStock(null);
      setNewStock({ symbol: '', name: '', quantity: '', buyPrice: '', sector: '', currentPrice: '' });
      
      toast({
        title: 'Stock Updated',
        description: `${editingStock.symbol} has been updated`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to update stock',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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

  const [activeTab, setActiveTab] = useState('overview');
  const [isDragging, setIsDragging] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  
  
  
  // Mock portfolio data
  const portfolioData = {
    totalValue: 1250000,
    invested: 1000000,
    returns: 250000,
    returnsPercentage: 25,
    stocks: [
      { 
        symbol: 'RELIANCE.NS', 
        name: 'Reliance Industries Ltd.', 
        quantity: 50, 
        buyPrice: 2500, 
        currentPrice: 2876.45,
        value: 143822.50,
        profit: 18822.50,
        profitPercentage: 15.06,
        allocation: 11.51,
        sector: 'Energy'
      },
      { 
        symbol: 'TCS.NS', 
        name: 'Tata Consultancy Services Ltd.', 
        quantity: 30, 
        buyPrice: 3200, 
        currentPrice: 3456.80,
        value: 103704,
        profit: 7704,
        profitPercentage: 8.02,
        allocation: 8.30,
        sector: 'Technology'
      },
      { 
        symbol: 'HDFCBANK.NS', 
        name: 'HDFC Bank Ltd.', 
        quantity: 100, 
        buyPrice: 1500, 
        currentPrice: 1678.25,
        value: 167825,
        profit: 17825,
        profitPercentage: 11.88,
        allocation: 13.43,
        sector: 'Financial Services'
      },
      { 
        symbol: 'INFY.NS', 
        name: 'Infosys Ltd.', 
        quantity: 80, 
        buyPrice: 1300, 
        currentPrice: 1456.30,
        value: 116504,
        profit: 12504,
        profitPercentage: 12.02,
        allocation: 9.32,
        sector: 'Technology'
      },
      { 
        symbol: 'SUNPHARMA.NS', 
        name: 'Sun Pharmaceutical Industries Ltd.', 
        quantity: 60, 
        buyPrice: 900, 
        currentPrice: 1023.45,
        value: 61407,
        profit: 7407,
        profitPercentage: 13.72,
        allocation: 4.91,
        sector: 'Healthcare'
      }
    ]
  };
  
  // Mock sector allocation data for pie chart
  const sectorAllocationData = [
    { name: 'Financial Services', value: 35 },
    { name: 'Technology', value: 25 },
    { name: 'Energy', value: 15 },
    { name: 'Healthcare', value: 12 },
    { name: 'Consumer Goods', value: 8 },
    { name: 'Others', value: 5 }
  ];
  
  // Mock performance data for line chart
  const performanceData = [
    { date: 'Jan', value: 1000000 },
    { date: 'Feb', value: 1020000 },
    { date: 'Mar', value: 1050000 },
    { date: 'Apr', value: 1080000 },
    { date: 'May', value: 1100000 },
    { date: 'Jun', value: 1150000 },
    { date: 'Jul', value: 1200000 },
    { date: 'Aug', value: 1250000 }
  ];
  
  // Mock risk metrics
  const riskMetrics = [
    { name: 'Beta', value: 1.2, description: 'Portfolio is more volatile than the market' },
    { name: 'Alpha', value: 3.5, description: 'Portfolio outperforms the market by 3.5%' },
    { name: 'Sharpe Ratio', value: 1.8, description: 'Good risk-adjusted returns' },
    { name: 'Standard Deviation', value: 15.2, description: 'Moderate volatility' },
    { name: 'Max Drawdown', value: -12.5, description: 'Maximum loss from peak to trough' }
  ];
  
  // Mock recommendations
  const recommendations = [
    { 
      type: 'alert', 
      message: 'Your portfolio is overweight in the Technology sector (25% vs. benchmark 18%)',
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />
    },
    { 
      type: 'suggestion', 
      message: 'Consider adding more defensive stocks to reduce portfolio volatility',
      icon: <TrendingDown className="h-5 w-5 text-blue-500" />
    },
    { 
      type: 'positive', 
      message: 'Your diversification across large-cap stocks is good',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />
    }
  ];
  
  // Handle drag and drop functionality
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Get dropped files
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Create a synthetic event to reuse handleFileChange
      const syntheticEvent = {
        target: {
          files: files
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleFileChange(syntheticEvent);
    }
  };
  
  // Parse CSV file and prepare for confirmation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    const file = e.target.files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV file',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Read the CSV file using PapaParse for better CSV handling
      const result = await new Promise<any>((resolve, reject) => {
        parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results),
          error: (error) => reject(error)
        });
      });
      
      if (!result.data || !result.data.length) {
        throw new Error('No data found in CSV');
      }
      
      // Check for required columns
      const firstRow = result.data[0];
      const hasRequiredColumns = 
        (firstRow.Symbol || firstRow.symbol) && 
        (firstRow.Quantity || firstRow.quantity) && 
        (firstRow['Buy Price'] || firstRow.BuyPrice || firstRow.buyPrice || firstRow['buy price'] || firstRow['Purchase Price']);
      
      if (!hasRequiredColumns) {
        toast({
          title: 'Invalid CSV Format',
          description: 'CSV must include Symbol, Quantity, and Buy Price columns',
          variant: 'destructive'
        });
        return;
      }
      
      // Process data rows to standard format
      const parsedStocks: ImportedStock[] = result.data
        .filter((row: any) => {
          const symbol = row.Symbol || row.symbol;
          const quantity = parseFloat(row.Quantity || row.quantity);
          const buyPrice = parseFloat(
            row['Buy Price'] || row.BuyPrice || row.buyPrice || row['buy price'] || row['Purchase Price']
          );
          return symbol && !isNaN(quantity) && !isNaN(buyPrice);
        })
        .map((row: any) => {
          const symbol = row.Symbol || row.symbol;
          const name = row.Name || row.name || symbol;
          const quantity = parseFloat(row.Quantity || row.quantity);
          const buyPrice = parseFloat(
            row['Buy Price'] || row.BuyPrice || row.buyPrice || row['buy price'] || row['Purchase Price']
          );
          const sector = row.Sector || row.sector || 'Other';
          const buyDate = row['Buy Date'] || row.BuyDate || row.buyDate || row['buy date'] || new Date().toISOString().split('T')[0];
          
          return {
            symbol,
            name,
            quantity,
            buyPrice,
            sector,
            buyDate
          };
        });
      
      if (parsedStocks.length === 0) {
        toast({
          title: 'No Valid Data',
          description: 'No valid stock data found in the CSV',
          variant: 'destructive'
        });
        return;
      }
      
      // Fetch current prices for all stocks
      for (const stock of parsedStocks) {
        try {
          const price = await fetchStockData(stock.symbol);
          if (price) {
            stock.currentPrice = price;
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${stock.symbol}:`, error);
          // Continue with other stocks even if one fails
        }
      }
      
      // Show the confirmation modal with the parsed stocks
      setImportedStocks(parsedStocks);
      setShowImportModal(true);
      
    } catch (error) {
      console.error('Error processing CSV:', error);
      toast({
        title: 'Processing Failed',
        description: 'Failed to process CSV data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle updating an imported stock in the confirmation modal
  const handleUpdateImportedStock = (index: number, field: keyof ImportedStock, value: string | number) => {
    setImportedStocks(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: typeof value === 'string' && ['quantity', 'buyPrice', 'currentPrice'].includes(field) 
          ? parseFloat(value) 
          : value
      };
      return updated;
    });
  };
  
  // Remove a stock from the import list
  const handleRemoveImportedStock = (index: number) => {
    setImportedStocks(prev => prev.filter((_, i) => i !== index));
  };
  
  // Save all imported stocks to Supabase
  const handleSaveImportedStocks = async () => {
    if (!user || !portfolioId || importedStocks.length === 0) return;
    
    try {
      setLoading(true);
      
      let addedCount = 0;
      const errors: string[] = [];
      
      // Add each stock to Supabase
      for (const stock of importedStocks) {
        const { error } = await supabase
          .from('portfolio_holdings')
          .insert([{
            user_id: user.id,
            portfolio_id: portfolioId,
            symbol: stock.symbol,
            name: stock.name,
            quantity: stock.quantity,
            buy_price: stock.buyPrice,
            current_price: stock.currentPrice || stock.buyPrice,
            sector: stock.sector,
            buy_date: stock.buyDate || new Date().toISOString().split('T')[0]
          }]);
        
        if (error) {
          console.error(`Error adding ${stock.symbol}:`, error);
          errors.push(`${stock.symbol}: ${error.message}`);
        } else {
          addedCount++;
        }
      }
      
      // Update the UI with the new stocks
      await fetchUserPortfolio();
      
      // Close modal and clear imported stocks
      setShowImportModal(false);
      setImportedStocks([]);
      
      if (errors.length > 0) {
        toast({
          title: 'Partial Import Success',
          description: `Added ${addedCount} of ${importedStocks.length} stocks. Some errors occurred.`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Import Complete',
          description: `Successfully added ${addedCount} stocks to your portfolio`,
          variant: 'default'
        });
      }
      
    } catch (error) {
      console.error('Error saving imported stocks:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to save stocks to your portfolio',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
  const { name, value } = event.target;
  setNewStock(prev => ({ ...prev, [name]: value }));
}

function handleQuantityChange(event: React.ChangeEvent<HTMLInputElement>) {
  const value = event.target.value.replace(/[^0-9]/g, '');
  setNewStock(prev => ({ ...prev, quantity: value }));
}

function handleBuyPriceChange(event: React.ChangeEvent<HTMLInputElement>) {
  const value = event.target.value.replace(/[^0-9.]/g, '');
  setNewStock(prev => ({ ...prev, buyPrice: value }));
}

function handleCurrentPriceChange(event: React.ChangeEvent<HTMLInputElement>) {
  const value = event.target.value.replace(/[^0-9.]/g, '');
  setNewStock(prev => ({ ...prev, currentPrice: value }));
}

function handleCancelAddStock() {
  setShowAddStockModal(false);
  setNewStock({ symbol: '', name: '', quantity: '', buyPrice: '', sector: '', currentPrice: '' });
}

// --- Supabase Insert Example (user to fill table name/config) ---
// import { createClient } from '@supabase/supabase-js';
// const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
//
// async function insertStockToSupabase(stock) {
//   const { data, error } = await supabase.from('your_table_name').insert([stock]);
//   if (error) {
//     console.error('Supabase insert error:', error);
//   }
// }
//
// In handleAddStock, after setStocks([...]), call:
// insertStockToSupabase(newStock);


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      

      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Portfolio Analyzer</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Analyze your investment portfolio performance, risk, and allocation
          </p>
          
          {/* Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Import Your Portfolio</CardTitle>
              <CardDescription>
                Upload your portfolio data or manually add your investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    isDragging ? 'border-fin-primary bg-fin-primary/5' : 'border-slate-200 dark:border-slate-700'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Drag & Drop CSV File</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                      or click to browse your files
                    </p>
                    <Input 
                      type="file" 
                      accept=".csv" 
                      className="hidden" 
                      id="portfolio-file" 
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                    <Label htmlFor="portfolio-file" asChild>
                      <Button variant="outline">Select CSV File</Button>
                    </Label>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Template & Instructions</h3>
                  <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                      Download our CSV template and fill it with your portfolio data. The template includes:
                    </p>
                    <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-1">
                      <li>Stock symbol (e.g., RELIANCE.NS)</li>
                      <li>Quantity of shares</li>
                      <li>Purchase price per share</li>
                      <li>Purchase date (optional)</li>
                    </ul>
                    <Button 
                      variant="outline" 
                      className="flex items-center"
                      onClick={() => {
                        // Create template data
                        const templateData = [
                          {
                            Symbol: 'RELIANCE.NS',
                            Name: 'Reliance Industries Ltd',
                            Quantity: 10,
                            'Buy Price': 2500,
                            Sector: 'Energy',
                            'Buy Date': new Date().toISOString().split('T')[0]
                          },
                          {
                            Symbol: 'TCS.NS',
                            Name: 'Tata Consultancy Services Ltd',
                            Quantity: 5,
                            'Buy Price': 3200,
                            Sector: 'Technology',
                            'Buy Date': new Date().toISOString().split('T')[0]
                          }
                        ];
                        
                        // Create a workbook
                        const workbook = XLSX.utils.book_new();
                        const worksheet = XLSX.utils.json_to_sheet(templateData);
                        
                        // Add worksheet to workbook
                        XLSX.utils.book_append_sheet(workbook, worksheet, 'Portfolio Template');
                        
                        // Generate Excel file
                        XLSX.writeFile(workbook, 'portfolio-template.xlsx');
                        
                        toast({
                          title: 'Template Downloaded',
                          description: 'Excel template has been downloaded. Fill it and upload to import your portfolio.',
                          variant: 'default'
                        });
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddStockModal(true);
                    setNewStock({ symbol: '', name: '', quantity: '', buyPrice: '', sector: '', currentPrice: '' });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Stocks Manually
                </Button>
                <Button 
                  variant="outline" 
                  onClick={refreshStockPrices} 
                  disabled={refreshing || stocks.length === 0}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {refreshing ? 'Refreshing...' : 'Refresh Prices'}
                </Button>
              </div>
              <Button onClick={analyzePortfolio} disabled={analyzing || stocks.length === 0}>
                {analyzing ? 'Analyzing...' : 'Analyze Portfolio'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Portfolio Analysis Tabs */}
          
          <Tabs defaultValue="overview" onValueChange={setActiveTab} className="mb-8">
            {!analysisResult && stocks.length > 0 && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-amber-800 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Click "Analyze Portfolio" to see detailed insights and recommendations
                </p>
              </div>
            )}
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="allocation">Allocation</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {analysisResult ? analysisResult.overview.market_value : `₹${(stocks.reduce((sum, stock) => sum + stock.value, 0) / 100000).toFixed(2)} L`}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Invested: {analysisResult ? analysisResult.overview.total_invested : `₹${(stocks.reduce((sum, stock) => sum + (stock.buyPrice * stock.quantity), 0) / 100000).toFixed(2)} L`}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Returns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${analysisResult && !analysisResult.overview.absolute_return.includes('-') ? 'text-green-600' : 'text-red-600'}`}>
                      {analysisResult ? analysisResult.overview.absolute_return : `₹${(stocks.reduce((sum, stock) => sum + stock.profit, 0) / 100000).toFixed(2)} L`}
                    </div>
                    <div className={`flex items-center ${analysisResult && !analysisResult.overview.percent_return.includes('-') ? 'text-green-600' : 'text-red-600'}`}>
                      {analysisResult && !analysisResult.overview.percent_return.includes('-') ? 
                        <TrendingUp className="h-4 w-4 mr-1" /> : 
                        <TrendingDown className="h-4 w-4 mr-1" />
                      }
                      <span>{analysisResult ? analysisResult.overview.percent_return : `${(stocks.reduce((sum, stock) => sum + stock.profit, 0) / stocks.reduce((sum, stock) => sum + (stock.buyPrice * stock.quantity), 0) * 100).toFixed(2)}%`}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Holdings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stocks.length}</div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Across {new Set(stocks.map(stock => stock.sector)).size} sectors
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Portfolio Holdings</CardTitle>
                      <CardDescription>Your current stock investments</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm" onClick={async () => { await refreshStockPrices(); await analyzePortfolio(); }}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw mr-1"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 5.36A9 9 0 0020.49 15"></path></svg>
                        Refresh My Analysis
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Stock</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Avg. Buy Price</TableHead>
                          <TableHead>Current Price</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Profit/Loss</TableHead>
                          <TableHead>Allocation</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stocks.map((stock) => (
                          <TableRow key={stock.symbol}>
                            <TableCell className="font-medium">
                              <div>
                                <div className="font-semibold">{stock.symbol}</div>
                                <div className="text-sm text-slate-500">{stock.name}</div>
                              </div>
                            </TableCell>
                            <TableCell>{stock.quantity}</TableCell>
                            <TableCell>₹{stock.buyPrice.toFixed(2)}</TableCell>
                            <TableCell>₹{stock.currentPrice.toFixed(2)}</TableCell>
                            <TableCell>₹{(stock.value / 1000).toFixed(2)}K</TableCell>
                            <TableCell>
                              <div className={`flex items-center ${stock.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stock.profit >= 0 ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                                {stock.profit >= 0 ? '+' : ''}₹{(stock.profit / 1000).toFixed(2)}K
                                <span className="ml-1">({stock.profitPercentage.toFixed(2)}%)</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 mr-2">
                                  <div 
                                    className="h-2 rounded-full bg-fin-primary" 
                                    style={{ width: `${stock.allocation}%` }}
                                  ></div>
                                </div>
                                {stock.allocation.toFixed(1)}%
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditStock(stock)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteStock(stock)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Allocation Tab */}
            <TabsContent value="allocation" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Sector Allocation</CardTitle>
                    <CardDescription>Distribution of your investments across sectors</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <PieChart 
                      data={analysisResult && analysisResult.diversification ? 
                        Object.entries(analysisResult.diversification.sector_breakdown).map(([name, value]) => ({
                          name,
                          value: parseFloat(value.replace('%', ''))
                        })) : 
                        // Fallback to calculated data from stocks
                        Object.entries(stocks.reduce((acc, stock) => {
                          const sector = stock.sector || 'Other';
                          acc[sector] = (acc[sector] || 0) + stock.value;
                          return acc;
                        }, {})).map(([name, value]) => ({
                          name,
                          value: Number(((value as number) / stocks.reduce((sum, s) => sum + s.value, 0) * 100).toFixed(1))
                        }))
                      }
                      colors={['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#84cc16', '#14b8a6', '#06b6d4', '#a855f7']}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Allocation Analysis</CardTitle>
                    <CardDescription>Sector breakdown and recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-3">Sector Breakdown</h3>
                        <div className="space-y-3">
                          {(analysisResult && analysisResult.diversification ? 
                            Object.entries(analysisResult.diversification.sector_breakdown).map(([name, value]) => ({
                              name,
                              value: value.replace('%', '')
                            })) : 
                            // Fallback to calculated data from stocks
                            Object.entries(stocks.reduce((acc, stock) => {
                              const sector = stock.sector || 'Other';
                              acc[sector] = (acc[sector] || 0) + stock.value;
                              return acc;
                            }, {})).map(([name, value]) => ({
                              name,
                              value: ((value as number) / stocks.reduce((sum, s) => sum + s.value, 0) * 100).toFixed(1)
                            }))
                          ).map((sector, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#84cc16', '#14b8a6', '#06b6d4', '#a855f7'][index % 10] }}
                                ></div>
                                <span>{sector.name}</span>
                              </div>
                              <span className="font-medium">{sector.value}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-3">Allocation Recommendations</h3>
                        <div className="space-y-3">
                          {analysisResult && analysisResult.recommendations ? (
                            analysisResult.recommendations.map((recommendation, index) => (
                              <div key={index} className="flex items-start p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                                <div className="mr-3 mt-0.5">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </div>
                                <p className="text-sm">{recommendation}</p>
                              </div>
                            ))
                          ) : (
                            // Fallback recommendations based on portfolio composition
                            [
                              {
                                icon: <CheckCircle className="h-4 w-4 text-green-500" />,
                                message: 'Consider diversifying across more sectors to reduce risk.'
                              },
                              {
                                icon: <CheckCircle className="h-4 w-4 text-green-500" />,
                                message: 'Aim for no more than 10-15% allocation in any single stock.'
                              },
                              {
                                icon: <CheckCircle className="h-4 w-4 text-green-500" />,
                                message: 'Balance growth stocks with some defensive stocks for stability.'
                              }
                            ].map((rec, index) => (
                              <div key={index} className="flex items-start p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                                <div className="mr-3 mt-0.5">{rec.icon}</div>
                                <p className="text-sm">{rec.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Performance Tab */}
            <TabsContent value="performance" className="mt-6">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Portfolio Performance</CardTitle>
                  <CardDescription>Historical performance of your portfolio</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {stocks.length > 0 ? (
                    <LineChart 
                      data={analysisResult ? 
                        // If we have analysis data, we could use it here
                        // For now, generate some mock performance data based on current holdings
                        Array.from({ length: 30 }, (_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() - (30 - i));
                          // Generate a value that trends toward the current total value
                          const totalValue = stocks.reduce((sum, stock) => sum + stock.value, 0);
                          const startValue = totalValue * 0.9; // Start at 90% of current value
                          const randomFactor = 0.98 + Math.random() * 0.04; // Random between 0.98 and 1.02
                          const value = startValue * (1 + (i/30) * 0.1) * randomFactor;
                          
                          return {
                            date: date.toISOString().split('T')[0],
                            value: Math.round(value)
                          };
                        }) : 
                        // Fallback to simple mock data
                        Array.from({ length: 30 }, (_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() - (30 - i));
                          return {
                            date: date.toISOString().split('T')[0],
                            value: Math.round(1000000 * (1 + (i/30) * 0.25 * (0.9 + Math.random() * 0.2)))
                          };
                        })
                      }
                      xKey="date"
                      yKey="value"
                      color="#0ea5e9"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-slate-500">Add stocks to your portfolio to see performance data</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>Your best performing stocks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stocks
                        .sort((a, b) => b.profitPercentage - a.profitPercentage)
                        .slice(0, 3)
                        .map((stock, index) => (
                          <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <div>
                              <div className="font-medium">{stock.symbol}</div>
                              <div className="text-sm text-slate-500">{stock.name}</div>
                            </div>
                            <div className="text-green-600 font-medium flex items-center">
                              <TrendingUp className="mr-1 h-4 w-4" />
                              {stock.profitPercentage.toFixed(2)}%
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Underperformers</CardTitle>
                    <CardDescription>Your worst performing stocks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stocks
                        .sort((a, b) => a.profitPercentage - b.profitPercentage)
                        .slice(0, 3)
                        .map((stock, index) => (
                          <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <div>
                              <div className="font-medium">{stock.symbol}</div>
                              <div className="text-sm text-slate-500">{stock.name}</div>
                            </div>
                            <div className={`font-medium flex items-center ${stock.profitPercentage < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {stock.profitPercentage < 0 ? <TrendingDown className="mr-1 h-4 w-4" /> : <TrendingUp className="mr-1 h-4 w-4" />}
                              {stock.profitPercentage.toFixed(2)}%
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Risk Analysis Tab */}
            <TabsContent value="risk" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Metrics</CardTitle>
                      <CardDescription>Key risk indicators for your portfolio</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {riskMetrics.map((metric, index) => (
                          <div key={index} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-medium">{metric.name}</h3>
                              <span className="font-bold">{metric.value}</span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{metric.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Assessment</CardTitle>
                      <CardDescription>Overall portfolio risk level</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-amber-500 mb-4">
                          <span className="text-2xl font-bold">Moderate</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">
                          Your portfolio has a moderate risk level based on its composition and market exposure.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Low Risk</span>
                            <span className="text-sm">High Risk</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full">
                            <div className="h-2 bg-amber-500 rounded-full" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                        
                        <Button className="w-full">Get Risk Reduction Tips</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Import Confirmation Modal */}
      <Modal
        title="Confirm Portfolio Import"
        open={showImportModal}
        onCancel={() => setShowImportModal(false)}
        footer={[
          <Button key="cancel" variant="outline" onClick={() => setShowImportModal(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            onClick={handleSaveImportedStocks} 
            disabled={importedStocks.length === 0 || loading}
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Add Holdings'}
          </Button>
        ]}
        width={1000}
      >
        <div className="py-4">
          <p className="mb-4">
            Review and edit your portfolio holdings before adding them. You can adjust quantities, prices, or remove entries.
          </p>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Buy Price</TableHead>
                  <TableHead>Current Price</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Buy Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importedStocks.map((stock, index) => (
                  <TableRow key={`${stock.symbol}-${index}`}>
                    <TableCell>
                      <Input 
                        value={stock.symbol} 
                        onChange={(e) => handleUpdateImportedStock(index, 'symbol', e.target.value)}
                        disabled
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={stock.name} 
                        onChange={(e) => handleUpdateImportedStock(index, 'name', e.target.value)} 
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={stock.quantity} 
                        onChange={(e) => handleUpdateImportedStock(index, 'quantity', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={stock.buyPrice} 
                        onChange={(e) => handleUpdateImportedStock(index, 'buyPrice', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={stock.currentPrice || ''} 
                        placeholder="Auto-fetch"
                        onChange={(e) => handleUpdateImportedStock(index, 'currentPrice', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={stock.sector} 
                        onChange={(e) => handleUpdateImportedStock(index, 'sector', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="date" 
                        value={stock.buyDate} 
                        onChange={(e) => handleUpdateImportedStock(index, 'buyDate', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveImportedStock(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Modal>
      
      {/* Add Stock Modal */}
      <Modal
        title="Add Stock to Portfolio"
        open={showAddStockModal}
        onCancel={handleCancelAddStock}
        footer={[
          <Button key="cancel" variant="outline" onClick={handleCancelAddStock}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            onClick={handleAddStock} 
            disabled={loading || !newStock.symbol || !newStock.name || !newStock.quantity || !newStock.buyPrice}
          >
            <Plus className="mr-2 h-4 w-4" />
            {loading ? 'Adding...' : 'Add Stock'}
          </Button>
        ]}
        width={600}
      >
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol *</Label>
              <Input 
                id="symbol" 
                name="symbol" 
                value={newStock.symbol} 
                onChange={handleInputChange} 
                placeholder="e.g., RELIANCE.NS"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input 
                id="name" 
                name="name" 
                value={newStock.name} 
                onChange={handleInputChange} 
                placeholder="e.g., Reliance Industries Ltd"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input 
                id="quantity" 
                name="quantity" 
                value={newStock.quantity} 
                onChange={handleQuantityChange} 
                placeholder="e.g., 10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyPrice">Buy Price (₹) *</Label>
              <Input 
                id="buyPrice" 
                name="buyPrice" 
                value={newStock.buyPrice} 
                onChange={handleBuyPriceChange} 
                placeholder="e.g., 2500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Input 
                id="sector" 
                name="sector" 
                value={newStock.sector} 
                onChange={handleInputChange} 
                placeholder="e.g., Technology"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentPrice">Current Price (₹)</Label>
              <div className="flex space-x-2">
                <Input 
                  id="currentPrice" 
                  name="currentPrice" 
                  value={newStock.currentPrice} 
                  onChange={handleCurrentPriceChange} 
                  placeholder="Auto-fetch or enter manually"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleRefreshCurrentPrice}
                  disabled={loading || !newStock.symbol}
                  title="Fetch current price"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-slate-500 dark:text-slate-400">
            * Required fields
          </p>
        </div>
      </Modal>
      
      <Footer />
    </div>
  );
}
