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
    const { query } = body;
    
    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required field: query" })
      };
    }

    // Get market data for context
    const marketData = await getMarketData();
    
    // Generate oracle response using Gemini
    const response = await generateOracleResponse(query, marketData);

    // Return the oracle response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ response })
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

// Function to get market data for context
async function getMarketData() {
  try {
    // Get major indices data
    const indices = ["^GSPC", "^DJI", "^IXIC", "^RUT", "^VIX"];
    const indicesData = await Promise.all(
      indices.map(async (symbol) => {
        try {
          const quote = await yfinance.quote(symbol);
          return {
            symbol,
            name: quote.shortName || quote.longName,
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent
          };
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          return {
            symbol,
            name: symbol,
            price: null,
            change: null,
            changePercent: null
          };
        }
      })
    );

    // Get top gainers and losers
    const topStocks = [
      "AAPL", "MSFT", "GOOGL", "AMZN", "META", 
      "TSLA", "NVDA", "JPM", "V", "WMT"
    ];
    
    const stocksData = await Promise.all(
      topStocks.map(async (symbol) => {
        try {
          const quote = await yfinance.quote(symbol);
          return {
            symbol,
            name: quote.shortName || quote.longName,
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent
          };
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          return {
            symbol,
            name: symbol,
            price: null,
            change: null,
            changePercent: null
          };
        }
      })
    );

    return {
      indices: indicesData,
      stocks: stocksData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error fetching market data:", error);
    return {
      indices: [],
      stocks: [],
      timestamp: new Date().toISOString()
    };
  }
}

// Function to generate oracle response using Gemini
async function generateOracleResponse(query, marketData) {
  try {
    // Format market data for Gemini
    const formattedData = JSON.stringify(marketData, null, 2);

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Create prompt for Gemini
    const prompt = `
    You are FinGenie Oracle, a financial assistant with deep insights into market trends and investment strategies.
    
    Please respond to the following user query about financial markets or investment advice.
    
    Current Market Data:
    ${formattedData}
    
    User Query: ${query}
    
    Your response should be insightful, data-driven, and provide actionable advice. Use the market data provided to inform your response.
    Format your response in clear sections with markdown formatting for better readability.
    Keep your response concise but informative, focusing on the most relevant information for the user's query.
    `;

    // Send prompt to Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating oracle response:", error);
    throw new Error("Failed to generate oracle response");
  }
}
