import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { callEdgeFunction } from '@/lib/edge-function-client';
import { API_ENDPOINTS } from '@/config/api-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, LineChart } from '@/components/ui/charts';
import { 
  Upload, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Trash2,
  Edit,
  Plus
} from 'lucide-react';
import { Modal } from 'antd';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';

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

export default function PortfolioAnalyzerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
                email_verified: user.confirmed_at !== null
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
  const [showCsvPreviewModal, setShowCsvPreviewModal] = useState(false);
  const [newStock, setNewStock] = useState({ symbol: '', name: '', quantity: '', buyPrice: '', sector: '', currentPrice: '' });
  const [editingStock, setEditingStock] = useState<any>(null);
  const [csvPreviewData, setCsvPreviewData] = useState<Array<{symbol: string; name: string; quantity: string; buyPrice: string; sector: string; currentPrice: string}>>([]);
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
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImportError, setCsvImportError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [portfolioId, setPortfolioId] = useState(null);
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

  // Fetch current stock price from EODHD API
  const fetchStockData = async (symbol) => {
    try {
      // Use the edge function client to properly handle authentication
      const { data, error } = await callEdgeFunction(
        `${API_ENDPOINTS.EODHD_REALTIME}/${symbol}?fmt=json`,
        'GET'
      );
      
      if (error) {
        console.error(`Error fetching stock quote: ${error.message}`);
        throw new Error(`Failed to fetch stock quote: ${error.message}`);
      }
      
      if (!data) {
        console.warn(`No data returned for ${symbol}`);
        return null;
      }
      
      return data.close || data.previousClose || null;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      // Show a more user-friendly error message
      toast({
        title: 'Stock Data Error',
        description: `Could not get current price for ${symbol}. Using last known price.`,
        variant: 'destructive'
      });
      return null;
    }
  };
  
  // Refresh stock prices periodically
  const refreshStockPrices = async () => {
    if (!stocks.length || !user) return;
    
    try {
      setRefreshing(true);
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

      // Call the analyze-portfolio edge function using the proper client
      const { data: analysisData, error: analysisError } = await callEdgeFunction(
        API_ENDPOINTS.ANALYZE_PORTFOLIO,
        'POST',
        portfolioData
      );

      if (analysisError) {
        throw new Error(`Failed to analyze portfolio: ${analysisError.message}`);
      }
      
      if (!analysisData) {
        throw new Error('No analysis data returned');
      }
      setAnalysisResult(analysisData);
      
      // Cache the analysis result
      setAnalysisCache({
        timestamp: Date.now(),
        data: analysisData
      });

      // Save analysis to Supabase
      await supabase
        .from('portfolio_analysis')
        .insert([{
          user_id: user.id,
          portfolio_id: portfolioId,
          analysis_data: analysisData
        }]);

      toast({
        title: 'Analysis Complete',
        description: 'Your portfolio has been analyzed successfully',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze your portfolio',
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // CSV Import/Export Functions
  const downloadPortfolioTemplate = () => {
    // Create CSV template with headers, instructions, and example data
    const instructions = [
      '# FinPath Insight - Portfolio Import Template',
      '# Instructions:',
      '# 1. Keep the header row (Symbol,Name,Quantity,Buy Price,Sector) intact',
      '# 2. Symbol: Use standard stock symbols (e.g., AAPL for Apple, MSFT for Microsoft)',
      '# 3. Name: Full company name',
      '# 4. Quantity: Number of shares owned (numeric value only)',
      '# 5. Buy Price: Purchase price per share in USD (numeric value only)',
      '# 6. Sector: Industry sector (e.g., Technology, Healthcare, Financial)',
      '# 7. Delete the example rows below and add your own stocks',
      '# 8. Save the file as CSV and import it using the "Import CSV" button',
      '#',
      '# Note: Rows starting with # will be ignored during import',
      '#'
    ];
    
    const headers = ['Symbol', 'Name', 'Quantity', 'Buy Price', 'Sector'];
    const exampleData = [
      ['AAPL', 'Apple Inc.', '10', '180.50', 'Technology'],
      ['MSFT', 'Microsoft Corporation', '5', '330.75', 'Technology'],
      ['AMZN', 'Amazon.com Inc.', '3', '145.20', 'Consumer Cyclical'],
      ['GOOGL', 'Alphabet Inc.', '2', '142.35', 'Communication Services'],
      ['JNJ', 'Johnson & Johnson', '8', '155.20', 'Healthcare'],
      ['JPM', 'JPMorgan Chase & Co.', '4', '195.60', 'Financial Services'],
      ['', '--- Delete above examples and add your stocks below this line ---', '', '', '']
    ];
    
    const csvContent = [
      ...instructions,
      headers.join(','),
      ...exampleData.map(row => row.join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'portfolio_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Template Downloaded',
      description: 'Portfolio template has been downloaded. Fill it with your stock data.',
      variant: 'default'
    });
  };
  
  const exportPortfolioCSV = () => {
    if (stocks.length === 0) {
      toast({
        title: 'No Data',
        description: 'Your portfolio is empty. Add stocks before exporting.',
        variant: 'destructive'
      });
      return;
    }
    
    // Create CSV with portfolio data
    const headers = ['Symbol', 'Name', 'Quantity', 'Buy Price', 'Current Price', 'Value', 'Profit', 'Profit %', 'Sector'];
    const stockData = stocks.map(stock => [
      stock.symbol,
      stock.name,
      stock.quantity.toString(),
      stock.buyPrice.toFixed(2),
      stock.currentPrice.toFixed(2),
      stock.value.toFixed(2),
      stock.profit.toFixed(2),
      stock.profitPercentage.toFixed(2),
      stock.sector || 'Other'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...stockData.map(row => row.join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `portfolio_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Portfolio Exported',
      description: 'Your portfolio has been exported as a CSV file.',
      variant: 'default'
    });
  };
  
  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setCsvFile(files[0]);
      importPortfolioFromCSV(files[0]);
    }
  };
  
  const importPortfolioFromCSV = async (file: File) => {
    if (!user) {
      toast({
        title: 'Not Authenticated',
        description: 'Please log in to import a portfolio.',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setLoading(true);
      setCsvImportError(null);
      
      // Read the file
      const text = await file.text();
      const lines = text.split('\n');
      
      // Parse headers and validate
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredFields = ['symbol', 'name', 'quantity', 'buy price'];
      
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      if (missingFields.length > 0) {
        throw new Error(`CSV is missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Parse data rows
      interface ImportStock {
        symbol: string;
        name: string;
        quantity: number;
        buyPrice: number;
        sector: string;
      }
      
      const newStocks: ImportStock[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        const values = line.split(',').map(v => v.trim());
        if (values.length < 4) continue; // Skip invalid lines
        
        // Map CSV columns to stock properties
        const symbolIndex = headers.indexOf('symbol');
        const nameIndex = headers.indexOf('name');
        const quantityIndex = headers.indexOf('quantity');
        const buyPriceIndex = headers.indexOf('buy price');
        const sectorIndex = headers.indexOf('sector');
        
        const symbol = values[symbolIndex];
        // Skip example data or empty rows
        if (!symbol || symbol === 'AAPL' || symbol === 'MSFT' || symbol === 'AMZN') continue;
        
        newStocks.push({
          symbol: symbol,
          name: values[nameIndex],
          quantity: parseFloat(values[quantityIndex]),
          buyPrice: parseFloat(values[buyPriceIndex]),
          sector: sectorIndex >= 0 ? values[sectorIndex] : 'Other'
        });
      }
      
      if (newStocks.length === 0) {
        throw new Error('No valid stock data found in the CSV file.');
      }
      
      // Confirm with user
      if (window.confirm(`Import ${newStocks.length} stocks to your portfolio?`)) {
        // Add each stock to Supabase
        for (const stock of newStocks) {
          // Get current price
          const currentPrice = await fetchStockData(stock.symbol) || stock.buyPrice;
          
          // Add to Supabase
          await supabase
            .from('portfolio_holdings')
            .insert([{
              user_id: user.id,
              portfolio_id: portfolioId,
              symbol: stock.symbol,
              name: stock.name,
              quantity: stock.quantity,
              buy_price: stock.buyPrice,
              current_price: currentPrice,
              sector: stock.sector,
              buy_date: new Date().toISOString().split('T')[0]
            }]);
        }
        
        // Refresh the portfolio
        await fetchUserPortfolio();
        
        toast({
          title: 'Import Successful',
          description: `${newStocks.length} stocks have been added to your portfolio.`,
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      setCsvImportError(error instanceof Error ? error.message : 'Failed to import CSV file');
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import CSV file',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setCsvFile(null);
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
    returnsPercentage: 25
  };
  
  // Mock risk metrics
  const riskMetrics = [
    { name: 'Beta', value: 1.2, description: 'Portfolio is more volatile than the market' },
    { name: 'Alpha', value: 3.5, description: 'Portfolio outperforms the market by 3.5%' },
    { name: 'Sharpe Ratio', value: 1.8, description: 'Good risk-adjusted returns' },
    { name: 'Standard Deviation', value: 15.2, description: 'Moderate volatility' },
    { name: 'Max Drawdown', value: -12.5, description: 'Maximum loss from peak to trough' }
  ];
  
  function handleUpdateCsvStock(index: number, arg1: string, value: string): void {
    throw new Error('Function not implemented.');
  }

  function handleRemoveCsvStock(index: number): void {
    throw new Error('Function not implemented.');
  }

  function handleSaveCsvData(event: React.MouseEvent<HTMLButtonElement>): void {
    throw new Error('Function not implemented.');
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>): void {
    throw new Error('Function not implemented.');
  }

  function handleQuantityChange(event: ChangeEvent<HTMLInputElement>): void {
    throw new Error('Function not implemented.');
  }

  function handleBuyPriceChange(event: ChangeEvent<HTMLInputElement>): void {
    throw new Error('Function not implemented.');
  }

  function handleCurrentPriceChange(event: ChangeEvent<HTMLInputElement>): void {
    throw new Error('Function not implemented.');
  }

  return (
    <>
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Portfolio Analyzer</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Analyze your investment portfolio performance, risk, and allocation
          </p>

          {/* Portfolio Management Section */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Portfolio</CardTitle>
                  <CardDescription>Manage and analyze your investments</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPortfolioTemplate}
                    title="Download CSV Template"
                  >
                    <FileText className="h-4 w-4 mr-1" /> Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportPortfolioCSV}
                    disabled={stocks.length === 0}
                    title="Export Portfolio as CSV"
                  >
                    <Download className="h-4 w-4 mr-1" /> Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    title="Import Portfolio from CSV"
                  >
                    <Upload className="h-4 w-4 mr-1" /> Import CSV
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".csv"
                    onChange={handleCsvFileChange} />
                  <Button onClick={() => setShowAddStockModal(true)} size="sm">Add Stock</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Portfolio content here */}
            </CardContent>
          </Card>

          {/* Risk Analysis Section */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Analysis</CardTitle>
              <CardDescription>Key risk metrics for your portfolio</CardDescription>
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
      </main>

      <Footer />

      {/* CSV Preview Modal */}
      <Modal
        title="Review CSV Import"
        open={showCsvPreviewModal}
        onCancel={() => {
          setShowCsvPreviewModal(false);
          setCsvPreviewData([]);
        }}
        width={1000}
        footer={null}
      >
        <div className="py-4">
          <div className="mb-4">
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              Review your portfolio data before importing. You can edit values directly in the table.
            </p>
          </div>
          
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {csvPreviewData.map((stock, index) => (
                  <TableRow key={index}>
                    <TableCell>{stock.symbol}</TableCell>
                    <TableCell>
                      <Input 
                        value={stock.name} 
                        onChange={(e) => handleUpdateCsvStock(index, 'name', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={stock.quantity} 
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          handleUpdateCsvStock(index, 'quantity', value);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={stock.buyPrice} 
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9.]/g, '');
                          handleUpdateCsvStock(index, 'buyPrice', value);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Input 
                          value={stock.currentPrice} 
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '');
                            handleUpdateCsvStock(index, 'currentPrice', value);
                          }}
                        />
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={async () => {
                            try {
                              const price = await fetchStockData(stock.symbol);
                              if (price) {
                                handleUpdateCsvStock(index, 'currentPrice', price.toString());
                              }
                            } catch (error) {
                              console.error(`Error fetching price for ${stock.symbol}:`, error);
                            }
                          }}
                          disabled={loading}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={stock.sector} 
                        onChange={(e) => handleUpdateCsvStock(index, 'sector', e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveCsvStock(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCsvPreviewModal(false);
                setCsvPreviewData([]);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCsvData} 
              disabled={loading || csvPreviewData.length === 0}
            >
              {loading ? 'Importing...' : 'Import to Portfolio'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Stock Modal */}
      <Modal
        title="Add Stock to Portfolio"
        open={showAddStockModal}
        onCancel={handleAddStock}
        footer={null}
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input 
                id="symbol" 
                name="symbol" 
                placeholder="e.g., RELIANCE.NS" 
                value={newStock.symbol} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="e.g., Reliance Industries Ltd." 
                value={newStock.name} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input 
                id="quantity" 
                name="quantity" 
                placeholder="e.g., 10" 
                value={newStock.quantity} 
                onChange={handleQuantityChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyPrice">Buy Price</Label>
              <Input 
                id="buyPrice" 
                name="buyPrice" 
                placeholder="e.g., 2500" 
                value={newStock.buyPrice} 
                onChange={handleBuyPriceChange} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Input 
                id="sector" 
                name="sector" 
                placeholder="e.g., Technology" 
                value={newStock.sector} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentPrice">Current Price (Optional)</Label>
              <div className="flex space-x-2">
                <Input 
                  id="currentPrice" 
                  name="currentPrice" 
                  placeholder="e.g., 2600" 
                  value={newStock.currentPrice} 
                  onChange={handleCurrentPriceChange} 
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleRefreshCurrentPrice}
                  disabled={loading || !newStock.symbol}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleAddStock}>Cancel</Button>
            <Button onClick={handleAddStock} disabled={loading}>Add Stock</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Stock Modal */}
      <Modal
        title="Edit Stock"
        open={showEditStockModal}
        onCancel={() => {
          setShowEditStockModal(false);
          setEditingStock(null);
        }}
        footer={null}
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-symbol">Symbol</Label>
              <Input 
                id="edit-symbol" 
                name="symbol" 
                value={newStock.symbol} 
                disabled 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Company Name</Label>
              <Input 
                id="edit-name" 
                name="name" 
                value={newStock.name} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input 
                id="edit-quantity" 
                name="quantity" 
                value={newStock.quantity} 
                onChange={handleQuantityChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-buyPrice">Buy Price</Label>
              <Input 
                id="edit-buyPrice" 
                name="buyPrice" 
                value={newStock.buyPrice} 
                onChange={handleBuyPriceChange} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sector">Sector</Label>
              <Input 
                id="edit-sector" 
                name="sector" 
                value={newStock.sector} 
                onChange={handleInputChange} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-currentPrice">Current Price</Label>
              <div className="flex space-x-2">
                <Input 
                  id="edit-currentPrice" 
                  name="currentPrice" 
                  value={newStock.currentPrice} 
                  onChange={handleCurrentPriceChange} 
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleRefreshCurrentPrice}
                  disabled={loading || !newStock.symbol}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditStockModal(false);
                setEditingStock(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEditedStock} disabled={loading}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </>
    );
}
