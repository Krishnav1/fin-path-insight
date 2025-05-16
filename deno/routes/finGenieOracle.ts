// FinGenie Oracle API for Deno Deploy
import { GoogleGenerativeAI } from "@google/generative-ai";

// Reference to the types.d.ts file for type declarations
/// <reference path="../types.d.ts" />
/// <reference path="../deno.d.ts" />

// Cache for storing responses to avoid hitting rate limits
interface CachedResponse {
  response: string;
  timestamp: number;
}

const responseCache: Record<string, CachedResponse> = {};
const CACHE_TTL = 1800000; // 30 minutes in milliseconds

export async function finGenieOracle(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
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

  // Define requestBody outside try block so it's accessible in catch
  let requestBody: { userId?: string; query?: string } = {};

  try {
    // Parse request body
    const body = await req.json();
    
    // Store in outer variable for access in catch block
    requestBody = body;
    
    // Extract query from request
    const { query, userId = "anonymous" } = body;

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Missing query in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check cache first
    const cacheKey = `${userId}:${query}`;
    const cachedData = responseCache[cacheKey];
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      console.log(`Using cached response for query: ${query}`);
      return new Response(
        JSON.stringify({
          response: cachedData.response,
          userId,
          cached: true
        }),
        {
          status: 200,
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const promptTemplate = `
You are FinGenie Oracle, a specialized AI assistant focused on providing accurate, educational information about financial markets, investment strategies, and economic concepts.

User Query: "${query}"

Guidelines:
1. Provide factual, educational information about financial topics.
2. Explain complex financial concepts in clear, accessible language.
3. When discussing investment strategies, present multiple perspectives and approaches.
4. Include relevant historical context or data when appropriate.
5. NEVER provide specific investment advice or recommendations for individual securities.
6. Always include appropriate disclaimers about financial information.
7. If the query is not related to finance or economics, politely redirect to financial topics.

Format your response in well-structured Markdown, including:
- Clear headings and subheadings
- Bullet points for key information
- Examples where helpful
- A brief "Key Takeaways" section at the end
- A standard disclaimer at the end

Disclaimer to include: "This information is for educational purposes only and does not constitute investment advice. Financial markets involve risk, and past performance is not indicative of future results. Always consult with a qualified financial advisor before making investment decisions."
`;

    // Send the query to Gemini
    console.log("Sending query to Gemini Oracle...");
    const result = await model.generateContent(promptTemplate);
    const response = result.response;
    const oracleResponse = response.text();

    // Store in cache
    responseCache[cacheKey] = {
      response: oracleResponse,
      timestamp: Date.now()
    };

    return new Response(
      JSON.stringify({
        response: oracleResponse,
        userId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing oracle request:", error);
    
    // Implement graceful fallback for rate limit errors
    let errorMsg = error instanceof Error ? error.message : 'Unknown error';
    let statusCode = 500;
    
    if (errorMsg.includes("429") || errorMsg.includes("quota")) {
      errorMsg = "Our AI services are experiencing high demand. Please try again in a few minutes.";
      statusCode = 429;
      
      // Provide a simple fallback response
      const fallbackResponse = `# Financial Information

I apologize, but our AI services are currently experiencing high demand. Here are some general financial resources you might find helpful:

- Check financial news sources like Bloomberg, CNBC, or Financial Times for current market information
- Visit investor.gov for educational resources about investing
- Consider reviewing Investopedia for explanations of financial concepts

Please try your specific query again in a few minutes.

**Disclaimer:** This information is for educational purposes only and does not constitute investment advice. Financial markets involve risk, and past performance is not indicative of future results. Always consult with a qualified financial advisor before making investment decisions.`;
      
      return new Response(
        JSON.stringify({
          response: fallbackResponse,
          error: errorMsg,
          userId: requestBody?.userId || "anonymous",
          fallback: true
        }),
        {
          status: 200, // Return 200 with fallback content instead of error
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Use the already defined errorMsg variable
    return new Response(
      JSON.stringify({
        error: `Failed to process oracle request: ${errorMsg}`,
        userId: requestBody?.userId || "anonymous"
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
