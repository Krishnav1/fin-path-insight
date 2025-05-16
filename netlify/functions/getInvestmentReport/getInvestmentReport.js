const { spawn } = require('child_process');
const path = require('path');
const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Environment variables
const EODHD_API_KEY = process.env.EODHD_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Parse ticker symbol and map to appropriate formats for different data sources
 * @param {string} rawTicker - The ticker symbol provided by the user (e.g., "NVDA.US", "RELIANCE.NSE")
 * @returns {Object} Ticker information with mappings for different data sources
 */
function parseTicker(rawTicker) {
  // Handle case where ticker might be provided without exchange
  const parts = rawTicker.split('.');
  const symbol = parts[0].toUpperCase();
  let exchange = parts.length > 1 ? parts[1].toUpperCase() : null;

  // Default to US market if no exchange specified
  if (!exchange) {
    exchange = 'US';
  }

  // Map to yfinance format
  let yfinanceTicker = symbol;
  if (exchange === 'NSE') {
    yfinanceTicker = `${symbol}.NS`;
  } else if (exchange === 'BSE') {
    yfinanceTicker = `${symbol}.BO`;
  }

  // Map to EODHD format
  const eodhdTicker = `${symbol}.${exchange}`;

  return {
    original: rawTicker,
    symbol: symbol,
    exchange: exchange,
    yfinanceTicker: yfinanceTicker,
    eodhdTicker: eodhdTicker
  };
}

/**
 * Invoke the Python script to fetch data from yfinance
 * @param {string} yfinanceTicker - Ticker symbol in yfinance format
 * @returns {Promise<Object>} The data fetched from yfinance
 */
async function invokeYfinanceScript(yfinanceTicker) {
  return new Promise((resolve, reject) => {
    const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = path.join(__dirname, 'get_yfinance_data.py');
    
    console.log(`Executing: ${pythonExecutable} ${scriptPath} ${yfinanceTicker}`);
    
    const pythonProcess = spawn(pythonExecutable, [scriptPath, yfinanceTicker]);
    
    let scriptOutput = '';
    let scriptError = '';
    
    pythonProcess.stdout.on('data', (data) => {
      scriptOutput += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      scriptError += data.toString();
      console.error(`Python stderr: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}. Error: ${scriptError}`);
        resolve({ success: false, error: scriptError || 'Unknown error', data: null });
        return;
      }
      
      try {
        const jsonData = JSON.parse(scriptOutput);
        if (jsonData.error) {
          console.warn(`yfinance script returned an error: ${jsonData.error}`);
          resolve({ success: false, error: jsonData.error, data: null });
        } else {
          resolve({ success: true, data: jsonData });
        }
      } catch (e) {
        console.error(`Failed to parse yfinance JSON output: ${e}. Output: ${scriptOutput}`);
        resolve({ success: false, error: 'Failed to parse yfinance JSON output', data: null });
      }
    });
    
    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python subprocess.', err);
      resolve({ success: false, error: 'Failed to start Python subprocess', data: null });
    });
  });
}

/**
 * Fetch data from EODHD API
 * @param {string} eodhdTicker - Ticker symbol in EODHD format
 * @param {string} endpointType - Type of endpoint to fetch from (e.g., 'fundamentals', 'real-time')
 * @param {Object} params - Additional parameters for the API call
 * @returns {Promise<Object>} The data fetched from EODHD
 */
