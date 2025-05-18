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
      console.log('Analyzing portfolio with Gemini...');
      
      // Filter out empty or incomplete holdings
      const validHoldings = holdings.filter(h => 
        h.symbol && h.quantity > 0 && h.buyPrice > 0 && h.currentPrice > 0
      );
      
      if (validHoldings.length === 0) {
        throw new Error('No valid holdings to analyze. Please add complete holdings with symbol, quantity, buy price and current price.');
      }
      
      // Format holdings data for the API - CRITICAL: ensure proper field naming
      const formattedHoldings = validHoldings.map(holding => ({
        symbol: holding.symbol.toUpperCase().trim(),
        name: holding.name || holding.symbol,
        quantity: Number(holding.quantity),
        buy_price: Number(holding.buyPrice),
        current_price: Number(holding.currentPrice),
        sector: (holding.sector || 'Unknown').trim(),
        buy_date: holding.buyDate || new Date().toISOString().split('T')[0]
      }));
      
      console.log('Calling Deno API with holdings:', formattedHoldings);
      
      // Verify API URL
      const apiUrl = import.meta.env.VITE_DENO_API_URL;
      if (!apiUrl) {
        console.error('VITE_DENO_API_URL is not defined in environment variables');
        throw new Error('API URL not configured. Please check your environment settings.');
      }
      
      // Call the Deno Deploy API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for Gemini
      
      // Add CORS headers and proper content-type
      const response = await fetch(`${apiUrl}/api/analyzePortfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          holdings: formattedHoldings,
          // Add API key if needed
          api_key: import.meta.env.VITE_GEMINI_API_KEY || ''
        }),
        signal: controller.signal,
        // Add credentials if needed for CORS
        credentials: 'omit'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = 'Failed to analyze portfolio';
        try {
          const errorText = await response.text();
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (jsonError) {
            // If JSON parsing fails, use the response text
            errorMessage = errorText || response.statusText || errorMessage;
          }
        } catch (e) {
          errorMessage = `API error (${response.status}): ${response.statusText}`;
        }
        console.error('API error details:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Received analysis data:', data);
      
      if (!data.analysis) {
        throw new Error('Invalid response format from API');
      }
      
      return data.analysis;
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Analysis request timed out. The Gemini API may be experiencing high load. Please try again.');
      }
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network error connecting to analysis API. Please check your internet connection and try again.');
      }
      
      // Provide a more user-friendly error message
      throw new Error(`Analysis failed: ${error.message || 'Unknown error occurred'}`);
    }
  },
  
  // Save analysis results to Supabase
  async saveAnalysisResults(portfolioId: string, analysis: GeminiAnalysis) {
    try {
      console.log('Saving analysis for portfolio:', portfolioId);
      
      // Use portfolio_analysis (singular) to match the SQL table name
      const { data, error } = await supabase
        .from('portfolio_analysis')
        .insert({
          portfolio_id: portfolioId,
          analysis_data: analysis,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Analysis saved successfully:', data);
      return true;
    } catch (error) {
      console.error('Error saving analysis results:', error);
      throw error;
    }
  },
  
  // Get the latest analysis for a portfolio
  async getLatestAnalysis(portfolioId: string) {
    try {
      console.log('Getting latest analysis for portfolio:', portfolioId);
      
      // Use portfolio_analysis (singular) to match the SQL table name
      const { data, error } = await supabase
        .from('portfolio_analysis')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        // If no analysis found, return null instead of throwing an error
        if (error.code === 'PGRST116') {
          console.log('No analysis found for portfolio');
          return null;
        }
        console.error('Supabase query error:', error);
        throw error;
      }
      
      console.log('Found analysis:', data);
      return data;
    } catch (error) {
      console.error('Error getting analysis:', error);
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
  }
};
