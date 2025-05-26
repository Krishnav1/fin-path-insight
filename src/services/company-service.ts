// NOTE: Ensure Supabase RLS (Row Level Security) policies allow access for all tables used below for the current user/session.
import { supabase } from '@/lib/supabase';
import { callEdgeFunction, EdgeFunctionErrorType } from '@/lib/edge-function-client';
import { API_ENDPOINTS } from '@/config/api-config';

const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY;

// Define interfaces for company data
export interface Company {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  sector: string;
  industry: string;
  description: string;
  business_model: string;
  industry_context: string;
  logo_url: string;
  website: string;
  employee_count: number;
  ceo: string;
  founded_year: number;
  market_cap: number;
}

export interface FinancialMetric {
  id: string;
  company_id: string;
  period: string;
  period_type: 'annual' | 'quarterly';
  revenue: number;
  net_income: number;
  eps: number;
  pe_ratio: number;
  market_cap: number;
  dividend_yield: number;
  profit_margin: number;
  operating_margin: number;
  return_on_equity: number;
  return_on_assets: number;
  debt_to_equity: number;
  current_ratio: number;
  quick_ratio: number;
  free_cash_flow: number;
  ebitda: number;
  gross_margin: number;
}

export interface FinancialStatement {
  id: string;
  company_id: string;
  period: string;
  period_type: 'annual' | 'quarterly';
  statement_type: 'income' | 'balance' | 'cash_flow';
  data: Record<string, any>;
}

export interface PeerComparison {
  id: string;
  company_id: string;
  peer_data: Array<{
    symbol: string;
    name: string;
    market_cap?: number;
    pe_ratio?: number;
    revenue?: number;
    net_income?: number;
    dividend_yield?: number;
  }>;
  cached_at: string;
}

export interface CompanyInsights {
  id: string;
  company_id: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  summary: string;
  generated_at: string;
}

export interface NewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  image_url?: string;
  published_at: string;
}

