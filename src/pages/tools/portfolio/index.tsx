import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, TrendingUp, PieChart, Calendar, BarChart3 } from 'lucide-react';
import PortfolioOverview from './components/PortfolioOverview';
import PortfolioMetrics from './components/PortfolioMetrics';
import PortfolioAllocation from './components/PortfolioAllocation';
import PortfolioHoldings from './components/PortfolioHoldings';
import ValueAddTools from './components/ValueAddTools';
import PortfolioIntelligence from '@/components/PortfolioIntelligence';
import PortfolioAnalyticsDashboard from '@/components/PortfolioAnalyticsDashboard';
import EarningsCalendar from '@/components/EarningsCalendar';
import NotificationBell from '@/components/NotificationBell';
import { mockPortfolioData } from './data/mockData';
import { portfolioService, GeminiAnalysis } from '@/services/portfolio-service';
import { useAuth } from '@/context/AuthContext';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { EdgeFunctionErrorType } from '@/lib/edge-function-client';
import { Button } from '@/components/ui/button';

export default function PortfolioAnalysisPage() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [portfolioData, setPortfolioData] = useState(mockPortfolioData);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<GeminiAnalysis | null>(null);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<{type: EdgeFunctionErrorType; message: string} | null>(null);
  const [analysisError, setAnalysisError] = useState<{type: EdgeFunctionErrorType; message: string} | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [portfolioSymbols, setPortfolioSymbols] = useState<string[]>([]);
  
  // Load portfolio data from Supabase
  useEffect(() => {
    if (user) {
      loadPortfolioData();
    }
  }, [user]);

  // Extract portfolio symbols
  useEffect(() => {
    if (portfolioData.holdings) {
      const symbols = portfolioData.holdings.map(h => h.symbol);
      setPortfolioSymbols(symbols);
    }
  }, [portfolioData]);
  
  const loadPortfolioData = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
      // In a real app, you would get the portfolio ID from the URL or user selection
      // For now, we'll use the first portfolio found for the user
      const portfolios = await portfolioService.getPortfolios();
      
      if (portfolios && portfolios.length > 0) {
        const portfolio = await portfolioService.getPortfolio(portfolios[0].id);
        setPortfolioData({
          ...portfolio,
          holdings: portfolio.holdings.map(h => ({
            symbol: h.symbol,
            name: h.name,
            quantity: h.quantity,
            buyPrice: h.buy_price,
            currentPrice: h.current_price,
            sector: h.sector,
            buyDate: h.buy_date,
            // Calculate derived values
            value: h.quantity * h.current_price,
            profit: h.quantity * (h.current_price - h.buy_price),
            profitPercentage: ((h.current_price - h.buy_price) / h.buy_price) * 100,
          }))
        });
        
        // Load the latest analysis if available
        const analysis = await portfolioService.getLatestAnalysis(portfolios[0].id);
        if (analysis) {
          setAnalysisData(analysis.analysis_data);
          setAnalysisTimestamp(new Date(analysis.created_at).toLocaleString());
        }
      }
    } catch (error: any) {
      console.error('Error loading portfolio data:', error);
      setLoadError({
        type: EdgeFunctionErrorType.UNKNOWN,
        message: error.message || 'Failed to load portfolio data. Please try again.'
      });
      
      toast({
        title: 'Error',
        description: 'Failed to load portfolio data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save holdings to Supabase without analysis
  const savePortfolio = async () => {
    try {
      setIsLoading(true);
      
      // Save portfolio data to Supabase
      const portfolios = await portfolioService.getPortfolios();
      let portfolioId;
      
      // Format the holdings data properly for Supabase
      // This fixes the 400 error by ensuring field names match the database schema
      const formattedHoldings = portfolioData.holdings.map(h => ({
        symbol: h.symbol,
        name: h.name,
        quantity: h.quantity,
        buy_price: h.buyPrice, // Ensure field name matches Supabase schema
        current_price: h.currentPrice, // Ensure field name matches Supabase schema
        sector: h.sector || 'Unknown',
        buy_date: h.buyDate || new Date().toISOString().split('T')[0]
      }));
      
      console.log('Saving holdings to Supabase:', formattedHoldings);
      
      if (portfolios && portfolios.length > 0) {
        // Update existing portfolio
        portfolioId = portfolios[0].id;
        // Convert the formatted holdings back to StockHolding format for the service
        const stockHoldings = formattedHoldings.map(h => ({
          symbol: h.symbol,
          name: h.name,
          quantity: h.quantity,
          buyPrice: h.buy_price,
          currentPrice: h.current_price,
          sector: h.sector,
          buyDate: h.buy_date,
          value: h.quantity * h.current_price,
          profit: h.quantity * (h.current_price - h.buy_price),
          profitPercentage: ((h.current_price - h.buy_price) / h.buy_price) * 100
        }));
        
        await portfolioService.updatePortfolio(portfolioId, {
          ...portfolioData,
          holdings: stockHoldings
        });
      } else {
        // Create new portfolio
        // Convert the formatted holdings back to StockHolding format for the service
        const stockHoldings = formattedHoldings.map(h => ({
          symbol: h.symbol,
          name: h.name,
          quantity: h.quantity,
          buyPrice: h.buy_price,
          currentPrice: h.current_price,
          sector: h.sector,
          buyDate: h.buy_date,
          value: h.quantity * h.current_price,
          profit: h.quantity * (h.current_price - h.buy_price),
          profitPercentage: ((h.current_price - h.buy_price) / h.buy_price) * 100
        }));
        
        const newPortfolio = await portfolioService.createPortfolio({
          name: 'My Portfolio',
          description: 'My investment portfolio',
          holdings: stockHoldings
        });
        portfolioId = newPortfolio.id;
      }
      
      toast({
        title: 'Success',
        description: 'Portfolio saved successfully.',
      });
      
    } catch (error) {
      console.error('Error saving portfolio:', error);
      toast({
        title: 'Error',
        description: `Failed to save portfolio: ${error.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Analyze portfolio with AI (Gemini/Vertex)
  const analyzePortfolio = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      // First save the portfolio to ensure we have the latest data
      await savePortfolio();
      
      // Get the portfolio ID
      const portfolios = await portfolioService.getPortfolios();
      if (!portfolios || portfolios.length === 0) {
        throw new Error('No portfolio found. Please save your portfolio first.');
      }
      const portfolioId = portfolios[0].id;
      
      // Analyze portfolio with AI (analysis is automatically saved to Supabase within the service)
      const { analysis, error } = await portfolioService.analyzePortfolio(portfolioData.holdings);
      
      if (error) {
        setAnalysisError({
          type: error.type || EdgeFunctionErrorType.UNKNOWN,
          message: error.message || 'An error occurred during analysis.'
        });
        
        toast({
          title: 'Analysis Failed',
          description: error.message || 'Failed to analyze portfolio. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      if (analysis) {
        setAnalysisData(analysis);
        setAnalysisTimestamp(new Date().toLocaleString());
        
        toast({
          title: 'Success',
          description: 'Portfolio analyzed successfully.',
        });
        
        // Switch to overview tab to show analysis results
        setActiveTab('overview');
      }
    } catch (error: any) {
      console.error('Error analyzing portfolio:', error);
      setAnalysisError({
        type: EdgeFunctionErrorType.UNKNOWN,
        message: error.message || 'An unexpected error occurred during analysis.'
      });
      
      toast({
        title: 'Error',
        description: `Failed to analyze portfolio: ${error.message || 'Please try again.'}`,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Combined function to handle both save and analyze based on action type
  const handlePortfolioAction = async (action: 'save' | 'analyze' = 'save') => {
    if (action === 'analyze') {
      await analyzePortfolio();
    } else {
      await savePortfolio();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Error banners */}
        {loadError && (
          <ErrorBanner
            title="Failed to Load Portfolio"
            message={loadError.message}
            errorType={loadError.type}
            onDismiss={() => setLoadError(null)}
            onRetry={loadPortfolioData}
          />
        )}
        
        {analysisError && (
          <ErrorBanner
            title="Analysis Failed"
            message={analysisError.message}
            errorType={analysisError.type}
            onDismiss={() => setAnalysisError(null)}
            onRetry={analyzePortfolio}
          />
        )}
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                Portfolio Analysis
                <NotificationBell />
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Track, analyze, and optimize your investment portfolio with powerful insights
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2 md:mt-0">
              {analysisTimestamp && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Last analyzed: {analysisTimestamp}
                </div>
              )}
              <Button
                onClick={loadPortfolioData}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 size={16} />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="holdings" className="flex items-center gap-2">
                <PieChart size={16} />
                Holdings
              </TabsTrigger>
              <TabsTrigger value="earnings" className="flex items-center gap-2">
                <Calendar size={16} />
                Earnings
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="flex items-center gap-2">
                <TrendingUp size={16} />
                AI Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics">
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-fin-teal" />
                </div>
              ) : (
                <PortfolioAnalyticsDashboard 
                  holdings={portfolioData.holdings.map(h => ({
                    symbol: h.symbol,
                    name: h.name,
                    quantity: h.quantity,
                    buyPrice: h.buyPrice,
                    currentPrice: h.currentPrice,
                    sector: h.sector
                  }))}
                  portfolioId={portfolioData.id}
                />
              )}
            </TabsContent>

            <TabsContent value="holdings">
              <ValueAddTools portfolioData={portfolioData} analysisData={analysisData} />
            </TabsContent>

            <TabsContent value="earnings">
              <EarningsCalendar 
                portfolioSymbols={portfolioSymbols}
                daysAhead={60}
              />
            </TabsContent>

            <TabsContent value="intelligence">
              <PortfolioIntelligence portfolioId={portfolioData.id || ''} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
