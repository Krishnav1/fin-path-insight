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
import FinGenieInsights from './components/FinGenieInsights';
import ValueAddTools from './components/ValueAddTools';
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
  
  // Save holdings to Supabase and analyze with Gemini
  const saveAndAnalyzePortfolio = async () => {
    try {
      setIsAnalyzing(true);
      
      // Save portfolio data to Supabase
      const portfolios = await portfolioService.getPortfolios();
      let portfolioId;
      
      if (portfolios && portfolios.length > 0) {
        // Update existing portfolio
        portfolioId = portfolios[0].id;
        await portfolioService.updatePortfolio(portfolioId, {
          ...portfolioData,
          holdings: portfolioData.holdings.map(h => ({
            ...h,
            buyPrice: h.buyPrice,
            currentPrice: h.currentPrice,
          }))
        });
      } else {
        // Create new portfolio
        const newPortfolio = await portfolioService.createPortfolio({
          name: 'My Portfolio',
          description: 'My investment portfolio',
          holdings: portfolioData.holdings.map(h => ({
            ...h,
            buyPrice: h.buyPrice,
            currentPrice: h.currentPrice,
          }))
        });
        portfolioId = newPortfolio.id;
      }
      
      // Analyze portfolio with Gemini
      const analysis = await portfolioService.analyzePortfolio(portfolioData.holdings);
      setAnalysisData(analysis);
      setAnalysisTimestamp(new Date().toLocaleString());
      
      // Save analysis results to Supabase
      await portfolioService.saveAnalysisResults(portfolioId, analysis);
      
      toast({
        title: 'Success',
        description: 'Portfolio saved and analyzed successfully.',
      });
      
      // Switch to overview tab to show analysis results
      setActiveTab('overview');
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze portfolio. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
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
          
          <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Risk & Return</TabsTrigger>
              <TabsTrigger value="allocation">Allocation</TabsTrigger>
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="insights">FinGenie Insights</TabsTrigger>
              <TabsTrigger value="tools">Smart Tools</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-fin-primary" />
                </div>
              ) : (
                <PortfolioOverview portfolioData={portfolioData} analysisData={analysisData} />
              )}
            </TabsContent>
            
            <TabsContent value="metrics">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-fin-primary" />
                </div>
              ) : (
                <PortfolioMetrics portfolioData={portfolioData} analysisData={analysisData} />
              )}
            </TabsContent>
            
            <TabsContent value="allocation">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-fin-primary" />
                </div>
              ) : (
                <PortfolioAllocation portfolioData={portfolioData} analysisData={analysisData} />
              )}
            </TabsContent>
            
            <TabsContent value="holdings">
              <PortfolioHoldings 
                portfolioData={portfolioData} 
                setPortfolioData={setPortfolioData} 
                onSave={saveAndAnalyzePortfolio} 
                isAnalyzing={isAnalyzing} 
              />
            </TabsContent>
            
            <TabsContent value="insights">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-fin-primary" />
                </div>
              ) : (
                <FinGenieInsights portfolioData={portfolioData} analysisData={analysisData} />
              )}
            </TabsContent>
            
            <TabsContent value="tools">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-fin-primary" />
                </div>
              ) : (
                <ValueAddTools portfolioData={portfolioData} analysisData={analysisData} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
