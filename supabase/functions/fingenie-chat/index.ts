// Supabase Edge Function for FinGenie Chat
// This function provides AI chat capabilities using Google's Gemini API
// Enhanced with portfolio-aware context for personalized financial advice

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for Supabase Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// In-memory storage for conversation history (in production, use a database)
const conversationHistory: Record<string, Array<{ role: string; parts: Array<{ text: string }> }>> = {};

// Get Supabase URL and key from environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

// Helper function to check if a query is portfolio-related
function isPortfolioQuery(query: string): boolean {
  const portfolioKeywords = [
    'portfolio', 'holdings', 'stocks', 'investments', 'allocation', 'diversification',
    'my stocks', 'my investments', 'my portfolio', 'my holdings',
    'stock breakdown', 'sector', 'performance', 'return', 'gain', 'loss',
    'should I sell', 'should I buy', 'rebalance', 'risk'
  ];
  
  const queryLower = query.toLowerCase();
  return portfolioKeywords.some(keyword => queryLower.includes(keyword.toLowerCase()));
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
    
    // Extract userId and message from request
    const { userId, message, portfolioData } = body;

    if (!userId || !message) {
      return new Response(
        JSON.stringify({ error: "Missing userId or message in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Check if this is a portfolio-related query
    const isPorfolioRelated = isPortfolioQuery(message);
    let userPortfolioData = portfolioData; // Use portfolio data if provided in the request

    // Get API key from environment
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const vertexRegion = "asia-south1"; // Added for consistency

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Initialize conversation history for this user if it doesn't exist
    if (!conversationHistory[userId]) {
      conversationHistory[userId] = [];
    }
    
    // If this is a portfolio-related query and we don't have portfolio data yet, try to fetch it
    if (isPorfolioRelated && !userPortfolioData && SUPABASE_URL && SUPABASE_ANON_KEY) {
      try {
        console.log('Portfolio-related query detected. Fetching portfolio data...');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // First, find the user's portfolio ID
        const { data: portfolios, error: portfolioError } = await supabase
          .from('portfolios')
          .select('id')
          .eq('user_id', userId)
          .limit(1);
          
        if (!portfolioError && portfolios && portfolios.length > 0) {
          const portfolioId = portfolios[0].id;
          
          // Then fetch the holdings for that portfolio
          const { data: holdings, error: holdingsError } = await supabase
            .from('portfolio_holdings')
            .select('*')
            .eq('portfolio_id', portfolioId);
            
          if (!holdingsError && holdings && holdings.length > 0) {
            userPortfolioData = holdings;
            console.log(`Found ${holdings.length} holdings for user ${userId}`);
            
            // Also check if we have any analysis results
            const { data: analysis, error: analysisError } = await supabase
              .from('portfolio_analysis')
              .select('analysis_data')
              .eq('portfolio_id', portfolioId)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (!analysisError && analysis && analysis.length > 0) {
              userPortfolioData = {
                holdings: holdings,
                analysis: analysis[0].analysis_data
              };
              console.log('Found portfolio analysis data');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error);
        // Continue without portfolio data if there's an error
      }
    }

    // Add user message to history
    conversationHistory[userId].push({
      role: "user",
      parts: [{ text: message }],
    });

    // Prepare the conversation for Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // If we have portfolio data and this is a portfolio-related query, add it to the context
    if (isPorfolioRelated && userPortfolioData) {
      console.log('Adding portfolio context to conversation');
      
      // Create a system message with portfolio context
      const portfolioContext = {
        role: "system",
        parts: [{ text: `
You are FinGenie, a senior equity research analyst assistant. The user has the following portfolio data:

${JSON.stringify(userPortfolioData, null, 2)}

When answering questions about the portfolio:
1. Reference specific holdings when relevant
2. Provide insights as a senior equity research analyst would
3. Use simple language for a retail investor
4. Be specific about sectors, allocations, and performance
5. Provide actionable recommendations when appropriate

The user is asking about their portfolio. Use this data to provide personalized advice.
` }]
      };
      
      // Add the system message at the beginning of the history
      if (conversationHistory[userId].length > 1) {
        // If there's existing history, insert after the first system message if any
        const hasSystemMessage = conversationHistory[userId][0].role === "system";
        if (hasSystemMessage) {
          conversationHistory[userId].splice(1, 0, portfolioContext);
        } else {
          conversationHistory[userId].unshift(portfolioContext);
        }
      } else {
        // If this is the first message, add it at the beginning
        conversationHistory[userId].unshift(portfolioContext);
      }
    } else if (!conversationHistory[userId].some(msg => msg.role === "system")) {
      // If no system message exists yet, add a default one
      conversationHistory[userId].unshift({
        role: "system",
        parts: [{ text: "You are FinGenie, a senior equity research analyst assistant providing financial insights and investment advice in simple language for retail investors. You explain complex financial concepts clearly and provide actionable recommendations." }]
      });
    }
    
    // Format the conversation history for Gemini
    const chat = model.startChat({
      history: conversationHistory[userId],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    // Send the message to Gemini
    const result = await chat.sendMessage(message);
    const response = result.response;
    const botReply = response.text();

    // Add bot response to history
    conversationHistory[userId].push({
      role: "model",
      parts: [{ text: botReply }],
    });

    // Limit conversation history to last 20 messages to prevent token limits
    if (conversationHistory[userId].length > 20) {
      conversationHistory[userId] = conversationHistory[userId].slice(-20);
    }

    return new Response(
      JSON.stringify({
        response: botReply,
        userId: userId,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error processing chat request:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return new Response(
      JSON.stringify({
        error: `Failed to process chat request: ${errorMessage}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
})
