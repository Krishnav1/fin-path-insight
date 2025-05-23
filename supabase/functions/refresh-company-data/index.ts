// Supabase Edge Function for refreshing company data
// This function checks if company data is stale and triggers a refresh if needed

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ADMIN_API_KEY = Deno.env.get('ADMIN_API_KEY');

if (!supabaseUrl || !supabaseKey || !ADMIN_API_KEY) {
  throw new Error('One or more required environment variables are missing: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_API_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Define the maximum age of data before it's considered stale (in hours)
const DATA_FRESHNESS_THRESHOLD_HOURS = 24;

serve(async (req) => {
  console.log(`Request received: ${req.url}`);
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || req.headers.get('apikey');

    // Skip auth check for scheduled invocations (which will have a special header)
    const isScheduled = req.headers.get('x-scheduled-function') === 'true';

    // Check for valid authentication
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

    // Parse request
    const url = new URL(req.url);
    let symbol = url.searchParams.get('symbol');
    let forceRefresh = url.searchParams.get('force') === 'true';
    
    // If symbol not found in query, check JSON body
    if (!symbol) {
      try {
        const body = await req.json();
        symbol = body.symbol;
        if (body.force) forceRefresh = body.force === true;
        console.log(`Parsed from JSON body: symbol=${symbol}, forceRefresh=${forceRefresh}`);
      } catch (e) {
        console.log('No valid JSON body or no symbol in body.');
      }
    }
    
    // If no symbol provided, return error
    if (!symbol || symbol.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Symbol parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if data is stale and needs refresh
    const result = await checkAndRefreshCompanyData(symbol, forceRefresh);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Error in refresh-company-data function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkAndRefreshCompanyData(symbol: string, forceRefresh: boolean = false): Promise<any> {
  console.log(`[checkAndRefreshCompanyData] Checking data freshness for symbol: ${symbol}, forceRefresh: ${forceRefresh}`);
  
  try {
    // Get company from database
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, updated_at')
      .eq('symbol', symbol)
      .maybeSingle();
    
    if (error) {
      console.error(`[checkAndRefreshCompanyData] Error fetching company ${symbol}:`, error);
      throw new Error(`Error fetching company ${symbol}: ${error.message}`);
    }
    
    if (!company) {
      console.log(`[checkAndRefreshCompanyData] Company ${symbol} not found in database`);
      return { 
        refreshed: false, 
        message: `Company ${symbol} not found in database. Please track this company first.`,
        needsRefresh: true
      };
    }
    
    // Check if data is stale
    const lastUpdated = new Date(company.updated_at);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    const isStale = hoursSinceUpdate > DATA_FRESHNESS_THRESHOLD_HOURS;
    console.log(`[checkAndRefreshCompanyData] Company ${symbol} last updated ${hoursSinceUpdate.toFixed(2)} hours ago. Stale: ${isStale}`);
    
    // If data is fresh and not forcing refresh, return without refreshing
    if (!isStale && !forceRefresh) {
      return { 
        refreshed: false, 
        message: `Company data for ${symbol} is still fresh (updated ${hoursSinceUpdate.toFixed(2)} hours ago)`,
        needsRefresh: false,
        lastUpdated: company.updated_at
      };
    }
    
    // If data is stale or forcing refresh, trigger company-data-ingest function
    console.log(`[checkAndRefreshCompanyData] Refreshing data for ${symbol}...`);
    
    // Call the company-data-ingest function
    const ingestUrl = `${supabaseUrl}/functions/v1/company-data-ingest?symbol=${symbol}`;
    const response = await fetch(ingestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_API_KEY}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[checkAndRefreshCompanyData] Error calling company-data-ingest for ${symbol}: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Error refreshing company data for ${symbol}: ${response.statusText}`);
    }
    
    const refreshResult = await response.json();
    console.log(`[checkAndRefreshCompanyData] Successfully refreshed data for ${symbol}`);
    
    return { 
      refreshed: true, 
      message: `Company data for ${symbol} has been refreshed`,
      details: refreshResult,
      lastUpdated: new Date().toISOString()
    };
  } catch (err: any) {
    console.error(`[checkAndRefreshCompanyData] Error:`, err);
    throw new Error(`Failed to check/refresh company data for ${symbol}: ${err.message}`);
  }
}
