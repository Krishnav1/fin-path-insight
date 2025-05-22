// Supabase Edge Function for Investment Report
// This function generates AI-powered investment reports using Google's Gemini API

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

// CORS headers for Supabase Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Cache for storing generated reports to avoid hitting rate limits
interface CachedReport {
  report: string;
  data: any;
  timestamp: number;
}

const reportCache: Record<string, CachedReport> = {};
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Function to parse ticker symbol
function parseTicker(rawTicker: string) {
  // Handle case where ticker might be provided without exchange
  const parts = rawTicker.split('.');
  const symbol = parts[0].toUpperCase();
  let exchange = parts.length > 1 ? parts[1].toUpperCase() : null;

  // Default to US market if no exchange specified
  if (!exchange) {
    exchange = 'US';
  }

  // Map to different formats
  let yfinanceTicker = symbol;
  if (exchange === 'NSE') {
    yfinanceTicker = `${symbol}.NS`;
  } else if (exchange === 'BSE') {
    yfinanceTicker = `${symbol}.BO`;
  }

  const eodhdTicker = `${symbol}.${exchange}`;

  return {
    original: rawTicker,
    symbol: symbol,
    exchange: exchange,
    yfinanceTicker: yfinanceTicker,
    eodhdTicker: eodhdTicker
  };
}

// Function to fetch stock data from Yahoo Finance API
async function fetchYahooFinanceData(ticker: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching Yahoo Finance data for ${ticker}:`, error);
    return null;
  }
}

// Function to fetch data from EODHD API
async function fetchEodhdData(eodhdTicker: string, endpointType: string, params: Record<string, any> = {}) {
  try {
    // Get API key from environment
    let API_KEY = Deno.env.get('EODHD_API_KEY');
    
    // Use fallback if not available
    if (!API_KEY) {
      console.warn('EODHD_API_KEY not found in environment, using fallback key');
      API_KEY = '682ab8a9176503.56947213'; // Default fallback
    }
    
    // Determine the endpoint based on the requested data type
    let endpoint = '';
    switch (endpointType) {
      case 'fundamentals':
        endpoint = `/fundamentals/${eodhdTicker}`;
        break;
      case 'eod':
        endpoint = `/eod/${eodhdTicker}`;
        break;
      case 'news':
        endpoint = `/news?s=${eodhdTicker}&limit=5`;
        break;
      case 'insider':
        endpoint = `/insider-transactions?code=${eodhdTicker}`;
        break;
      default:
        endpoint = `/fundamentals/${eodhdTicker}`;
    }
    
    // Create query parameters
    const queryParams = new URLSearchParams(params);
    queryParams.set('api_token', API_KEY);
    
    // Construct the target EODHD URL
    const targetUrl = `https://eodhd.com/api${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryParams.toString()}`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FinPathInsight/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`EODHD API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching EODHD data for ${eodhdTicker} (${endpointType}):`, error);
    return null;
  }
}

// Function to call Gemini API to generate the investment report
async function callGeminiForReport(aggregatedData: any, userQuery: string) {
  try {
    // Get API key from environment
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Prepare the prompt for Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const promptTemplate = `
You are FinGenie, a professional investment analyst at a top-tier financial firm. You're creating a comprehensive investment report for a retail investor who wants to learn about ${aggregatedData.ticker.symbol}.

User Query: "${userQuery}"

DATA AVAILABLE:
${JSON.stringify(aggregatedData, null, 2)}

REPORT GUIDELINES:
1. Create a professional, well-structured investment report in Markdown format
2. Include these sections:
   - Executive Summary (brief overview of the company and key metrics)
   - Business Overview (what the company does, industry position)
   - Financial Analysis (key metrics, trends, strengths/weaknesses)
   - Valuation Assessment (is it undervalued, overvalued, or fairly valued?)
   - Risk Factors (what could go wrong)
   - Investment Thesis (bullish or bearish case)
   - Conclusion with a clear opinion (but not a specific recommendation)

3. Format requirements:
   - Use clear headings (## for main sections, ### for subsections)
   - Include a few bullet points for easy scanning
   - Bold key metrics and important points
   - Use tables where appropriate for financial data

4. Important considerations:
   - Be balanced and objective
   - Acknowledge both positives and negatives
   - Provide context for metrics (e.g., compared to industry averages)
   - Write in a professional but accessible tone
   - Include a standard disclaimer at the end

DISCLAIMER TO INCLUDE:
"This report is for informational purposes only and does not constitute investment advice. The analysis is based on historical data and publicly available information, which may not be accurate or complete. Investing involves risk, and past performance is not indicative of future results. Always conduct your own research and consult with a qualified financial advisor before making investment decisions."
`;

    // Send the prompt to Gemini
    const result = await model.generateContent(promptTemplate);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini for report:", error);
    throw error;
  }
}

// Format currency values for display
function formatCurrency(value: number, currency = 'USD'): string {
  if (isNaN(value)) return 'N/A';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  // Format large numbers with K, M, B suffixes
  if (Math.abs(value) >= 1e9) {
    return formatter.format(value / 1e9).replace(/\.00$/, '') + 'B';
  } else if (Math.abs(value) >= 1e6) {
    return formatter.format(value / 1e6).replace(/\.00$/, '') + 'M';
  } else if (Math.abs(value) >= 1e3) {
    return formatter.format(value / 1e3).replace(/\.00$/, '') + 'K';
  }
  
  return formatter.format(value);
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Parse request body
    const body = await req.json();
    
    // Extract ticker and query from request
    const { ticker, query = "Provide a comprehensive investment report" } = body;

    if (!ticker) {
      return new Response(
        JSON.stringify({ error: "Missing ticker in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse ticker to get different formats
    const parsedTicker = parseTicker(ticker);
    
    // Check cache first
    const cacheKey = `${parsedTicker.original}:${query}`;
    const cachedData = reportCache[cacheKey];
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      console.log(`Using cached report for ${parsedTicker.original}`);
      return new Response(
        JSON.stringify({
          report: cachedData.report,
          data: cachedData.data,
          ticker: parsedTicker,
          cached: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Generating new report for ${parsedTicker.original}`);
    
    // Fetch data from various sources
    const [yahooData, fundamentalsData, eodData, newsData, insiderData] = await Promise.all([
      fetchYahooFinanceData(parsedTicker.yfinanceTicker),
      fetchEodhdData(parsedTicker.eodhdTicker, 'fundamentals'),
      fetchEodhdData(parsedTicker.eodhdTicker, 'eod', { limit: 252 }), // ~1 year of trading days
      fetchEodhdData(parsedTicker.eodhdTicker, 'news'),
      fetchEodhdData(parsedTicker.eodhdTicker, 'insider')
    ]);
    
    // Aggregate the data
    const aggregatedData = {
      ticker: parsedTicker,
      yahoo: yahooData,
      fundamentals: fundamentalsData,
      eod: eodData,
      news: newsData,
      insider: insiderData,
      timestamp: new Date().toISOString()
    };
    
    // Generate report using Gemini
    const report = await callGeminiForReport(aggregatedData, query);
    
    // Store in cache
    reportCache[cacheKey] = {
      report,
      data: aggregatedData,
      timestamp: Date.now()
    };
    
    return new Response(
      JSON.stringify({
        report,
        data: aggregatedData,
        ticker: parsedTicker
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating investment report:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return new Response(
      JSON.stringify({
        error: `Failed to generate investment report: ${errorMessage}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
})
