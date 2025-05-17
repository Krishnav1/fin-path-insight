// Portfolio Analysis API for Deno Deploy
// Using direct import from Deno standard library
import { GoogleGenerativeAI } from "@google/generative-ai";

// Reference to the types.d.ts file for type declarations
/// <reference path="../types.d.ts" />
/// <reference path="../deno.d.ts" />

export async function analyzePortfolio(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
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
    
    // Extract holdings data from request
    const { holdings } = body;

    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid holdings data in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get API key from environment
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Prepare the prompt for Gemini
    const prompt = `
You are a Senior Equity Research Analyst assisting users on a financial platform called FinGenie. A user has entered their portfolio holdings.

Your job is to analyze the data and provide insightful, personalized, and jargon-free feedback for a retail investor. Use simple language but offer genuine financial intelligence. Base all analysis only on the data below (no external API or live data).

📊 PORTFOLIO HOLDINGS:
${JSON.stringify(holdings, null, 2)}

📊 ANALYSIS TASKS:

1. **Portfolio Overview**
   - Total invested amount
   - Current market value
   - Absolute and % Returns
   - Best & Worst Performing Stock (based on % return)

2. **Stock-Level Breakdown**
   - % Gain/Loss per stock
   - Highlight top gainers (e.g. >10%) and underperformers (<-10%)

3. **Diversification & Risk**
   - Sector exposure breakdown in %
   - Check for concentration risks (e.g. >50% in one sector)
   - Is the portfolio well-diversified?

4. **Insights & Recommendations**
   - Suggest stocks to hold, reallocate, or consider selling
   - Recommend sector/stock types for diversification
   - Mention if any red flags in risk

5. **One-paragraph Summary**
   Write a friendly and clear closing summary. Example:
   "Your portfolio has grown by 5.2%, driven by Tata Power. However, HDFC Bank is under pressure. Consider reducing exposure to Banking."

🧾 OUTPUT FORMAT (strictly in JSON):

{
  "overview": {
    "total_invested": "...",
    "market_value": "...",
    "absolute_return": "...",
    "percent_return": "...",
    "top_gainer": "...",
    "worst_performer": "..."
  },
  "stock_breakdown": [
    {
      "symbol": "...",
      "sector": "...",
      "percent_gain": "...",
      "recommendation": "Hold / Exit / Watch"
    },
    ...
  ],
  "diversification": {
    "sector_breakdown": {
      "IT": "40%",
      "Banking": "30%",
      "Energy": "30%"
    },
    "risk_flag": "High / Medium / Low"
  },
  "recommendations": [
    "Consider diversifying into FMCG or Pharma",
    "Book partial profit in Tata Power",
    ...
  ],
  "summary": "..."
}

Only use the data provided. Don't assume any external or real-time info.
    `;

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Send the prompt to Gemini
    const result = await model.generateContent(prompt);
    const response = result.response;
    let analysisText = response.text();
    
    // Try to parse the response as JSON
    let analysisJson;
    try {
      // Extract JSON from the response if it's wrapped in markdown code blocks
      if (analysisText.includes('```json')) {
        analysisText = analysisText.split('```json')[1].split('```')[0].trim();
      } else if (analysisText.includes('```')) {
        analysisText = analysisText.split('```')[1].split('```')[0].trim();
      }
      
      analysisJson = JSON.parse(analysisText);
    } catch (jsonError) {
      console.error('Error parsing Gemini response as JSON:', jsonError);
      console.log('Raw response:', analysisText);
      
      return new Response(
        JSON.stringify({
          error: 'Failed to parse analysis results as JSON',
          rawResponse: analysisText
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        analysis: analysisJson,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error processing portfolio analysis request:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return new Response(
      JSON.stringify({
        error: `Failed to process portfolio analysis: ${errorMessage}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
