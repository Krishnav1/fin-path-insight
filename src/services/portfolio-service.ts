import { createClient } from '@supabase/supabase-js';
import { Portfolio, StockHolding } from '@/types/portfolio';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Define the GeminiAnalysis interface to match the response from Gemini
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

export const portfolioService = {
  // Get all portfolios for the current user
  async getPortfolios() {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Get a specific portfolio with its holdings
  async getPortfolio(portfolioId: string) {
    // Get portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();
    
    if (portfolioError) throw portfolioError;
    
    // Get holdings
    const { data: holdings, error: holdingsError } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('portfolio_id', portfolioId);
    
    if (holdingsError) throw holdingsError;
    
    return { ...portfolio, holdings };
  },
  
  // Create a new portfolio
  async createPortfolio(portfolio: Portfolio) {
    // Insert portfolio
    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        name: portfolio.name,
        description: portfolio.description,
        total_value: portfolio.totalValue,
        total_invested: portfolio.totalInvested,
        total_return: portfolio.totalReturn,
        total_return_percentage: portfolio.totalReturnPercentage
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Insert holdings if any
    if (portfolio.holdings && portfolio.holdings.length > 0) {
      const holdingsData = portfolio.holdings.map(holding => ({
        portfolio_id: data.id,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        buy_price: holding.buyPrice,
        current_price: holding.currentPrice,
        buy_date: holding.buyDate,
        sector: holding.sector
      }));
      
      const { error: holdingsError } = await supabase
        .from('portfolio_holdings')
        .insert(holdingsData);
      
      if (holdingsError) throw holdingsError;
    }
    
    return data;
  },
  
  // Update an existing portfolio
  async updatePortfolio(portfolioId: string, portfolio: Portfolio) {
    // Update portfolio
    const { error } = await supabase
      .from('portfolios')
      .update({
        name: portfolio.name,
        description: portfolio.description,
        total_value: portfolio.totalValue,
        total_invested: portfolio.totalInvested,
        total_return: portfolio.totalReturn,
        total_return_percentage: portfolio.totalReturnPercentage,
        updated_at: new Date()
      })
      .eq('id', portfolioId);
    
    if (error) throw error;
    
    // Delete existing holdings
    const { error: deleteError } = await supabase
      .from('portfolio_holdings')
      .delete()
      .eq('portfolio_id', portfolioId);
    
    if (deleteError) throw deleteError;
    
    // Insert new holdings
    if (portfolio.holdings && portfolio.holdings.length > 0) {
      const holdingsData = portfolio.holdings.map(holding => ({
        portfolio_id: portfolioId,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        buy_price: holding.buyPrice,
        current_price: holding.currentPrice,
        buy_date: holding.buyDate,
        sector: holding.sector
      }));
      
      const { error: holdingsError } = await supabase
        .from('portfolio_holdings')
        .insert(holdingsData);
      
      if (holdingsError) throw holdingsError;
    }
    
    return { id: portfolioId };
  },
  
  // Delete a portfolio and its holdings
  async deletePortfolio(portfolioId: string) {
    const { error } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', portfolioId);
    
    if (error) throw error;
    return true;
  },
  
  // Add a holding to a portfolio
  async addHolding(portfolioId: string, holding: StockHolding) {
    const { data, error } = await supabase
      .from('portfolio_holdings')
      .insert({
        portfolio_id: portfolioId,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        buy_price: holding.buyPrice,
        current_price: holding.currentPrice,
        buy_date: holding.buyDate,
        sector: holding.sector
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Update a holding
  async updateHolding(holdingId: string, holding: StockHolding) {
    const { data, error } = await supabase
      .from('portfolio_holdings')
      .update({
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        buy_price: holding.buyPrice,
        current_price: holding.currentPrice,
        buy_date: holding.buyDate,
        sector: holding.sector,
        updated_at: new Date()
      })
      .eq('id', holdingId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Delete a holding
  async deleteHolding(holdingId: string) {
    const { error } = await supabase
      .from('portfolio_holdings')
      .delete()
      .eq('id', holdingId);
    
    if (error) throw error;
    return true;
  },
  
  // Analyze portfolio with Gemini
  async analyzePortfolio(holdings: StockHolding[]): Promise<GeminiAnalysis> {
    try {
      // Format holdings data for the API
      const formattedHoldings = holdings.map(holding => ({
        symbol: holding.symbol,
        quantity: holding.quantity,
        buy_price: holding.buyPrice,
        current_price: holding.currentPrice,
        sector: holding.sector
      }));
      
      // Call the Deno Deploy API
      const response = await fetch(`${import.meta.env.VITE_DENO_API_URL}/api/analyzePortfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ holdings: formattedHoldings })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze portfolio');
      }
      
      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      throw error;
    }
  },
  
  // Save analysis results to Supabase
  async saveAnalysisResults(portfolioId: string, analysis: GeminiAnalysis) {
    try {
      const { error } = await supabase
        .from('portfolio_analyses')
        .upsert({
          portfolio_id: portfolioId,
          analysis_data: analysis,
          created_at: new Date()
        }, {
          onConflict: 'portfolio_id'
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving analysis results:', error);
      throw error;
    }
  },
  
  // Get the latest analysis for a portfolio
  async getLatestAnalysis(portfolioId: string) {
    const { data, error } = await supabase
      .from('portfolio_analyses')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // If no analysis found, return null instead of throwing an error
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  }
};
