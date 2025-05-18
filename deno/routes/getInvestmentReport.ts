// Investment Report API for Deno Deploy
import { GoogleGenerativeAI } from "@google/generative-ai";

// Reference to the types.d.ts file for type declarations
/// <reference path="../types.d.ts" />
/// <reference lib="deno.ns" />
/// <reference path="../deno.d.ts" />

// Declare Deno namespace for TypeScript compiler
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
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
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching from Yahoo Finance: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

// Function to fetch data from EODHD API
async function fetchEodhdData(eodhdTicker: string, endpointType: string, params: Record<string, any> = {}) {
  const EODHD_API_KEY = Deno.env.get("EODHD_API_KEY");
  if (!EODHD_API_KEY) {
    return { success: false, error: "EODHD_API_KEY environment variable is not set" };
  }

  const BASE_URL = 'https://eodhistoricaldata.com/api';
  let url;
  
  switch (endpointType) {
    case 'fundamentals':
      url = `${BASE_URL}/fundamentals/${eodhdTicker}?api_token=${EODHD_API_KEY}`;
      break;
    case 'real-time':
      url = `${BASE_URL}/real-time/${eodhdTicker}?api_token=${EODHD_API_KEY}&fmt=json`;
      break;
    case 'technicals':
      const func = params.indicator || 'rsi';
      const period = params.period || 14;
      url = `${BASE_URL}/technical/${eodhdTicker}?api_token=${EODHD_API_KEY}&fmt=json&function=${func}&period=${period}`;
      if (params.from) url += `&from=${params.from}`;
      if (params.to) url += `&to=${params.to}`;
      break;
    case 'news':
      const limit = params.limit || 5;
      url = `${BASE_URL}/news?api_token=${EODHD_API_KEY}&s=${eodhdTicker}&limit=${limit}&fmt=json`;
      break;
    default:
      throw new Error(`Unknown EODHD endpoint type: ${endpointType}`);
  }
  
  try {
    console.log(`Fetching EODHD ${endpointType} for ${eodhdTicker}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`EODHD API error (${response.status}): ${errorText}`);
      return { success: false, error: `EODHD API error (${response.status}): ${errorText}` };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error fetching from EODHD: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

// Function to call Gemini API to generate the investment report
async function callGeminiForReport(aggregatedData: any, userQuery: string) {
  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const promptTemplate = `
You are Fin Genie, a Senior Equity Analyst AI.
Your task is to generate a comprehensive investment report for the stock: ${aggregatedData.tickerInfo.original}.
The user's original query was: "${userQuery}"

Use the following data to structure your analysis. If some data points are N/A or missing, acknowledge it and proceed. Do NOT invent data.

**Aggregated Stock Data:**
\`\`\`json
${JSON.stringify(aggregatedData, null, 2)}
\`\`\`

**Report Structure:**

1.  **${aggregatedData.tickerInfo.symbol} Stock Price Forecast and Market Analysis**
    *   Brief overview based on user query and available data.

2.  **Technical Analysis**
    *   Current Price: ${aggregatedData.realTimePrice?.currentPrice || 'N/A'} (Day's Change: ${aggregatedData.realTimePrice?.dayChange?.toFixed(2) || 'N/A'}, % Change: ${aggregatedData.realTimePrice?.dayChangePercent?.toFixed(2) || 'N/A'}%)
    *   Key levels: 52-Week High (${aggregatedData.fundamentals?.fiftyTwoWeekHigh || 'N/A'}), 52-Week Low (${aggregatedData.fundamentals?.fiftyTwoWeekLow || 'N/A'})
    *   Volume: Average Volume (${aggregatedData.fundamentals?.averageVolume || 'N/A'})
    *   RSI (${aggregatedData.technicals?.rsi_period || '14-day'}): ${aggregatedData.technicals?.rsi || 'N/A'}. Implications (e.g., overbought if >70, oversold if <30, neutral otherwise).
    *   MACD: Value (${aggregatedData.technicals?.macd || 'N/A'}), Signal (${aggregatedData.technicals?.macdSignal || 'N/A'}), Histogram (${aggregatedData.technicals?.macdHistogram || 'N/A'}). Implications (e.g., bullish/bearish crossover).
    *   Volatility (Beta): ${aggregatedData.fundamentals?.beta || 'N/A'}

3.  **Fundamental Analysis**
    *   Market Cap: ${aggregatedData.fundamentals?.marketCap || 'N/A'}
    *   P/E Ratio (Trailing): ${aggregatedData.fundamentals?.trailingPE || 'N/A'}
    *   P/E Ratio (Forward): ${aggregatedData.fundamentals?.forwardPE || 'N/A'}
    *   EV/EBITDA: ${aggregatedData.fundamentals?.enterpriseToEbitda || 'N/A'}
    *   Price/Sales (P/S): ${aggregatedData.fundamentals?.priceToSalesTrailing12Months || 'N/A'}
    *   Price/Book (P/B): ${aggregatedData.fundamentals?.priceToBook || 'N/A'}
    *   Next Earnings Date: ${aggregatedData.fundamentals?.earningsDate || 'N/A'}

4.  **Recent News and Events**
    *   Summarize up to 3-4 key news items if available. Focus on their potential impact.
    *   News: ${aggregatedData.news && aggregatedData.news.length > 0 ? aggregatedData.news.map((n: any) => `Title: ${n.title} (Source: ${n.publisher || 'N/A'})`).join('; ') : 'No recent news available through current sources.'}

5.  **Analyst Sentiment Overview**
    *   Target Price (Mean): ${aggregatedData.analystRatings?.targetMeanPrice || 'N/A'}
    *   Overall Rating: ${aggregatedData.analystRatings?.recommendationKey || 'N/A'} (based on ${aggregatedData.analystRatings?.recommendationMean || 'N/A'})
    *   Number of Analysts: ${aggregatedData.analystRatings?.numberOfAnalystOpinions || 'N/A'}

6.  **Conclusion**
    *   Provide a balanced outlook.
    *   Mention key catalysts or risk factors based on the analysis.
    *   **STRICTLY DO NOT PROVIDE DIRECT INVESTMENT ADVICE (e.g., "You should buy/sell this stock").** Focus on summarizing the analysis.

7.  **Disclaimer**
    *   "This report is for informational purposes only and does not constitute investment advice. All financial decisions should be made with the consultation of a qualified financial advisor."

Generate the report in well-formatted Markdown.
    `;
    
    console.log("Sending prompt to Gemini...");
    const result = await model.generateContent(promptTemplate);
    const response = result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate report from Gemini API: ${errorMessage}`);
  }
}

// Format currency values for display
function formatCurrency(value: number, currency = 'USD'): string {
  if (value === null || value === undefined) return 'N/A';
  
  // Format large numbers with appropriate suffixes
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T ${currency}`;
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B ${currency}`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M ${currency}`;
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K ${currency}`;
  }
  
  return `${value.toFixed(2)} ${currency}`;
}

// Main handler for the investment report API
export async function getInvestmentReport(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
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
  
  // Define body variable outside try block so it's accessible in catch
  let requestBody: { ticker?: string; query?: string } = {};
  
  try {
    // Parse request body
    const body = await req.json();
    
    // Store in outer variable for access in catch block
    requestBody = body;
    
    // Extract ticker and query from request
    const { ticker: rawTicker, query: userQuery } = body;
    
    if (!rawTicker || !userQuery) {
      return new Response(
        JSON.stringify({ error: "Missing ticker or query in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Check cache first
    const cacheKey = `${rawTicker}:${userQuery}`;
    const cachedData = reportCache[cacheKey];
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      console.log(`Using cached report for ${rawTicker}`);
      return new Response(
        JSON.stringify({
          report: cachedData.report,
          data: cachedData.data,
          ticker: rawTicker,
          query: userQuery,
          cached: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Parse ticker into different formats
    const tickerInfo = parseTicker(rawTicker);
    
    // Define interfaces for type safety
    interface RealTimePrice {
      currentPrice?: number;
      currentPriceFormatted?: string;
      dayChange?: number;
      dayChangePercent?: number;
      previousClose?: number;
      dayOpen?: number;
      dayHigh?: number;
      dayLow?: number;
      currency?: string;
    }
    
    interface Fundamentals {
      marketCap?: number;
      marketCapFormatted?: string;
      beta?: number;
      trailingPE?: number;
      forwardPE?: number;
      priceToSalesTrailing12Months?: number;
      priceToBook?: number;
      enterpriseToEbitda?: number;
      fiftyTwoWeekHigh?: number;
      fiftyTwoWeekHighFormatted?: string;
      fiftyTwoWeekLow?: number;
      fiftyTwoWeekLowFormatted?: string;
      averageVolume?: number;
      dividendYield?: number;
    }
    
    // Initialize aggregated data structure with proper types
    let aggregatedData = {
      tickerInfo: tickerInfo,
      realTimePrice: {} as RealTimePrice,
      fundamentals: {} as Fundamentals,
      technicals: {},
      news: [],
      analystRatings: {}
    };
    
    // Step 1: Fetch data from Yahoo Finance
    console.log(`Fetching data from Yahoo Finance for ${tickerInfo.yfinanceTicker}`);
    const yfResult = await fetchYahooFinanceData(tickerInfo.yfinanceTicker);
    
    if (yfResult.success && yfResult.data) {
      console.log("Successfully fetched data from Yahoo Finance");
      
      const quoteData = yfResult.data.chart.result[0].meta;
      const priceData = yfResult.data.chart.result[0].indicators.quote[0];
      
      // Extract real-time price data
      aggregatedData.realTimePrice = {
        currentPrice: quoteData.regularMarketPrice,
        dayChange: quoteData.regularMarketPrice - quoteData.previousClose,
        dayChangePercent: ((quoteData.regularMarketPrice - quoteData.previousClose) / quoteData.previousClose) * 100,
        previousClose: quoteData.previousClose,
        dayOpen: quoteData.regularMarketOpen,
        dayHigh: quoteData.regularMarketDayHigh,
        dayLow: quoteData.regularMarketDayLow,
        currency: quoteData.currency || 'USD'
      };
    }
    
    // Step 2: Fetch data from EODHD
    console.log(`Fetching fundamentals from EODHD for ${tickerInfo.eodhdTicker}`);
    const fundResult = await fetchEodhdData(tickerInfo.eodhdTicker, 'fundamentals');
    
    if (fundResult.success && fundResult.data) {
      const fundData = fundResult.data;
      
      aggregatedData.fundamentals = {
        marketCap: fundData.General?.MarketCapitalization,
        beta: fundData.Technicals?.Beta,
        trailingPE: fundData.Valuation?.TrailingPE,
        forwardPE: fundData.Valuation?.ForwardPE,
        priceToSalesTrailing12Months: fundData.Valuation?.PriceToSales,
        priceToBook: fundData.Valuation?.PriceToBook,
        enterpriseToEbitda: fundData.Valuation?.EnterpriseValueToEBITDA,
        fiftyTwoWeekHigh: fundData.Technicals?.['52WeekHigh'],
        fiftyTwoWeekLow: fundData.Technicals?.['52WeekLow'],
        averageVolume: fundData.Technicals?.AverageVolume,
        dividendYield: fundData.Highlights?.DividendYield
      };
    }
    
    // Fetch news from EODHD
    console.log(`Fetching news from EODHD for ${tickerInfo.eodhdTicker}`);
    const newsResult = await fetchEodhdData(tickerInfo.eodhdTicker, 'news', { limit: 5 });
    
    if (newsResult.success && newsResult.data && newsResult.data.length > 0) {
      const eodhdNews = newsResult.data.map((item: any) => ({
        title: item.title,
        link: item.link,
        publisher: item.source,
        publishedAt: item.date
      }));
      
      aggregatedData.news = eodhdNews.slice(0, 5);
    }
    
    // Format currency values for better readability
    if (aggregatedData?.fundamentals?.marketCap) {
      aggregatedData.fundamentals.marketCapFormatted = formatCurrency(
        aggregatedData.fundamentals.marketCap,
        aggregatedData?.realTimePrice?.currency || 'USD'
      );
    }
    
    // Format current price with proper currency
    if (aggregatedData?.realTimePrice?.currentPrice) {
      aggregatedData.realTimePrice.currentPriceFormatted = formatCurrency(
        aggregatedData.realTimePrice.currentPrice,
        aggregatedData?.realTimePrice?.currency || 'USD'
      );
    }
    
    // Format 52-week high/low with proper currency
    if (aggregatedData?.fundamentals?.fiftyTwoWeekHigh) {
      aggregatedData.fundamentals.fiftyTwoWeekHighFormatted = formatCurrency(
        aggregatedData.fundamentals.fiftyTwoWeekHigh,
        aggregatedData?.realTimePrice?.currency || 'USD'
      );
    }
    
    if (aggregatedData?.fundamentals?.fiftyTwoWeekLow) {
      aggregatedData.fundamentals.fiftyTwoWeekLowFormatted = formatCurrency(
        aggregatedData.fundamentals.fiftyTwoWeekLow,
        aggregatedData?.realTimePrice?.currency || 'USD'
      );
    }
    
    try {
      // Step 3: Call Gemini to generate the report
      console.log("Calling Gemini to generate investment report...");
      const report = await callGeminiForReport(aggregatedData, userQuery);
      
      // Store in cache
      reportCache[cacheKey] = {
        report,
        data: aggregatedData,
        timestamp: Date.now()
      };
      
      // Return the generated report
      return new Response(
        JSON.stringify({
          report,
          data: aggregatedData,
          ticker: tickerInfo.original,
          query: userQuery
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      // If Gemini API fails, return a fallback report
      console.error("Error generating report with Gemini:", error);
      
      const fallbackReport = `# ${tickerInfo.symbol} Investment Report

## Current Market Data

- **Current Price**: ${aggregatedData?.realTimePrice?.currentPrice || 'N/A'} ${aggregatedData?.realTimePrice?.currency || 'USD'}
- **Day's Change**: ${aggregatedData?.realTimePrice && 'dayChange' in aggregatedData.realTimePrice ? (aggregatedData.realTimePrice.dayChange as number).toFixed(2) : 'N/A'} (${aggregatedData?.realTimePrice && 'dayChangePercent' in aggregatedData.realTimePrice ? (aggregatedData.realTimePrice.dayChangePercent as number).toFixed(2) : 'N/A'}%)
- **52-Week Range**: ${aggregatedData?.fundamentals?.fiftyTwoWeekLow || 'N/A'} - ${aggregatedData?.fundamentals?.fiftyTwoWeekHigh || 'N/A'}

## Fundamental Metrics

- **Market Cap**: ${aggregatedData?.fundamentals?.marketCapFormatted || 'N/A'}
- **P/E Ratio**: ${aggregatedData?.fundamentals && 'trailingPE' in aggregatedData.fundamentals ? (aggregatedData.fundamentals.trailingPE as number).toFixed(2) : 'N/A'}
- **Beta**: ${aggregatedData?.fundamentals && 'beta' in aggregatedData.fundamentals ? (aggregatedData.fundamentals.beta as number).toFixed(2) : 'N/A'}

## Recent News

${aggregatedData?.news && Array.isArray(aggregatedData.news) && aggregatedData.news.length > 0 
  ? aggregatedData.news.slice(0, 3).map((n: any) => `- **${n.title || 'Untitled'}** (Source: ${n.publisher || 'Unknown'})`).join('\n') 
  : '- No recent news available through current sources.'}

## Note

Our AI report generation service is currently experiencing high demand. This is a simplified report with the most recent data available. Please try again later for a more comprehensive analysis.

## Disclaimer

This report is for informational purposes only and does not constitute investment advice. All financial decisions should be made with the consultation of a qualified financial advisor.`;
      
      return new Response(
        JSON.stringify({
          report: fallbackReport,
          data: aggregatedData,
          ticker: tickerInfo.original,
          query: userQuery,
          fallback: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in getInvestmentReport function:", error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        error: `Failed to generate investment report: ${errorMessage}`,
        ticker: requestBody?.ticker,
        query: requestBody?.query
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
