import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import PortfolioOverview from './components/PortfolioOverview';
import PortfolioMetrics from './components/PortfolioMetrics';
import PortfolioAllocation from './components/PortfolioAllocation';
import PortfolioHoldings from './components/PortfolioHoldings';
import ValueAddTools from './components/ValueAddTools';
import PortfolioIntelligence from '@/components/PortfolioIntelligence';
import { mockPortfolioData } from './data/mockData';
import { portfolioService, GeminiAnalysis } from '@/services/portfolio-service';
import { useAuth } from '@/context/AuthContext';

export default function PortfolioAnalysisPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [portfolioData, setPortfolioData] = useState(mockPortfolioData);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<GeminiAnalysis | null>(null);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Load portfolio data from Supabase
  useEffect(() => {
    if (user) {
      loadPortfolioData();
    }
  }, [user]);
  
  const loadPortfolioData = async () => {
    try {
      setIsLoading(true);
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
    } catch (error) {
      console.error('Error loading portfolio data:', error);
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
  
  // Analyze portfolio with Gemini
  const analyzePortfolio = async () => {
    try {
      setIsAnalyzing(true);
      
      // First save the portfolio to ensure we have the latest data
      await savePortfolio();
      
      // Get the portfolio ID
      const portfolios = await portfolioService.getPortfolios();
      if (!portfolios || portfolios.length === 0) {
        throw new Error('No portfolio found. Please save your portfolio first.');
      }
      const portfolioId = portfolios[0].id;
      
      // Analyze portfolio with Gemini (analysis is automatically saved to Supabase within the service)
      const analysis = await portfolioService.analyzePortfolio(portfolioData.holdings);
      setAnalysisData(analysis);
      setAnalysisTimestamp(new Date().toLocaleString());
      
      toast({
        title: 'Success',
        description: 'Portfolio analyzed successfully.',
      });
      
      // Switch to overview tab to show analysis results
      setActiveTab('overview');
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
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
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Portfolio Analysis</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Track, analyze, and optimize your investment portfolio with powerful insights
              </p>
            </div>
            {analysisTimestamp && (
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-2 md:mt-0">
                Last analyzed: {analysisTimestamp}
              </div>
            )}
          </div>
          <Tabs>
            <TabsContent value="overview">
              <ValueAddTools portfolioData={portfolioData} analysisData={analysisData} />
            </TabsContent>
            <TabsContent value="intelligence">
              <PortfolioIntelligence />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
