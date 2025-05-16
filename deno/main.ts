// Main entry point for Deno Deploy
import { serve } from "https://deno.land/std@0.220.1/http/server.ts";
import { fingenieChat } from "./routes/fingenieChat.ts";
import { getInvestmentReport } from "./routes/getInvestmentReport.ts";
import { finGenieOracle } from "./routes/finGenieOracle.ts";

// Create a router to handle different endpoints
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Set CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle OPTIONS requests for CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Route requests to the appropriate handler
  try {
    if (path === "/api/fingenieChat") {
      return await fingenieChat(req, corsHeaders);
    } else if (path === "/api/getInvestmentReport") {
      return await getInvestmentReport(req, corsHeaders);
    } else if (path === "/api/finGenieOracle") {
      return await finGenieOracle(req, corsHeaders);
    } else if (path === "/") {
      return new Response("FinPath Insight API is running!", {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    } else {
      return new Response("Not Found", {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }
  } catch (error) {
    console.error(`Error handling request to ${path}:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Start the server
serve(handler, { port: 8000 });

console.log("Server running at http://localhost:8000/");
