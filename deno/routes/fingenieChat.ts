// FinGenie Chat API for Deno Deploy
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

// In-memory storage for conversation history (in production, use a database)
const conversationHistory: Record<string, Array<{ role: string; parts: Array<{ text: string }> }>> = {};

export async function fingenieChat(req: Request, corsHeaders: Record<string, string>): Promise<Response> {
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
    const { userId, message } = body;

    if (!userId || !message) {
      return new Response(
        JSON.stringify({ error: "Missing userId or message in request body" }),
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

    // Initialize conversation history for this user if it doesn't exist
    if (!conversationHistory[userId]) {
      conversationHistory[userId] = [];
    }

    // Add user message to history
    conversationHistory[userId].push({
      role: "user",
      parts: [{ text: message }],
    });

    // Prepare the conversation for Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
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
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing chat request:", error);
    
    // Implement graceful fallback for rate limit errors
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let statusCode = 500;
    
    if (typeof errorMessage === 'string' && 
        (errorMessage.includes("429") || errorMessage.includes("quota"))) {
      errorMessage = "Our AI services are experiencing high demand. Please try again in a few minutes.";
      statusCode = 429;
    }
    
    return new Response(
      JSON.stringify({
        error: `Failed to process chat request: ${errorMessage}`,
        userId: "anonymous",
      }),
      {
        status: statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
