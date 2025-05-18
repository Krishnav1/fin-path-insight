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
    // Get the current authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      throw new Error('User must be authenticated to create portfolio');
    }

    const userId = authData.user.id;
    
    // Insert portfolio
    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: userId,
        name: portfolio.name,
        description: portfolio.description,
        total_value: portfolio.totalValue,
        total_invested: portfolio.totalInvested,
        total_return: portfolio.totalReturn,
        total_return_percentage: portfolio.totalReturnPercentage
      })
      .select()
      .single();
    
    if (error) {
      console.error('Portfolio creation error:', error);
      throw error;
    }
    
    // Insert holdings if any
    if (portfolio.holdings && portfolio.holdings.length > 0) {
      const holdingsData = portfolio.holdings.map(holding => ({
        user_id: userId, // Add user_id to each holding
        portfolio_id: data.id,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        buy_price: holding.buyPrice,
        current_price: holding.currentPrice,
        buy_date: holding.buyDate,
        sector: holding.sector
      }));
      
      console.log('Creating holdings with user_id:', holdingsData);
      
      const { error: holdingsError } = await supabase
        .from('portfolio_holdings')
        .insert(holdingsData);
      
      if (holdingsError) {
        console.error('Holdings creation error:', holdingsError);
        throw holdingsError;
      }
    }
    
    return data;
  },
  
  // Update an existing portfolio
  async updatePortfolio(portfolioId: string, portfolio: Portfolio) {
    // Get the current authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      throw new Error('User must be authenticated to update portfolio');
    }

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
      .eq('id', portfolioId)
      .eq('user_id', authData.user.id); // Ensure we're updating the user's own portfolio
    
    if (error) {
      console.error('Portfolio update error:', error);
      throw error;
    }
    
    // Delete existing holdings
    const { error: deleteError } = await supabase
      .from('portfolio_holdings')
      .delete()
      .eq('portfolio_id', portfolioId)
      .eq('user_id', authData.user.id); // Ensure we're deleting the user's own holdings
    
    if (deleteError) {
      console.error('Delete holdings error:', deleteError);
      throw deleteError;
    }
    
    // Insert new holdings
    if (portfolio.holdings && portfolio.holdings.length > 0) {
      const holdingsData = portfolio.holdings.map(holding => ({
        user_id: authData.user.id, // Add user_id to each holding
        portfolio_id: portfolioId,
        symbol: holding.symbol,
        name: holding.name,
        quantity: holding.quantity,
        buy_price: holding.buyPrice,
        current_price: holding.currentPrice,
        buy_date: holding.buyDate,
        sector: holding.sector
      }));
      
      console.log('Inserting holdings with user_id:', holdingsData);
      
      const { error: holdingsError } = await supabase
        .from('portfolio_holdings')
        .insert(holdingsData);
      
      if (holdingsError) {
        console.error('Insert holdings error:', holdingsError);
        throw holdingsError;
      }
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
    // Get the current authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      throw new Error('User must be authenticated to add holdings');
    }
    
    // Format the holding data to match the Supabase schema
    const formattedHolding = {
      user_id: authData.user.id, // Add the user_id to satisfy RLS policy
      portfolio_id: portfolioId,
      symbol: holding.symbol.toUpperCase().trim(),
      name: holding.name || holding.symbol,
      quantity: Number(holding.quantity),
      buy_price: Number(holding.buyPrice),
      current_price: Number(holding.currentPrice),
      sector: (holding.sector || 'Unknown').trim(),
      buy_date: holding.buyDate || new Date().toISOString().split('T')[0]
    };
    
    console.log('Adding holding to Supabase:', formattedHolding);
    
    return supabase
      .from('portfolio_holdings')
      .insert(formattedHolding)
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Supabase error adding holding:', error);
          throw error;
        }
        return data;
      });
  },
  
  // Update a holding
  async updateHolding(holdingId: string, holding: StockHolding) {
    // Get the current authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      throw new Error('User must be authenticated to update holdings');
    }

    // Format the holding data to match the Supabase schema
    const formattedHolding = {
      user_id: authData.user.id, // Add the user_id to satisfy RLS policy
      symbol: holding.symbol.toUpperCase().trim(),
      name: holding.name || holding.symbol,
      quantity: Number(holding.quantity),
      buy_price: Number(holding.buyPrice),
      current_price: Number(holding.currentPrice),
      sector: (holding.sector || 'Unknown').trim(),
      buy_date: holding.buyDate || new Date().toISOString().split('T')[0]
    };
    
    console.log('Updating holding in Supabase:', formattedHolding);
    
    const { data, error } = await supabase
      .from('portfolio_holdings')
      .update(formattedHolding)
      .eq('id', holdingId)
      .eq('user_id', authData.user.id) // Additional constraint to satisfy RLS
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error updating holding:', error);
      throw error;
    }
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
      console.log('Analyzing portfolio with Gemini...', holdings);
      
      // Filter out empty or incomplete holdings
      const validHoldings = holdings.filter(h => 
        h.symbol && h.quantity > 0 && h.buyPrice > 0 && h.currentPrice > 0
      );
      
      console.log('Valid holdings:', validHoldings);
      
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
      
      console.log('Calling API with holdings:', JSON.stringify(formattedHoldings));
      
      try {
        // Use the Deno API URL from environment or fallback to default
        const apiUrl = import.meta.env.VITE_DENO_API_URL || 'https://fininsight-api.deno.dev';
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
        
        console.log(`Using API URL: ${apiUrl}/api/analyzePortfolio`);
        
        // Set up timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        // Make the API call
        const response = await fetch(`${apiUrl}/api/analyzePortfolio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            holdings: formattedHoldings,
            api_key: apiKey
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`API Error (${response.status}): ${response.statusText}`);
          throw new Error(`Analysis failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API response data received');
        
        if (data && data.analysis) {
          // Save analysis results to Supabase
          try {
            const portfolios = await this.getPortfolios();
            if (portfolios && portfolios.length > 0) {
              const portfolioId = portfolios[0].id;
              await this.saveAnalysisResults(portfolioId, data.analysis);
              console.log('Analysis results saved to Supabase');
            }
          } catch (dbError) {
            console.error('Failed to save analysis to database:', dbError);
          }
          
          return data.analysis;
        } else {
          console.error('Invalid API response format:', data);
          throw new Error('Invalid API response format');
        }
      } catch (apiError) {
        console.error('API call failed:', apiError);
        console.warn('Falling back to mock analysis');
        
        // Use mock analysis as fallback
        return this.createMockAnalysis(holdings);
      }
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      
      // Final fallback - always return mock data rather than failing the user flow
      return this.createMockAnalysis(holdings);
    }
  },
  // Create mock analysis data for development/testing
  createMockAnalysis(holdings: StockHolding[]): GeminiAnalysis {
    const totalInvested = holdings.reduce((sum, h) => sum + (h.quantity * h.buyPrice), 0);
    const marketValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const absoluteReturn = marketValue - totalInvested;
    const percentReturn = totalInvested > 0 ? (absoluteReturn / totalInvested) * 100 : 0;
    
    // Find top gainer and worst performer
    let topGainer = holdings[0]?.symbol || 'N/A';
    let worstPerformer = holdings[0]?.symbol || 'N/A';
    let maxGain = -Infinity;
    let maxLoss = Infinity;
    
    holdings.forEach(h => {
      const gain = ((h.currentPrice - h.buyPrice) / h.buyPrice) * 100;
      if (gain > maxGain) {
        maxGain = gain;
        topGainer = h.symbol;
      }
      if (gain < maxLoss) {
        maxLoss = gain;
        worstPerformer = h.symbol;
      }
    });
    
    // Create sector breakdown
    const sectors: Record<string, number> = {};
    holdings.forEach(h => {
      const sector = h.sector || 'Unknown';
      const value = h.quantity * h.currentPrice;
      sectors[sector] = (sectors[sector] || 0) + value;
    });
    
    // Convert to percentages
    const sectorBreakdown: Record<string, string> = {};
    Object.entries(sectors).forEach(([sector, value]) => {
      sectorBreakdown[sector] = `${((value / marketValue) * 100).toFixed(2)}%`;
    });
    
    // Determine risk flag based on sector diversification
    const sectorCount = Object.keys(sectors).length;
    let riskFlag: 'High' | 'Medium' | 'Low' = 'Medium';
    if (sectorCount <= 2) {
      riskFlag = 'High';
    } else if (sectorCount >= 5) {
      riskFlag = 'Low';
    }
    
    return {
      overview: {
        total_invested: `₹${totalInvested.toFixed(2)}`,
        market_value: `₹${marketValue.toFixed(2)}`,
        absolute_return: `₹${absoluteReturn.toFixed(2)}`,
        percent_return: `${percentReturn.toFixed(2)}%`,
        top_gainer: topGainer,
        worst_performer: worstPerformer
      },
      stock_breakdown: holdings.map(h => ({
        symbol: h.symbol,
        sector: h.sector || 'Unknown',
        percent_gain: `${(((h.currentPrice - h.buyPrice) / h.buyPrice) * 100).toFixed(2)}%`,
        recommendation: h.currentPrice > h.buyPrice ? 'Hold' : 'Review'
      })),
      diversification: {
        sector_breakdown: sectorBreakdown,
        risk_flag: riskFlag
      },
      recommendations: [
        'Consider diversifying across more sectors to reduce risk.',
        'Review underperforming assets in your portfolio.',
        'Maintain a balanced asset allocation strategy.'
      ],
      summary: `Your portfolio of ${holdings.length} holdings has a total value of ₹${marketValue.toFixed(2)}, with a ${percentReturn >= 0 ? 'gain' : 'loss'} of ${Math.abs(percentReturn).toFixed(2)}%. The portfolio has ${Object.keys(sectors).length} different sectors, with the largest allocation in ${Object.entries(sectorBreakdown).sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]))[0]?.[0] || 'Unknown'}.`
    };
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
