// Supabase Edge Function for company data ingestion
// This function fetches and stores company data from EODHD API
// It can be triggered manually from the admin panel or run on a schedule

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Define CORS headers directly to avoid import issues
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// EODHD API key
const EODHD_API_KEY = Deno.env.get('EODHD_API_KEY') || '';

// Admin API key for secure access
const ADMIN_API_KEY = Deno.env.get('ADMIN_API_KEY') || '';

interface Company {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    // Skip auth check for scheduled invocations (which will have a special header)
    const isScheduled = req.headers.get('x-scheduled-function') === 'true';
    
    if (!isScheduled && token !== ADMIN_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const url = new URL(req.url);
    const symbol = url.searchParams.get('symbol');
    const type = url.searchParams.get('type') || 'all';
    
    // If symbol is provided, update just that company
    if (symbol) {
      const result = await updateCompanyData(symbol, type);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Otherwise, update all tracked companies
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, symbol, exchange')
      .eq('is_tracked', true);
    
    if (error) {
      throw error;
    }
    
    // Define result type for the array
    interface CompanyResult {
      symbol: string;
      status: string;
      data?: any;
      error?: string;
    }
    
    const results: CompanyResult[] = [];
    for (const company of companies) {
      try {
        const result = await updateCompanyData(company.symbol, type);
        results.push({ symbol: company.symbol, status: 'success', data: result });
      } catch (err: any) {
        results.push({ symbol: company.symbol, status: 'error', error: err.message });
      }
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function updateCompanyData(symbol: string, type: string = 'all'): Promise<any> {
  // Get company ID from database
  const { data: company, error } = await supabase
    .from('companies')
    .select('id, exchange')
    .eq('symbol', symbol)
    .single();
  
  if (error) {
    throw new Error(`Company not found: ${error.message}`);
  }
  
  // Define result interface to fix type errors
  interface ResultData {
    fundamentals?: string | { error: string };
    financials?: string | { error: string };
    peers?: string | { error: string };
    [key: string]: any;
  }
  
  const results: ResultData = {};
  const fullSymbol = `${symbol}.${company.exchange}`;
  
  // Update fundamentals
  if (type === 'all' || type === 'fundamentals') {
    try {
      const fundamentalsData = await fetchEODHDData(`/fundamentals/${fullSymbol}`);
      
      // Update company record with fundamental data
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          sector: fundamentalsData.General?.Sector || null,
          industry: fundamentalsData.General?.Industry || null,
          description: fundamentalsData.General?.Description || null,
          logo_url: fundamentalsData.General?.LogoURL || null,
          website: fundamentalsData.General?.WebURL || null,
          employee_count: fundamentalsData.General?.FullTimeEmployees || null,
          ceo: fundamentalsData.General?.Officers?.CEO || null,
          founded_year: fundamentalsData.General?.IPODate ? new Date(fundamentalsData.General.IPODate).getFullYear() : null,
          market_cap: fundamentalsData.Highlights?.MarketCapitalization || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id);
      
      if (updateError) {
        throw updateError;
      }
      
      results.fundamentals = 'updated';
    } catch (err) {
      results.fundamentals = { error: err.message };
    }
  }
  
  // Update financial metrics
  if (type === 'all' || type === 'financials') {
    try {
      // Fetch annual financials
      const annualFinancials = await fetchEODHDData(`/fundamentals/${fullSymbol}?filter=Financials::Balance_Sheet::yearly,Financials::Income_Statement::yearly,Financials::Cash_Flow::yearly`);
      
      // Process and store financial metrics
      if (annualFinancials.Financials) {
        // Process income statement data
        if (annualFinancials.Financials.Income_Statement?.yearly) {
          const incomeData = annualFinancials.Financials.Income_Statement.yearly;
          const years = Object.keys(incomeData.totalRevenue || {});
          
          for (const year of years) {
            try {
              // Extract financial metrics for this period
              const metrics = {
                company_id: company.id,
                period: year,
                period_type: 'annual',
                revenue: incomeData.totalRevenue?.[year] || null,
                net_income: incomeData.netIncome?.[year] || null,
                eps: incomeData.eps?.[year] || null,
                ebitda: incomeData.ebitda?.[year] || null,
                gross_margin: incomeData.grossProfit?.[year] ? (incomeData.grossProfit[year] / incomeData.totalRevenue[year]) * 100 : null,
                operating_margin: incomeData.operatingIncome?.[year] ? (incomeData.operatingIncome[year] / incomeData.totalRevenue[year]) * 100 : null,
                profit_margin: incomeData.netIncome?.[year] ? (incomeData.netIncome[year] / incomeData.totalRevenue[year]) * 100 : null,
              };
              
              // Upsert financial metrics
              const { error: metricsError } = await supabase
                .from('financial_metrics')
                .upsert([metrics], { onConflict: 'company_id,period,period_type' });
              
              if (metricsError) {
                console.error(`Error upserting metrics for ${symbol} (${year}):`, metricsError);
              }
              
              // Store raw financial statements
              const incomeStatement = {};
              for (const key in incomeData) {
                if (incomeData[key]?.[year] !== undefined) {
                  incomeStatement[key] = incomeData[key][year];
                }
              }
              
              const { error: statementError } = await supabase
                .from('financial_statements')
                .upsert([{
                  company_id: company.id,
                  period: year,
                  period_type: 'annual',
                  statement_type: 'income',
                  data: incomeStatement
                }], { onConflict: 'company_id,period,period_type,statement_type' });
              
              if (statementError) {
                console.error(`Error upserting income statement for ${symbol} (${year}):`, statementError);
              }
            } catch (err) {
              console.error(`Error processing financial data for ${symbol} (${year}):`, err);
            }
          }
        }
        
        results.financials = 'updated';
      } else {
        results.financials = 'no data available';
      }
    } catch (err) {
      results.financials = { error: err.message };
    }
  }
  
  // Update peer comparisons
  if (type === 'all' || type === 'peers') {
    try {
      // Get sector for the company
      const { data: companyWithSector } = await supabase
        .from('companies')
        .select('sector')
        .eq('id', company.id)
        .single();
      
      if (companyWithSector?.sector) {
        // Find peer companies in the same sector
        const { data: peers } = await supabase
          .from('companies')
          .select('id, symbol, name, market_cap')
          .eq('sector', companyWithSector.sector)
          .neq('symbol', symbol)
          .order('market_cap', { ascending: false })
          .limit(10);
        
        if (peers && peers.length > 0) {
          // Fetch additional metrics for peer companies
          const peerData = await Promise.all(
            peers.map(async (peer) => {
              try {
                // Get latest financial metrics
                const { data: metrics } = await supabase
                  .from('financial_metrics')
                  .select('revenue, net_income, pe_ratio, dividend_yield')
                  .eq('company_id', peer.id)
                  .eq('period_type', 'annual')
                  .order('period', { ascending: false })
                  .limit(1)
                  .single();
                
                return {
                  symbol: peer.symbol,
                  name: peer.name,
                  market_cap: peer.market_cap,
                  pe_ratio: metrics?.pe_ratio || null,
                  revenue: metrics?.revenue || null,
                  net_income: metrics?.net_income || null,
                  dividend_yield: metrics?.dividend_yield || null
                };
              } catch (err) {
                // Return basic peer data if metrics aren't available
                return {
                  symbol: peer.symbol,
                  name: peer.name,
                  market_cap: peer.market_cap
                };
              }
            })
          );
          
          // Upsert peer comparison data
          const { error: peerError } = await supabase
            .from('peer_comparisons')
            .upsert([{
              company_id: company.id,
              peer_data: peerData,
              cached_at: new Date().toISOString()
            }], { onConflict: 'company_id' });
          
          if (peerError) {
            throw peerError;
          }
          
          results.peers = 'updated';
        } else {
          results.peers = 'no peers found';
        }
      } else {
        results.peers = 'no sector information';
      }
    } catch (err) {
      results.peers = { error: err.message };
    }
  }
  
  return results;
}

async function fetchEODHDData(endpoint: string): Promise<any> {
  try {
    const url = `https://eodhistoricaldata.com/api${endpoint}${endpoint.includes('?') ? '&' : '?'}api_token=${EODHD_API_KEY}&fmt=json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`EODHD API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Error fetching EODHD data:', error);
    throw new Error(`EODHD API error: ${error.message}`);
  }
}
