// Company Data Ingestion for EODHD API
// Handles bulk data fetching and storing to Supabase
// To be run on schedule via Deno Deploy Cron

import { createClient } from '@supabase/supabase-js';
// Using a type-only approach instead of Zod for simplicity

// Type definitions
type Result = {
  symbol: string;
  success: boolean;
  error?: string;
  timestamp: string;
};

type PeerData = {
  symbol: string;
  name: string;
  market_cap?: number;
  pe_ratio?: number;
  revenue?: number;
  net_income?: number;
  dividend_yield?: number;
};

type CompanyData = {
  symbol: string;
  name?: string;
  exchange?: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  ceo?: string;
  employees?: number;
  marketCapitalization?: number;
  address?: string;
  phone?: string;
  country?: string;
};

// Periods for financial data
type PeriodType = 'annual' | 'quarterly';

// EODHD API base URL
const EODHD_BASE_URL = 'https://eodhd.com/api';

// Initialize Supabase
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials in environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Get API key from environment
function getEodhdApiKey() {
  const apiKey = Deno.env.get('EODHD_API_KEY') || '';
  if (!apiKey) {
    throw new Error('Missing EODHD API key in environment variables');
  }
  return apiKey;
}

// Helper function to make EODHD API requests
async function fetchFromEodhd(endpoint: string, params: Record<string, string> = {}) {
  const apiKey = getEodhdApiKey();
  const queryParams = new URLSearchParams({ api_token: apiKey, ...params });
  const url = `${EODHD_BASE_URL}${endpoint}?${queryParams.toString()}`;
  
  console.log(`Fetching from EODHD: ${url}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'FinPathInsight/1.0'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EODHD API Error (${response.status}): ${errorText}`);
  }
  
  return response.json();
}

// Fetch tracked companies from Supabase
async function getTrackedCompanies(supabase: any, activeOnly = true) {
  const { data, error } = await supabase
    .from('tracked_companies')
    .select('*')
    .eq('is_active', activeOnly);
  
  if (error) throw new Error(`Failed to fetch tracked companies: ${error.message}`);
  return data || [];
}

// Fetch and store fundamental data for a company
async function fetchAndStoreCompanyFundamentals(supabase: any, symbol: string, exchange: string) {
  try {
    // Fetch fundamentals from EODHD
    const fullSymbol = `${symbol}${exchange ? '.' + exchange : ''}`;
    const fundamentals = await fetchFromEodhd(`/fundamentals/${fullSymbol}`);
    
    if (!fundamentals || typeof fundamentals !== 'object') {
      console.error(`No valid fundamentals data for ${fullSymbol}`);
      return false;
    }
    
    // Extract company data
    const companyData = {
      symbol: symbol,
      name: fundamentals.General?.Name || symbol,
      exchange: exchange || fundamentals.General?.Exchange || '',
      country: fundamentals.General?.CountryName || '',
      sector: fundamentals.General?.Sector || '',
      industry: fundamentals.General?.Industry || '',
      description: fundamentals.General?.Description || '',
      website: fundamentals.General?.WebURL || '',
      employee_count: fundamentals.General?.FullTimeEmployees || null,
      ceo: fundamentals.General?.Officers?.CEO || '',
      founded_year: fundamentals.General?.IPODate ? new Date(fundamentals.General.IPODate).getFullYear() : null,
      market_cap: fundamentals.Highlights?.MarketCapitalization || null,
      is_tracked: true,
      updated_at: new Date()
    };
    
    // Update or insert company data
    const { error: companyError } = await supabase
      .from('companies')
      .upsert(companyData, { onConflict: 'symbol' });
    
    if (companyError) {
      console.error(`Error updating company data for ${symbol}: ${companyError.message}`);
      return false;
    }
    
    // Get company ID for related tables
    const { data: companyRecord, error: companyFetchError } = await supabase
      .from('companies')
      .select('id')
      .eq('symbol', symbol)
      .single();
    
    if (companyFetchError || !companyRecord) {
      console.error(`Error fetching company ID for ${symbol}: ${companyFetchError?.message || 'No record found'}`);
      return false;
    }
    
    const companyId = companyRecord.id;
    
    // Extract and store key financial metrics
    if (fundamentals.Highlights) {
      const currentYear = new Date().getFullYear().toString();
      const financialMetrics = {
        company_id: companyId,
        period: currentYear,
        period_type: 'annual' as PeriodType,
        revenue: fundamentals.Highlights.RevenueTTM || null,
        net_income: fundamentals.Highlights.NetIncomeTTM || null,
        eps: fundamentals.Highlights.EPS || null,
        pe_ratio: fundamentals.Highlights.PERatio || null,
        market_cap: fundamentals.Highlights.MarketCapitalization || null,
        dividend_yield: fundamentals.Highlights.DividendYield || null,
        profit_margin: fundamentals.Highlights.ProfitMargin || null,
        operating_margin: fundamentals.Highlights.OperatingMarginTTM || null,
        return_on_equity: fundamentals.Highlights.ROE || null,
        return_on_assets: fundamentals.Highlights.ROA || null,
        debt_to_equity: fundamentals.Highlights.TotalDebtToEquity || null,
        current_ratio: fundamentals.Highlights.CurrentRatio || null,
        quick_ratio: fundamentals.Highlights.QuickRatio || null,
        free_cash_flow: fundamentals.Highlights.FreeCashFlow || null,
        ebitda: fundamentals.Highlights.EBITDA || null,
        gross_margin: fundamentals.Highlights.GrossMarginTTM || null,
        updated_at: new Date()
      };
      
      const { error: metricsError } = await supabase
        .from('financial_metrics')
        .upsert(financialMetrics, { 
          onConflict: 'company_id,period,period_type'
        });
      
      if (metricsError) {
        console.error(`Error updating financial metrics for ${symbol}: ${metricsError.message}`);
      }
    }
    
    console.log(`Successfully updated company data for ${symbol}`);
    return true;
  } catch (error) {
    console.error(`Error processing ${symbol}: ${error.message}`);
    return false;
  }
}

