const { GoogleGenerativeAI } = require("@google/generative-ai");
const yfinance = require("yahoo-finance2").default;
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS preflight successful" })
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { ticker, query } = body;
    
    if (!ticker) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required field: ticker" })
      };
    }

    // Fetch stock data from Yahoo Finance
    const stockData = await fetchStockData(ticker);
    
    // Generate investment report using Gemini
    const report = await generateInvestmentReport(ticker, query || `What's the price forecast and market analysis on ${ticker} stock?`, stockData);

    // Save report to Supabase
    const { error: reportError } = await supabase
      .from("investment_reports")
      .insert([{
        ticker,
        report,
        timestamp: new Date().toISOString()
      }]);

    if (reportError) {
      console.error("Error saving investment report:", reportError);
    }

    // Return the report
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ report })
    };
  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};

// Function to fetch stock data from Yahoo Finance
async function fetchStockData(ticker) {
  try {
    // Get quote data
    const quote = await yfinance.quote(ticker);
    
    // Get historical data (1 year)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);
    
    const historical = await yfinance.historical(ticker, {
      period1: startDate.toISOString().split('T')[0],
      period2: endDate.toISOString().split('T')[0],
      interval: '1mo'
    });
    
    // Get company information
    const companyInfo = await yfinance.quoteSummary(ticker, { modules: ['assetProfile', 'financialData', 'defaultKeyStatistics'] });
    
    return {
      quote,
      historical,
      companyInfo
    };
  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error);
    throw new Error(`Failed to fetch stock data for ${ticker}`);
  }
}

// Function to generate investment report using Gemini
async function generateInvestmentReport(ticker, query, stockData) {
  try {
    // Format stock data for Gemini
    const formattedData = JSON.stringify({
      ticker,
      currentPrice: stockData.quote.regularMarketPrice,
      priceChange: stockData.quote.regularMarketChange,
      percentChange: stockData.quote.regularMarketChangePercent,
      marketCap: stockData.quote.marketCap,
      volume: stockData.quote.regularMarketVolume,
      averageVolume: stockData.quote.averageDailyVolume3Month,
      fiftyTwoWeekHigh: stockData.quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: stockData.quote.fiftyTwoWeekLow,
      companyName: stockData.quote.longName,
      sector: stockData.companyInfo?.assetProfile?.sector || "Unknown",
      industry: stockData.companyInfo?.assetProfile?.industry || "Unknown",
      description: stockData.companyInfo?.assetProfile?.longBusinessSummary || "",
      peRatio: stockData.quote.trailingPE,
      forwardPE: stockData.quote.forwardPE,
      dividendYield: stockData.quote.dividendYield,
      earningsGrowth: stockData.companyInfo?.defaultKeyStatistics?.earningsQuarterlyGrowth,
      revenueGrowth: stockData.companyInfo?.financialData?.revenueGrowth,
      analystRating: stockData.companyInfo?.financialData?.recommendationMean,
      analystTargetPrice: stockData.companyInfo?.financialData?.targetMeanPrice,
      historicalPrices: stockData.historical.map(item => ({
        date: item.date,
        close: item.close
      }))
    }, null, 2);

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Create prompt for Gemini
    const prompt = `
    You are FinGenie, a financial assistant specializing in stock analysis and investment advice.
    
    Please analyze the following stock data for ${ticker} (${stockData.quote.longName}) and provide a detailed investment report.
    
    Stock Data:
    ${formattedData}
    
    User Query: ${query}
    
    Your analysis should include:
    1. A brief overview of the company
    2. Current market position and recent performance
    3. Key financial metrics and what they indicate
    4. Technical analysis based on the historical data
    5. Fundamental analysis considering the company's financials
    6. Comparison with industry peers if relevant
    7. Potential risks and opportunities
    8. A conclusion with your investment recommendation (buy, hold, or sell)
    
    Format your response in clear sections with headings. Use markdown formatting for better readability.
    `;

    // Send prompt to Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating investment report:", error);
    throw new Error("Failed to generate investment report");
  }
}
