// Supabase Edge Function for company data ingestion
// This function fetches and stores company data from EODHD API
// It can be triggered manually from the admin panel or run on a schedule

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Define CORS headers
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
  console.log(`Request received: ${req.url}`); // Log the full URL
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization token`
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || req.headers.get('apikey');

    // Skip auth check for scheduled invocations (which will have a special header)
    const isScheduled = req.headers.get('x-scheduled-function') === 'true';

    // Check for valid authentication:
    // 1. Scheduled function invocation
    // 2. Admin API key
    // 3. Supabase service role key
    // 4. Supabase anon key
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

    if (!isScheduled && 
        token !== ADMIN_API_KEY && 
        token !== SUPABASE_SERVICE_ROLE_KEY && 
        token !== SUPABASE_ANON_KEY) {
      console.log('Authentication failed: Invalid token provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Please provide a valid API key.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request and log parameters for debugging
    const url = new URL(req.url);
    let symbol = url.searchParams.get('symbol');
    let type = url.searchParams.get('type') || 'all';
    
    // If symbol not found in query, check JSON body
    if (!symbol) {
      try {
        const body = await req.json();
        symbol = body.symbol || body.name; // Accept 'name' as a fallback for 'symbol'
        if (body.type) type = body.type;
        console.log(`Parsed from JSON body: symbol=${symbol}, type=${type}`);
      } catch (e) {
        console.log('No valid JSON body or no symbol/name in body.');
      }
    }
    
    console.log(`URL parameters: symbol=${symbol}, type=${type}`);
    console.log(`All parameters:`, Object.fromEntries(url.searchParams.entries()));
    
    // If symbol is provided, update just that company
    if (symbol && symbol.trim() !== '') {
      console.log(`Processing symbol: ${symbol}`);
      const result = await updateCompanyData(symbol, type);
      return new Response(
        JSON.stringify({ results: [result] }), // always returns an array
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('No symbol parameter provided or empty symbol');
      // Check URL to help with debugging
      console.log('URL object:', {
        href: url.href,
        origin: url.origin,
        pathname: url.pathname,
        search: url.search
      });
      
      return new Response(
        JSON.stringify({ 
          results: [], 
          message: "Please provide a symbol parameter",
          debug: {
            url: req.url,
            params: Object.fromEntries(url.searchParams.entries())
          }
        }),
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
    console.error('General error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function updateCompanyData(symbol: string, type: string = 'all'): Promise<any> {
  console.log(`[updateCompanyData] Starting process for symbol: ${symbol}`);
  console.log(`[updateCompanyData] Received symbol: ${symbol}, type: ${type}`);
  let companyRecord;

  // Try to fetch company from DB
  console.log(`[updateCompanyData] Checking if company ${symbol} exists in DB...`);
  const { data: existingCompany, error: fetchError } = await supabase
    .from('companies')
    .select('id, exchange, name, symbol') // Added name and symbol for logging
    .eq('symbol', symbol)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: Row to be returned was not found
    console.error(`[updateCompanyData] Error fetching company ${symbol} from DB:`, fetchError);
    throw new Error(`DB error fetching company ${symbol}: ${fetchError.message}`);
  }

  if (existingCompany) {
    companyRecord = existingCompany;
    console.log(`[updateCompanyData] Company ${symbol} found in DB: ID ${companyRecord.id}, Exchange ${companyRecord.exchange}`);
  } else {
    console.log(`[updateCompanyData] Company ${symbol} not found in DB. Attempting to fetch from EODHD search...`);
    try {
      const searchResults = await fetchEODHDData(`/search/${symbol}`);
      if (!searchResults || searchResults.length === 0) {
        console.error(`[updateCompanyData] No results for ${symbol} from EODHD search.`);
        throw new Error(`No EODHD search results for symbol ${symbol}`);
      }
      
      // Prefer US exchange, otherwise take the first result
      const eodhdCompany = searchResults.find((s: any) => s.Exchange === 'US') || searchResults[0];
      console.log(`[updateCompanyData] EODHD search result for ${symbol}: Code ${eodhdCompany.Code}, Name ${eodhdCompany.Name}, Exchange ${eodhdCompany.Exchange}`);

      if (!eodhdCompany.Code || !eodhdCompany.Name || !eodhdCompany.Exchange) {
        console.error('[updateCompanyData] EODHD search result missing critical information:', eodhdCompany);
        throw new Error(`EODHD search result for ${symbol} is incomplete.`);
      }

      console.log(`[updateCompanyData] Inserting new company ${eodhdCompany.Code} (${eodhdCompany.Name}) into DB...`);
      const { data: newCompany, error: insertError } = await supabase
        .from('companies')
        .insert({
          symbol: eodhdCompany.Code, // Use the symbol from EODHD search as it might be more canonical
          name: eodhdCompany.Name,
          exchange: eodhdCompany.Exchange, // This is the EODHD exchange code
          // Add any other default fields you want to initialize for a new company
        })
        .select('id, exchange, name, symbol')
        .single();

      if (insertError) {
        console.error(`[updateCompanyData] Error inserting new company ${eodhdCompany.Code}:`, insertError);
        throw new Error(`DB error inserting company ${eodhdCompany.Code}: ${insertError.message}`);
      }
      if (!newCompany) {
        console.error(`[updateCompanyData] Failed to insert new company ${eodhdCompany.Code}, insert call returned no data.`);
        throw new Error(`Failed to insert new company ${eodhdCompany.Code} and retrieve its record.`);
      }
      companyRecord = newCompany;
      console.log(`[updateCompanyData] New company ${companyRecord.symbol} inserted with ID ${companyRecord.id}, Exchange ${companyRecord.exchange}`);
    } catch (e: any) {
      console.error(`[updateCompanyData] Failed to fetch/insert new company ${symbol}:`, e);
      // Return a results object indicating failure for this symbol
      return { error: `Failed to initialize company ${symbol}: ${e.message}` };
    }
  }

  if (!companyRecord || !companyRecord.id || !companyRecord.exchange) {
    console.error(`[updateCompanyData] companyRecord is invalid after fetch/insert attempt for symbol ${symbol}:`, companyRecord);
    return { error: `Failed to obtain valid company record for ${symbol}.` };
  }

  interface ResultData {
    fundamentals?: string | { error: string };
    financials?: string | { error: string };
    peers?: string | { error: string };
    [key: string]: any;
  }
  
  // Initialize the results object with all required properties to fix TypeScript errors
  const results: ResultData = { 
    company_id: companyRecord.id, 
    symbol: companyRecord.symbol,
    fundamentals: 'pending',
    financials: 'pending',
    peers: 'pending'
  };
  // Use companyRecord.symbol for consistency, and companyRecord.exchange for the EODHD exchange code
  const fullSymbolForEODHD = `${companyRecord.symbol}.${companyRecord.exchange}`;
  console.log(`[updateCompanyData] Processing details for ${companyRecord.symbol} (ID: ${companyRecord.id}), EODHD symbol: ${fullSymbolForEODHD}`);
  
  // Update fundamentals
  if (type === 'all' || type === 'fundamentals') {
    console.log(`[updateCompanyData] Updating fundamentals for ${companyRecord.symbol}...`);
    try {
      const fundamentalsData = await fetchEODHDData(`/fundamentals/${fullSymbolForEODHD}`);
      // console.log(`[updateCompanyData] Fundamentals data for ${companyRecord.symbol}:`, fundamentalsData);
      
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          name: fundamentalsData.General?.Name || companyRecord.name, // Keep existing name if EODHD doesn't provide it here
          sector: fundamentalsData.General?.Sector || null,
          industry: fundamentalsData.General?.Industry || null,
          description: fundamentalsData.General?.Description || null,
          logo_url: fundamentalsData.General?.LogoURL || null,
          website: fundamentalsData.General?.WebURL || null,
          employee_count: fundamentalsData.General?.FullTimeEmployees || null,
          ceo: fundamentalsData.General?.Officers?.[0]?.Name || null, // EODHD has Officers as an array
          founded_year: fundamentalsData.General?.IPODate ? new Date(fundamentalsData.General.IPODate).getFullYear() : null,
          market_cap: fundamentalsData.Highlights?.MarketCapitalization || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyRecord.id);
      
      if (updateError) {
        console.error(`[updateCompanyData] Error updating fundamentals for ${companyRecord.symbol}:`, updateError);
        throw updateError;
      }
      
      results.fundamentals = 'updated';
      console.log(`[updateCompanyData] Fundamentals updated for ${companyRecord.symbol}.`);
    } catch (err: any) {
      console.error(`[updateCompanyData] Catch block error updating fundamentals for ${companyRecord.symbol}:`, err);
      results.fundamentals = { error: err.message };
    }
  }
  
  // Update financial metrics
  if (type === 'all' || type === 'financials') {
    console.log(`[updateCompanyData] Updating financials for ${companyRecord.symbol}...`);
    try {
      const annualFinancials = await fetchEODHDData(`/fundamentals/${fullSymbolForEODHD}?filter=Financials::Balance_Sheet::yearly,Financials::Income_Statement::yearly,Financials::Cash_Flow::yearly`);
      // console.log(`[updateCompanyData] Annual financials for ${companyRecord.symbol}:`, annualFinancials);
      
      if (annualFinancials.Financials) {
        if (annualFinancials.Financials.Income_Statement?.yearly) {
          const incomeData = annualFinancials.Financials.Income_Statement.yearly;
          const years = Object.keys(incomeData.totalRevenue || {});
          
          for (const year of years) {
            try {
              const metrics = {
                company_id: companyRecord.id,
                period: year,
                period_type: 'annual',
                revenue: incomeData.totalRevenue?.[year] || null,
                net_income: incomeData.netIncome?.[year] || null,
                eps: incomeData.earningsPerShareBasic?.[year] || incomeData.dilutedEps?.[year] || null, // Check for different EPS fields
                ebitda: incomeData.ebitda?.[year] || null,
                gross_margin: (incomeData.grossProfit?.[year] && incomeData.totalRevenue?.[year]) ? (incomeData.grossProfit[year] / incomeData.totalRevenue[year]) * 100 : null,
                operating_margin: (incomeData.operatingIncome?.[year] && incomeData.totalRevenue?.[year]) ? (incomeData.operatingIncome[year] / incomeData.totalRevenue[year]) * 100 : null,
                profit_margin: (incomeData.netIncome?.[year] && incomeData.totalRevenue?.[year]) ? (incomeData.netIncome[year] / incomeData.totalRevenue[year]) * 100 : null,
              };
              
              const { error: metricsError } = await supabase
                .from('financial_metrics')
                .upsert([metrics], { onConflict: 'company_id,period,period_type' });
              
              if (metricsError) {
                console.error(`[updateCompanyData] Error upserting metrics for ${companyRecord.symbol} (${year}):`, metricsError);
              }
              
              const incomeStatement = {};
              for (const key in incomeData) {
                if (incomeData[key]?.[year] !== undefined) {
                  incomeStatement[key] = incomeData[key][year];
                }
              }
              
              const { error: statementError } = await supabase
                .from('financial_statements')
                .upsert([{
                  company_id: companyRecord.id,
                  period: year,
                  period_type: 'annual',
                  statement_type: 'income',
                  data: incomeStatement
                }], { onConflict: 'company_id,period,period_type,statement_type' });
              
              if (statementError) {
                console.error(`[updateCompanyData] Error upserting income statement for ${companyRecord.symbol} (${year}):`, statementError);
              }
            } catch (err: any) {
              console.error(`[updateCompanyData] Error processing financial data for ${companyRecord.symbol} (${year}):`, err);
            }
          }
        }
        results.financials = 'updated';
        console.log(`[updateCompanyData] Financials updated for ${companyRecord.symbol}.`);
      } else {
        results.financials = 'no data available';
         console.log(`[updateCompanyData] No financial data available for ${companyRecord.symbol}.`);
      }
    } catch (err: any) {
      console.error(`[updateCompanyData] Catch block error updating financials for ${companyRecord.symbol}:`, err);
      results.financials = { error: err.message };
    }
  }
  
  // Update peer comparisons
  if (type === 'all' || type === 'peers') {
    console.log(`[updateCompanyData] Updating peers for ${companyRecord.symbol}...`);
    try {
      const { data: companyForPeers, error: sectorFetchError } = await supabase
        .from('companies')
        .select('sector')
        .eq('id', companyRecord.id)
        .single();

      if(sectorFetchError){
        console.error(`[updateCompanyData] Error fetching sector for ${companyRecord.symbol} for peer analysis:`, sectorFetchError);
        throw sectorFetchError;
      }
      
      if (companyForPeers?.sector) {
        const { data: peers, error: peersFetchError } = await supabase
          .from('companies')
          .select('id, symbol, name, market_cap')
          .eq('sector', companyForPeers.sector)
          .neq('symbol', companyRecord.symbol) // Use the consistent symbol from companyRecord
          .order('market_cap', { ascending: false })
          .limit(10);

        if(peersFetchError){
          console.error(`[updateCompanyData] Error fetching peer companies for ${companyRecord.symbol}:`, peersFetchError);
          throw peersFetchError;
        }
        
        if (peers && peers.length > 0) {
          const peerData = await Promise.all(
            peers.map(async (peer) => {
              try {
                const { data: metrics } = await supabase
                  .from('financial_metrics')
                  .select('revenue, net_income, pe_ratio, dividend_yield')
                  .eq('company_id', peer.id)
                  .eq('period_type', 'annual')
                  .order('period', { ascending: false })
                  .limit(1)
                  .maybeSingle(); // Use maybeSingle if metrics might not exist
                
                return {
                  symbol: peer.symbol,
                  name: peer.name,
                  market_cap: peer.market_cap,
                  pe_ratio: metrics?.pe_ratio || null,
                  revenue: metrics?.revenue || null,
                  net_income: metrics?.net_income || null,
                  dividend_yield: metrics?.dividend_yield || null
                };
              } catch (err: any) {
                 console.error(`[updateCompanyData] Error fetching metrics for peer ${peer.symbol} of ${companyRecord.symbol}:`, err);
                return {
                  symbol: peer.symbol,
                  name: peer.name,
                  market_cap: peer.market_cap
                };
              }
            })
          );
          
          const { error: peerError } = await supabase
            .from('peer_comparisons')
            .upsert([{
              company_id: companyRecord.id,
              peer_data: peerData,
              cached_at: new Date().toISOString()
            }], { onConflict: 'company_id' });
          
          if (peerError) {
            console.error(`[updateCompanyData] Error upserting peer comparisons for ${companyRecord.symbol}:`, peerError);
            throw peerError;
          }
          
          results.peers = 'updated';
          console.log(`[updateCompanyData] Peers updated for ${companyRecord.symbol}.`);
        } else {
          results.peers = 'no peers found';
          console.log(`[updateCompanyData] No peers found for ${companyRecord.symbol} in sector ${companyForPeers.sector}.`);
        }
      } else {
        results.peers = 'no sector information for peer analysis';
         console.log(`[updateCompanyData] No sector information for ${companyRecord.symbol} to conduct peer analysis.`);
      }
    } catch (err: any) {
      console.error(`[updateCompanyData] Catch block error updating peers for ${companyRecord.symbol}:`, err);
      results.peers = { error: err.message };
    }
  }
  
  console.log(`[updateCompanyData] Finished processing for ${companyRecord.symbol}. Results:`, results);
  return results;
}

async function fetchEODHDData(endpoint: string): Promise<any> {
  console.log(`[fetchEODHDData] Fetching from endpoint: ${endpoint}`);
  const url = `https://eodhistoricaldata.com/api${endpoint}${endpoint.includes('?') ? '&' : '?'}api_token=${EODHD_API_KEY}&fmt=json`;
  console.log(`Fetching EODHD data from: ${url}`);
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`EODHD API error: ${response.status} ${response.statusText}. URL: ${url}. Body: ${errorBody}`);
      throw new Error(`EODHD API error: ${response.status} ${response.statusText}. Details: ${errorBody}`);
    }
    
    const data = await response.json();
    // console.log(`Successfully fetched data from EODHD endpoint: ${endpoint}`, data);
    return data;
  } catch (error: any) {
    console.error(`Error fetching EODHD data from URL: ${url}. Error:`, error);
    throw new Error(`EODHD API request failed for ${url}: ${error.message}`);
  }
}