// Company service for fetching and managing company data
export const companyService = {
  // Get all tracked companies
  async getTrackedCompanies() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('is_tracked', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },
  
  // Get company by symbol
  async getCompanyBySymbol(symbol: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('symbol', symbol)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Get company by ID
  async getCompanyById(id: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Get financial metrics for a company
  async getFinancialMetrics(companyId: string, periodType: 'annual' | 'quarterly' = 'annual') {
    const { data, error } = await supabase
      .from('financial_metrics')
      .select('*')
      .eq('company_id', companyId)
      .eq('period_type', periodType)
      .order('period', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Get financial statements for a company
  async getFinancialStatements(
    companyId: string, 
    statementType: 'income' | 'balance' | 'cash_flow', 
    periodType: 'annual' | 'quarterly' = 'annual'
  ) {
    const { data, error } = await supabase
      .from('financial_statements')
      .select('*')
      .eq('company_id', companyId)
      .eq('statement_type', statementType)
      .eq('period_type', periodType)
      .order('period', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Get peer comparison data
  async getPeerComparison(companyId: string) {
    const { data, error } = await supabase
      .from('peer_comparisons')
      .select('*')
      .eq('company_id', companyId)
      .single();
    
    if (error) {
      // If no peer data is found, return an empty object
      if (error.code === 'PGRST116') {
        return { peer_data: [] };
      }
      throw error;
    }
    
    return data;
  },
  
  // Get company insights (SWOT analysis)
  async getCompanyInsights(companyId: string) {
    const { data, error } = await supabase
      .from('company_insights')
      .select('*')
      .eq('company_id', companyId)
      .single();
    
    if (error) {
      // If no insights are found, return an empty object
      if (error.code === 'PGRST116') {
        return {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          threats: [],
          summary: ''
        };
      }
      throw error;
    }
    
    return data;
  },
  
  // Get company news
  async getCompanyNews(symbol: string) {
    // First check if we have cached news
    const { data: cachedNews, error: cacheError } = await supabase
      .from('news_cache')
      .select('articles, cached_at')
      .eq('company_id', (await this.getCompanyBySymbol(symbol)).id)
      .single();
    
    // If we have fresh cached news (less than 24 hours old), use it
    if (cachedNews && !cacheError) {
      const cachedAt = new Date(cachedNews.cached_at);
      const now = new Date();
      const hoursSinceCached = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceCached < 24) {
        return cachedNews.articles;
      }
    }
    
    // If no fresh cache, fetch from API
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiUrl}/api/eodhd-proxy/news?s=${symbol}&limit=10`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.statusText}`);
      }
      
      const news = await response.json();
      return news;
    } catch (error) {
      console.error('Error fetching company news:', error);
      return [];
    }
  },
  
  // Get technical chart data
  async getChartData(symbol: string, timeframe: string = '1d') {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiUrl}/api/eodhd-proxy/eod?symbol=${symbol}&period=${timeframe}&order=d`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.statusText}`);
      }
      
      const chartData = await response.json();
      return chartData;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      return [];
    }
  },
  
  // Search companies by name or symbol
  async searchCompanies(query: string) {
    if (!query || query.length < 2) return [];
    
    const { data, error } = await supabase
      .from('companies')
      .select('id, symbol, name, sector, exchange')
      .or(`name.ilike.%${query}%,symbol.ilike.%${query}%`)
      .limit(10);
    
    if (error) throw error;
    return data;
  },
  
  // Get companies by sector
  async getCompaniesBySector(sector: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('id, symbol, name, sector, market_cap')
      .eq('sector', sector)
      .order('market_cap', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    return data;
  },
  
  // For admin: Trigger data update for a company
  async triggerCompanyDataUpdate(symbol: string, updateType: 'fundamentals' | 'financials' | 'peers' | 'all' = 'all') {
    try {
      // Use the centralized Edge Function client with the proper endpoint
      const { data, error } = await callEdgeFunction(
        API_ENDPOINTS.COMPANY_DATA_INGEST,
        'POST',
        { symbol, type: updateType },
        {
          customHeaders: {
            'Authorization': `Bearer ${ADMIN_API_KEY}`
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      if (error) {
        console.error('Error triggering company data update:', error);
        throw new Error(`Failed to trigger update: ${error.message}`);
      }
      
      return data;
    } catch (error: any) {
      console.error('Error triggering company data update:', error);
      throw error;
    }
  },

  // For admin: Track a new company
  async trackCompany(symbol: string, exchange: string, country: string = 'US') {
    try {
      // First check if company already exists in our database
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id, is_tracked')
        .eq('symbol', symbol)
        .single();
      
      if (existingCompany) {
        // If company exists but is not tracked, update it to tracked
        if (!existingCompany.is_tracked) {
          const { error } = await supabase
            .from('companies')
            .update({ is_tracked: true })
            .eq('id', existingCompany.id);
          
          if (error) throw error;
          return { id: existingCompany.id, message: 'Company tracking enabled' };
        }
        return { id: existingCompany.id, message: 'Company already tracked' };
      }
      
      // If company doesn't exist, fetch basic info from EODHD API and add it
      const apiUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiUrl}/api/eodhd-proxy/fundamentals?symbol=${symbol}.${exchange}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch company data: ${response.statusText}`);
      }
      
      const companyData = await response.json();
      
      // Insert the new company into the database
      const { data, error } = await supabase
        .from('companies')
        .insert([
          {
            symbol: symbol,
            name: companyData.General?.Name || symbol,
            exchange: exchange,
            country: country,
            sector: companyData.General?.Sector || null,
            industry: companyData.General?.Industry || null,
            description: companyData.General?.Description || null,
            logo_url: companyData.General?.LogoURL || null,
            website: companyData.General?.WebURL || null,
            employee_count: companyData.General?.FullTimeEmployees || null,
            ceo: companyData.General?.Officers?.CEO || null,
            founded_year: companyData.General?.IPODate ? new Date(companyData.General.IPODate).getFullYear() : null,
            market_cap: companyData.Highlights?.MarketCapitalization || null,
            is_tracked: true
          }
        ])
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Trigger data ingestion for the new company
      await this.triggerCompanyDataUpdate(symbol);
      
      return { id: data.id, message: 'Company added and tracking enabled' };
    } catch (error) {
      console.error('Error tracking company:', error);
      throw error;
    }
  },
  
  // For admin: Stop tracking a company
  async untrackCompany(symbol: string) {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({ is_tracked: false })
        .eq('symbol', symbol);
      
      if (error) throw error;
      return { message: 'Company tracking disabled' };
    } catch (error) {
      console.error('Error untracking company:', error);
      throw error;
    }
  },
  
  // For admin: Update company business model and industry context
  async updateCompanyDetails(symbol: string, businessModel?: string, industryContext?: string) {
    try {
      const updates: Record<string, any> = {};
      
      if (businessModel !== undefined) {
        updates.business_model = businessModel;
      }
      
      if (industryContext !== undefined) {
        updates.industry_context = industryContext;
      }
      
      if (Object.keys(updates).length === 0) {
        return { message: 'No updates provided' };
      }
      
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('symbol', symbol);
      
      if (error) throw error;
      return { message: 'Company details updated' };
    } catch (error) {
      console.error('Error updating company details:', error);
      throw error;
    }
  }
};

export default companyService;