// Fetch and store financial statements for a company
async function fetchAndStoreFinancialStatements(supabase: any, symbol: string, exchange: string) {
  try {
    const fullSymbol = `${symbol}${exchange ? '.' + exchange : ''}`;
    
    // Get company ID
    const { data: companyRecord, error: companyFetchError } = await supabase
      .from('companies')
      .select('id')
      .eq('symbol', symbol)
      .single();
    
    if (companyFetchError || !companyRecord) {
      console.error(`Error fetching company ID for ${symbol}: ${companyFetchError?.message || 'No record found'}`);
      return false;
    }
    
    const companyId = companyRecord.id;
    
    // Fetch different statement types
    const statementTypes = [
      { type: 'income', endpoint: `/fundamentals/${fullSymbol}/income-statement` },
      { type: 'balance', endpoint: `/fundamentals/${fullSymbol}/balance-sheet` },
      { type: 'cash_flow', endpoint: `/fundamentals/${fullSymbol}/cash-flow` }
    ];
    
    for (const { type, endpoint } of statementTypes) {
      // Fetch annual statements
      const statements = await fetchFromEodhd(endpoint, { period: 'annual' });
      
      if (!Array.isArray(statements)) {
        console.error(`Invalid ${type} statement data for ${symbol}`);
        continue;
      }
      
      // Process each period's statement data
      for (const statement of statements.slice(0, 4)) { // Store last 4 years only
        if (!statement.date) continue;
        
        const period = statement.date.split('-')[0]; // Extract year
        
        const financialStatement = {
          company_id: companyId,
          period,
          period_type: 'annual' as PeriodType,
          statement_type: type,
          data: statement,
          updated_at: new Date()
        };
        
        const { error: statementError } = await supabase
          .from('financial_statements')
          .upsert(financialStatement, { 
            onConflict: 'company_id,period,period_type,statement_type'
          });
        
        if (statementError) {
          console.error(`Error updating ${type} statement for ${symbol}: ${statementError.message}`);
        }
      }
      
      console.log(`Successfully updated ${type} statements for ${symbol}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error processing financial statements for ${symbol}: ${error.message}`);
    return false;
  }
}

// Fetch and store peer comparison data
async function fetchAndStorePeerComparisons(supabase: any, symbol: string, exchange: string) {
  // Define peer data array with proper typing
  const peerData: PeerData[] = [];
  try {
    const fullSymbol = `${symbol}${exchange ? '.' + exchange : ''}`;
    
    // Get company ID
    const { data: companyRecord, error: companyFetchError } = await supabase
      .from('companies')
      .select('id')
      .eq('symbol', symbol)
      .single();
    
    if (companyFetchError || !companyRecord) {
      console.error(`Error fetching company ID for ${symbol}: ${companyFetchError?.message || 'No record found'}`);
      return false;
    }
    
    const companyId = companyRecord.id;
    
    // Fetch peers data
    const peers = await fetchFromEodhd(`/fundamentals/${fullSymbol}/peers`);
    
    if (!Array.isArray(peers)) {
      console.error(`Invalid peers data for ${symbol}`);
      return false;
    }
    
    // Store only top 5 peers
    const topPeers = peers.slice(0, 5);
    for (const peerSymbol of topPeers) {
      try {
        // Get basic metrics for this peer
        const peerMetrics = await fetchFromEodhd(`/fundamentals/${peerSymbol}?filter=Highlights`);
        
        if (peerMetrics && peerMetrics.Highlights) {
          peerData.push({            
            symbol: peerSymbol,
            name: peerMetrics.General?.Name || peerSymbol,
            market_cap: peerMetrics.Highlights.MarketCapitalization,
            pe_ratio: peerMetrics.Highlights.PERatio,
            revenue: peerMetrics.Highlights.RevenueTTM,
            net_income: peerMetrics.Highlights.NetIncomeTTM,
            dividend_yield: peerMetrics.Highlights.DividendYield,
          });
        }
      } catch (peerError) {
        console.error(`Error fetching data for peer ${peerSymbol}: ${peerError.message}`);
      }
    }
    
    // Store peer comparison data
    const peerComparison = {
      company_id: companyId,
      peer_data: peerData,
      cached_at: new Date()
    };
    
    const { error: peerError } = await supabase
      .from('peer_comparisons')
      .upsert(peerComparison, { onConflict: 'company_id' });
    
    if (peerError) {
      console.error(`Error updating peer comparisons for ${symbol}: ${peerError.message}`);
      return false;
    }
    
    console.log(`Successfully updated peer comparisons for ${symbol}`);
    return true;
  } catch (error) {
    console.error(`Error processing peer comparisons for ${symbol}: ${error.message}`);
    return false;
  }
}

// Main handler for company data ingestion
export async function companyDataIngest(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
  try {
    // Check if this is a scheduled run
    const url = new URL(req.url);
    const isScheduled = url.searchParams.get('scheduled') === 'true';
    
    // For security, only allow scheduled runs or manual triggers with proper auth
    if (!isScheduled) {
      const authHeader = req.headers.get('Authorization');
      const isAdminRequest = authHeader?.startsWith('Bearer ') && 
                             authHeader.substring(7) === Deno.env.get('ADMIN_API_KEY');
      
      if (!isAdminRequest) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const supabase = getSupabaseClient();
    
    // Get the update type from query param (fundamentals, financials, peers, news, all)
    const updateType = url.searchParams.get('type') || 'all';
    
    // Get filtered set of companies to update
    const symbol = url.searchParams.get('symbol');
    const country = url.searchParams.get('country');
    
    // Get tracked companies
    let companies = await getTrackedCompanies(supabase);
    
    // Apply filters if specified
    if (symbol) {
      companies = companies.filter(c => c.symbol === symbol);
    }
    
    if (country) {
      companies = companies.filter(c => c.country === country);
    }
    
    const results: Result[] = [];
    
    // Process each company
    for (const company of companies) {
      try {
        let success = false;
        const { symbol, exchange } = company;
        
        // Determine what to update based on the update type
        switch (updateType) {
          case 'fundamentals':
            success = await fetchAndStoreCompanyFundamentals(supabase, symbol, exchange);
            break;
          case 'financials':
            success = await fetchAndStoreFinancialStatements(supabase, symbol, exchange);
            break;
          case 'peers':
            success = await fetchAndStorePeerComparisons(supabase, symbol, exchange);
            break;
          case 'all':
          default:
            // Update everything
            const fundamentalsSuccess = await fetchAndStoreCompanyFundamentals(supabase, symbol, exchange);
            const financialsSuccess = await fetchAndStoreFinancialStatements(supabase, symbol, exchange);
            const peersSuccess = await fetchAndStorePeerComparisons(supabase, symbol, exchange);
            
            success = fundamentalsSuccess && financialsSuccess && peersSuccess;
            break;
        }
        
        results.push({
          symbol,
          success,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          symbol: company.symbol,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: results.length,
        results
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in company data ingest:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Scheduled job handler - to be called by Deno Deploy Cron
export async function scheduledCompanyDataUpdate() {
  try {
    console.log('Starting scheduled company data update');
    
    const supabase = getSupabaseClient();
    const companies = await getTrackedCompanies(supabase);
    
    console.log(`Found ${companies.length} tracked companies to update`);
    
    let successCount = 0;
    
    // Process each company
    for (const company of companies) {
      try {
        const { symbol, exchange } = company;
        
        // Update company fundamentals
        const fundamentalsSuccess = await fetchAndStoreCompanyFundamentals(supabase, symbol, exchange);
        
        // Update financial statements if fundamentals were successful
        let financialsSuccess = false;
        if (fundamentalsSuccess) {
          financialsSuccess = await fetchAndStoreFinancialStatements(supabase, symbol, exchange);
        }
        
        // Update peer comparisons
        const peersSuccess = await fetchAndStorePeerComparisons(supabase, symbol, exchange);
        
        if (fundamentalsSuccess && financialsSuccess && peersSuccess) {
          successCount++;
        }
      } catch (error) {
        console.error(`Error updating data for ${company.symbol}: ${error.message}`);
      }
    }
    
    console.log(`Company data update completed. Updated ${successCount}/${companies.length} companies successfully`);
    
    // Update the last_updated timestamp
    const { error: updateError } = await supabase
      .from('system_settings')
      .upsert({ 
        key: 'company_data_last_update',
        value: new Date().toISOString()
      }, { onConflict: 'key' });
      
    if (updateError) {
      console.error(`Error updating last_update timestamp: ${updateError.message}`);
    }
    
    return { success: true, updated: successCount, total: companies.length };
  } catch (error) {
    console.error('Error in scheduled company data update:', error);
    return { success: false, error: error.message };
  }
}