async function fetchEodhdData(eodhdTicker, endpointType, params = {}) {
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
    case 'history':
      const histPeriod = params.period || 'd';
      url = `${BASE_URL}/eod/${eodhdTicker}?api_token=${EODHD_API_KEY}&fmt=json&period=${histPeriod}`;
      if (params.from) url += `&from=${params.from}`;
      if (params.to) url += `&to=${params.to}`;
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
    console.error(`Error fetching from EODHD: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate technical indicators from historical price data
 * @param {Object} historicalPrices - Historical price data
 * @returns {Object} Calculated technical indicators
 */
function calculateTechnicalIndicators(historicalPrices) {
  // This is a simplified implementation
  // For production, consider using a more robust technical analysis library
  
  if (!historicalPrices || !historicalPrices.close || historicalPrices.close.length < 30) {
    return {
      rsi: null,
      macd: null,
      macdSignal: null,
      macdHistogram: null
    };
  }
  
  const prices = historicalPrices.close;
  
  // Simple RSI calculation (14-period)
  const rsiPeriod = 14;
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate average gain and loss
  const avgGain = gains.slice(-rsiPeriod).reduce((sum, val) => sum + val, 0) / rsiPeriod;
  const avgLoss = losses.slice(-rsiPeriod).reduce((sum, val) => sum + val, 0) / rsiPeriod;
  
  // Calculate RSI
  const rs = avgGain / (avgLoss === 0 ? 0.001 : avgLoss); // Avoid division by zero
  const rsi = 100 - (100 / (1 + rs));
  
  // Simple MACD calculation
  const ema12Period = 12;
  const ema26Period = 26;
  const signalPeriod = 9;
  
  // Simple EMA calculation
  const calculateEMA = (data, period) => {
    const k = 2 / (period + 1);
    let ema = data[0];
    const emaValues = [ema];
    
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
      emaValues.push(ema);
    }
    
    return emaValues;
  };
  
  const ema12 = calculateEMA(prices, ema12Period);
  const ema26 = calculateEMA(prices, ema26Period);
  
  // Calculate MACD line
  const macdLine = [];
  for (let i = 0; i < prices.length; i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }
  
  // Calculate signal line (9-day EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod);
  
  // Calculate histogram
  const histogram = macdLine.map((val, i) => val - signalLine[i]);
  
  return {
    rsi: rsi.toFixed(2),
    macd: macdLine[macdLine.length - 1].toFixed(2),
    macdSignal: signalLine[signalLine.length - 1].toFixed(2),
    macdHistogram: histogram[histogram.length - 1].toFixed(2)
  };
}

/**
 * Call Gemini API to generate the investment report
 * @param {Object} aggregatedData - Aggregated data from all sources
 * @param {string} userQuery - The original user query
 * @returns {Promise<string>} The generated report
 */
async function callGeminiForReport(aggregatedData, userQuery) {
  try {
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
    *   News: ${aggregatedData.news && aggregatedData.news.length > 0 ? aggregatedData.news.map(n => `Title: ${n.title} (Source: ${n.publisher || 'N/A'})`).join('; ') : 'No recent news available through current sources.'}

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
    throw new Error(`Failed to generate report from Gemini API: ${error.message}`);
  }
}

/**
 * Format currency values for display
 * @param {number} value - The value to format
 * @param {string} currency - The currency code
 * @returns {string} Formatted currency string
 */
function formatCurrency(value, currency = 'USD') {
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

/**
 * Main handler for the Netlify Function
 */
exports.handler = async (event, context) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }
  
  // Parse request body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON payload' })
    };
  }
  
  // Extract ticker and query from request
  const { ticker: rawTicker, query: userQuery } = body;
  
  if (!rawTicker || !userQuery) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing ticker or query in request body' })
    };
  }
  
  // Parse ticker into different formats
  const tickerInfo = parseTicker(rawTicker);
  
  // Initialize aggregated data structure
  let aggregatedData = {
    tickerInfo: tickerInfo,
    realTimePrice: {},
    fundamentals: {},
    technicals: {},
    news: [],
    analystRatings: {}
  };
  
  let yfinanceSuccessful = false;
  
  try {
    // Step 1: Attempt to fetch data from yfinance
    console.log(`Fetching data from yfinance for ${tickerInfo.yfinanceTicker}`);
    const yfResult = await invokeYfinanceScript(tickerInfo.yfinanceTicker);
    
    if (yfResult.success && yfResult.data) {
      yfinanceSuccessful = true;
      console.log("Successfully fetched data from yfinance");
      
      // Extract real-time price data
      aggregatedData.realTimePrice = {
        currentPrice: yfResult.data.currentPrice,
        dayChange: yfResult.data.dayChange,
        dayChangePercent: yfResult.data.dayChangePercent,
        preMarketPrice: yfResult.data.preMarketPrice,
        postMarketPrice: yfResult.data.postMarketPrice,
        previousClose: yfResult.data.previousClose,
        dayOpen: yfResult.data.dayOpen,
        dayHigh: yfResult.data.dayHigh,
        dayLow: yfResult.data.dayLow,
        currency: yfResult.data.currency || 'USD'
      };
      
      // Extract fundamental data
      aggregatedData.fundamentals = {
        marketCap: yfResult.data.marketCap,
        beta: yfResult.data.beta,
        trailingPE: yfResult.data.trailingPE,
        forwardPE: yfResult.data.forwardPE,
        priceToSalesTrailing12Months: yfResult.data.priceToSalesTrailing12Months,
        priceToBook: yfResult.data.priceToBook,
        enterpriseToEbitda: yfResult.data.enterpriseToEbitda,
        earningsDate: yfResult.data.earningsDate,
        fiftyTwoWeekHigh: yfResult.data.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: yfResult.data.fiftyTwoWeekLow,
        averageVolume: yfResult.data.averageVolume,
        dividendYield: yfResult.data.dividendYield,
        payoutRatio: yfResult.data.payoutRatio
      };
      
      // Extract news
      aggregatedData.news = yfResult.data.news || [];
      
      // Extract analyst ratings
      aggregatedData.analystRatings = {
        targetMeanPrice: yfResult.data.analystRatings?.targetMeanPrice,
        recommendationKey: yfResult.data.analystRatings?.recommendationKey,
        recommendationMean: yfResult.data.analystRatings?.recommendationMean,
        numberOfAnalystOpinions: yfResult.data.analystRatings?.numberOfAnalystOpinions,
        analystRecommendations: yfResult.data.analystRatings?.summary
      };
      
      // Calculate technical indicators from historical data
      if (yfResult.data.historicalPrices) {
        const technicalIndicators = calculateTechnicalIndicators(yfResult.data.historicalPrices);
        aggregatedData.technicals = technicalIndicators;
      }
    } else {
      console.warn("yfinance data fetch failed:", yfResult.error);
    }
    
    // Step 2: Fetch data from EODHD if yfinance failed or for specific data points
    if (!yfinanceSuccessful || !aggregatedData.realTimePrice.currentPrice) {
      console.log(`Fetching real-time data from EODHD for ${tickerInfo.eodhdTicker}`);
      const rtResult = await fetchEodhdData(tickerInfo.eodhdTicker, 'real-time');
      
      if (rtResult.success && rtResult.data) {
        aggregatedData.realTimePrice = {
          currentPrice: rtResult.data.close || rtResult.data.previousClose,
          dayChange: rtResult.data.change,
          dayChangePercent: rtResult.data.change_p,
          previousClose: rtResult.data.previousClose,
          dayOpen: rtResult.data.open,
          dayHigh: rtResult.data.high,
          dayLow: rtResult.data.low,
          currency: rtResult.data.currency || 'USD'
        };
      }
    }
    
    if (!yfinanceSuccessful || !aggregatedData.fundamentals.marketCap) {
      console.log(`Fetching fundamentals from EODHD for ${tickerInfo.eodhdTicker}`);
      const fundResult = await fetchEodhdData(tickerInfo.eodhdTicker, 'fundamentals');
      
      if (fundResult.success && fundResult.data) {
        const fundData = fundResult.data;
        
        aggregatedData.fundamentals = {
          ...aggregatedData.fundamentals,
          marketCap: fundData.General?.MarketCapitalization || aggregatedData.fundamentals.marketCap,
          beta: fundData.Technicals?.Beta || aggregatedData.fundamentals.beta,
          trailingPE: fundData.Valuation?.TrailingPE || aggregatedData.fundamentals.trailingPE,
          forwardPE: fundData.Valuation?.ForwardPE || aggregatedData.fundamentals.forwardPE,
          priceToSalesTrailing12Months: fundData.Valuation?.PriceToSales || aggregatedData.fundamentals.priceToSalesTrailing12Months,
          priceToBook: fundData.Valuation?.PriceToBook || aggregatedData.fundamentals.priceToBook,
          enterpriseToEbitda: fundData.Valuation?.EnterpriseValueToEBITDA || aggregatedData.fundamentals.enterpriseToEbitda,
          fiftyTwoWeekHigh: fundData.Technicals?.['52WeekHigh'] || aggregatedData.fundamentals.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: fundData.Technicals?.['52WeekLow'] || aggregatedData.fundamentals.fiftyTwoWeekLow,
          averageVolume: fundData.Technicals?.AverageVolume || aggregatedData.fundamentals.averageVolume,
          dividendYield: fundData.Highlights?.DividendYield || aggregatedData.fundamentals.dividendYield
        };
      }
    }
    
    // Fetch technical indicators from EODHD
    if (!aggregatedData.technicals?.rsi) {
      console.log(`Fetching technical indicators from EODHD for ${tickerInfo.eodhdTicker}`);
      
      // Get date range for last 3 months
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      const formatDate = (date) => {
        return date.toISOString().split('T')[0];
      };
      
      // Fetch RSI
      const rsiResult = await fetchEodhdData(tickerInfo.eodhdTicker, 'technicals', {
        indicator: 'rsi',
        period: 14,
        from: formatDate(threeMonthsAgo),
        to: formatDate(today)
      });
      
      if (rsiResult.success && rsiResult.data && rsiResult.data.length > 0) {
        const latestRsi = rsiResult.data[rsiResult.data.length - 1];
        aggregatedData.technicals.rsi = latestRsi.rsi?.toFixed(2);
      }
      
      // Fetch MACD
      const macdResult = await fetchEodhdData(tickerInfo.eodhdTicker, 'technicals', {
        indicator: 'macd',
        period: '12,26,9',
        from: formatDate(threeMonthsAgo),
        to: formatDate(today)
      });
      
      if (macdResult.success && macdResult.data && macdResult.data.length > 0) {
        const latestMacd = macdResult.data[macdResult.data.length - 1];
        aggregatedData.technicals.macd = latestMacd.macd?.toFixed(2);
        aggregatedData.technicals.macdSignal = latestMacd.signal?.toFixed(2);
        aggregatedData.technicals.macdHistogram = latestMacd.histogram?.toFixed(2);
      }
    }
    
    // Fetch news from EODHD if needed
    if (!aggregatedData.news || aggregatedData.news.length < 3) {
      console.log(`Fetching news from EODHD for ${tickerInfo.eodhdTicker}`);
      const newsResult = await fetchEodhdData(tickerInfo.eodhdTicker, 'news', { limit: 5 });
      
      if (newsResult.success && newsResult.data && newsResult.data.length > 0) {
        const eodhdNews = newsResult.data.map(item => ({
          title: item.title,
          link: item.link,
          publisher: item.source,
          publishedAt: item.date
        }));
        
        // Merge news from both sources
        aggregatedData.news = [...aggregatedData.news, ...eodhdNews].slice(0, 5);
      }
    }
    
    // Format currency values for better readability
    if (aggregatedData.fundamentals.marketCap) {
      aggregatedData.fundamentals.marketCapFormatted = formatCurrency(
        aggregatedData.fundamentals.marketCap,
        aggregatedData.realTimePrice.currency
      );
    }
    
    // Step 3: Call Gemini to generate the report
    console.log("Calling Gemini to generate investment report...");
    const report = await callGeminiForReport(aggregatedData, userQuery);
    
    // Return the generated report
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // For CORS
      },
      body: JSON.stringify({
        report,
        data: aggregatedData, // Include the data for frontend visualization if needed
        ticker: tickerInfo.original,
        query: userQuery
      })
    };
    
  } catch (error) {
    console.error("Error in getInvestmentReport function:", error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Failed to generate investment report: ${error.message}`,
        ticker: tickerInfo?.original,
        query: userQuery
      })
    };
  }
};
