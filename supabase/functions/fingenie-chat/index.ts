// Supabase Edge Function for FinGenie Chat
// This function provides AI chat capabilities using Google's Gemini API

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

// CORS headers for Supabase Edge Functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// In-memory storage for conversation history (in production, use a database)
const conversationHistory: Record<string, Array<{ role: string; parts: Array<{ text: string }> }>> = {};

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
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY environment variable is not set" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
