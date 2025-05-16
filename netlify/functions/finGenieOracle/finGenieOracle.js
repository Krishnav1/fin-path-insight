const { GoogleGenerativeAI } = require("@google/generative-ai");
const { spawn } = require("child_process");
const path = require("path");
const axios = require("axios");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// EODHD API key
const EODHD_API_KEY = process.env.EODHD_API_KEY;

// Helper function to run Python script and get output
async function runPythonScript(command, args) {
  return new Promise((resolve, reject) => {
    // Path to the Python script
    const scriptPath = path.join(__dirname, "get_yfinance_data.py");
    
    // Full command with script path and arguments
    const fullArgs = [scriptPath, command, ...args];
    
    // Spawn Python process
    const pythonProcess = spawn("python", fullArgs);
    
    let dataString = "";
    let errorString = "";
    
    // Collect data from stdout
    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString();
    });
    
    // Collect errors from stderr
    pythonProcess.stderr.on("data", (data) => {
      errorString += data.toString();
    });
    
    // Handle process completion
    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}: ${errorString}`));
        return;
      }
      
      try {
        // Parse the JSON output from the Python script
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Python script output: ${error.message}\nOutput: ${dataString}`));
      }
    });
    
    // Handle process errors
    pythonProcess.on("error", (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

// Helper function to fetch data from EODHD API
async function fetchEODHDData(ticker) {
  try {
    // Normalize ticker for EODHD (might need different format than yfinance)
    const eodhd_ticker = ticker.replace(".NS", ".NSE").replace(".BO", ".BSE");
    
    // Fetch basic stock information
    const infoResponse = await axios.get(
      `https://eodhistoricaldata.com/api/fundamentals/${eodhd_ticker}?api_token=${EODHD_API_KEY}&fmt=json`
    );
    
    // Fetch technical indicators
    const technicalResponse = await axios.get(
      `https://eodhistoricaldata.com/api/technical/${eodhd_ticker}?api_token=${EODHD_API_KEY}&fmt=json&function=rsi,macd&period=14`
    );
    
    // Fetch news
    const newsResponse = await axios.get(
      `https://eodhistoricaldata.com/api/news?api_token=${EODHD_API_KEY}&s=${eodhd_ticker}&limit=10&fmt=json`
    );
    
    return {
      info: infoResponse.data,
      technical: technicalResponse.data,
      news: newsResponse.data,
      data_source: "EODHD"
    };
  } catch (error) {
    console.error("EODHD API error:", error.message);
    return {
      error: true,
      message: `EODHD API error: ${error.message}`,
      data_source: "EODHD"
    };
  }
}

// Pre-analysis prompt for Gemini to classify the query
const PRE_ANALYSIS_PROMPT = `
You are Fin Genie's query analyzer. Your task is to analyze a financial query and extract key information.

For the following user query, please:
1. Classify the intent into one of these categories:
   - stock_analysis: User wants analysis of a specific stock
   - news_request: User wants news about a company or market
   - definition_request: User wants a definition of a financial term
   - market_sentiment: User wants overall market sentiment
   - company_projection: User wants future projections for a company
   - trading_advice_query: User is asking for specific trading advice
   - comparison_request: User wants to compare multiple stocks
   - general_question: Any other general financial question

2. Extract any entities mentioned:
   - tickers: Stock ticker symbols (e.g., AAPL, MSFT.US, RELIANCE.NSE)
   - companies: Company names (e.g., Apple, Microsoft)
   - terms: Financial terms to define (e.g., P/E ratio, market cap)
   - time_periods: Any time periods mentioned (e.g., next quarter, 5 years)

3. Determine if fresh financial data is required:
   - requires_fresh_data: true/false (true if real-time or recent financial data is needed)

Return your analysis as a JSON object with the following structure:
{
  "intent": "one_of_the_categories_above",
  "entities": {
    "tickers": ["TICKER1", "TICKER2"],
    "companies": ["Company1", "Company2"],
    "terms": ["Term1", "Term2"],
    "time_periods": ["Period1", "Period2"]
  },
  "requires_fresh_data": true/false,
  "explanation": "Brief explanation of your classification"
}

User Query: `;

// Main answer generation prompt for Gemini
const MAIN_ANSWER_PROMPT = `
You are Fin Genie, a Senior Equity Analyst AI and financial assistant. You provide expert financial insights and analysis based on data and market knowledge.

# IMPORTANT GUIDELINES

## General Behavior
- Provide clear, concise, and accurate financial information
- Use professional financial terminology appropriately
- Structure your responses with clear sections and bullet points when helpful
- Always cite the source of your data (e.g., "According to yfinance data" or "Based on EODHD data")
- Mention when data might be outdated or incomplete
- When appropriate, explain financial concepts in an educational manner

## Ethical Boundaries
- NEVER provide direct trading advice (buy/sell recommendations)
- NEVER make price predictions with specific numbers or timeframes
- NEVER guarantee returns or outcomes
- NEVER recommend specific investment allocations or portfolio percentages
- Always include appropriate disclaimers for forward-looking statements
- Emphasize that all financial decisions should involve personal research and potentially consulting with a financial advisor

## Response Types

### For Stock Analysis
- Provide a comprehensive overview of the company and its stock performance
- Include relevant metrics: price, market cap, P/E ratio, etc.
- Summarize recent news and analyst opinions
- Discuss general strengths, weaknesses, opportunities, and threats
- Mention industry trends and competitive position
- Include technical indicators like RSI, MACD if available
- Add a disclaimer about the limitations of technical analysis

### For Definitions
- Provide clear, accurate definitions of financial terms
- Include examples where helpful
- Explain how the concept is used in financial analysis
- Mention related terms or concepts

### For News Requests
- Summarize recent relevant news
- Focus on items likely to impact financial performance
- Provide context for why the news matters
- Cite news sources

### For Market Sentiment
- Discuss general market trends
- Mention relevant indices and their recent performance
- Summarize expert opinions on market direction
- Emphasize the uncertainty of market predictions

### For Company Projections
- Discuss analyst consensus if available
- Mention company guidance and historical performance
- Discuss industry trends and competitive factors
- Include strong disclaimers about the speculative nature of projections

### For Trading Advice Queries
- NEVER provide direct trading advice
- Instead, educate on factors to consider when making such decisions
- Discuss general approaches to the type of trading decision
- Emphasize the importance of personal research and risk management

### For Comparison Requests
- Compare key metrics between companies
- Highlight relative strengths and weaknesses
- Discuss competitive dynamics
- Avoid declaring a "better investment"

## Data Sources
- You have access to data from:
  1. yfinance (primary source)
  2. EODHD API (secondary source)
- If data is missing or errors occurred, acknowledge this in your response

Now, please respond to the following user query. I'll provide you with:
1. The original user query
2. A pre-analysis of the query
3. Financial data retrieved (if any)

USER QUERY: `;

// Main handler for the Netlify Function
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS preflight response" })
    };
  }
  
  // Only accept POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }
  
  try {
    // Parse the request body
    const requestBody = JSON.parse(event.body);
    const userQuery = requestBody.query;
    
    if (!userQuery) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Query is required" })
      };
    }
    
    console.log("Processing query:", userQuery);
    
    // Step 1: Pre-analyze the query with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    console.log("Running pre-analysis with Gemini...");
    const preAnalysisResult = await model.generateContent(PRE_ANALYSIS_PROMPT + userQuery);
    const preAnalysisText = preAnalysisResult.response.text();
    
    let queryAnalysis;
    try {
      // Extract JSON from the response (handling potential text before/after JSON)
      const jsonMatch = preAnalysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        queryAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in pre-analysis response");
      }
    } catch (error) {
      console.error("Error parsing pre-analysis JSON:", error);
      console.log("Raw pre-analysis text:", preAnalysisText);
      
      // Fallback to a simple analysis
      queryAnalysis = {
        intent: "general_question",
        entities: {
          tickers: [],
          companies: [],
          terms: [],
          time_periods: []
        },
        requires_fresh_data: false,
        explanation: "Failed to parse pre-analysis, using fallback."
      };
    }
    
    console.log("Query analysis:", JSON.stringify(queryAnalysis));
    
    // Step 2: Gather data if needed
    let fetchedData = {};
    let dataErrors = [];
    
    if (queryAnalysis.requires_fresh_data && 
        (queryAnalysis.entities.tickers.length > 0 || queryAnalysis.entities.companies.length > 0)) {
      
      console.log("Fresh data required, fetching...");
      
      // Prioritize tickers over company names
      const tickersToFetch = queryAnalysis.entities.tickers.length > 0 
        ? queryAnalysis.entities.tickers 
        : [];
      
      // If we have tickers, fetch data for each one
      if (tickersToFetch.length > 0) {
        // Only fetch for the first ticker for now (to keep response times reasonable)
        const primaryTicker = tickersToFetch[0];
        
        try {
          console.log(`Fetching yfinance data for ${primaryTicker}...`);
          // Try yfinance first
          const yfinanceData = await runPythonScript("data", [primaryTicker]);
          
          if (yfinanceData.error) {
            console.log(`yfinance error: ${yfinanceData.message}`);
            dataErrors.push(`yfinance: ${yfinanceData.message}`);
            
            // Fallback to EODHD
            console.log(`Falling back to EODHD for ${primaryTicker}...`);
            const eodhdData = await fetchEODHDData(primaryTicker);
            
            if (eodhdData.error) {
              dataErrors.push(`EODHD: ${eodhdData.message}`);
            } else {
              fetchedData[primaryTicker] = eodhdData;
            }
          } else {
            fetchedData[primaryTicker] = yfinanceData;
            
            // If yfinance succeeded but is missing technical indicators, supplement with EODHD
            if (yfinanceData.rsi === "N/A (requires calculation or separate fetch)" || 
                yfinanceData.macd === "N/A (requires calculation or separate fetch)") {
              
              console.log(`Supplementing ${primaryTicker} with EODHD technical data...`);
              try {
                const eodhdTechnical = await fetchEODHDData(primaryTicker);
                if (!eodhdTechnical.error && eodhdTechnical.technical) {
                  fetchedData[primaryTicker].technical = {
                    ...fetchedData[primaryTicker].technical,
                    ...eodhdTechnical.technical
                  };
                  fetchedData[primaryTicker].data_source = "yfinance + EODHD (technical)";
                }
              } catch (error) {
                console.log(`Error supplementing with EODHD: ${error.message}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching data for ${primaryTicker}:`, error);
          dataErrors.push(`Error fetching data for ${primaryTicker}: ${error.message}`);
        }
      }
    }
    
    // Step 3: Generate the final answer with Gemini
    console.log("Generating final answer with Gemini...");
    
    // Construct the full prompt
    const fullPrompt = `${MAIN_ANSWER_PROMPT}
${userQuery}

PRE-ANALYSIS:
${JSON.stringify(queryAnalysis, null, 2)}

${Object.keys(fetchedData).length > 0 ? `FETCHED DATA:
${JSON.stringify(fetchedData, null, 2)}` : "NO FINANCIAL DATA FETCHED."}

${dataErrors.length > 0 ? `DATA ERRORS:
${dataErrors.join("\n")}` : ""}

Please provide a comprehensive, accurate, and helpful response to the user's query based on the available data and your financial knowledge. Remember to follow all the guidelines above, especially regarding not providing direct trading advice.`;

    const finalResult = await model.generateContent(fullPrompt);
    const answer = finalResult.response.text();
    
    // Return the final response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        answer,
        queryAnalysis,
        dataFetched: Object.keys(fetchedData).length > 0,
        dataErrors: dataErrors.length > 0 ? dataErrors : null
      })
    };
    
  } catch (error) {
    console.error("Error processing request:", error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      })
    };
  }
};
