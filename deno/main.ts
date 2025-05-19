// Main entry point for Deno Deploy
// Import serve from Deno standard library
// Using a compatible version that works with Deno Deploy
/// <reference path="./deno.d.ts" />
import { serve } from "https://deno.land/std@0.221.0/http/server.ts";
import { fingenieChat } from "./routes/fingenieChat.ts";
import { getInvestmentReport } from "./routes/getInvestmentReport.ts";
import { finGenieOracle } from "./routes/finGenieOracle.ts";
import { marketData } from "./routes/marketData.ts";
import { analyzePortfolio } from "./routes/analyzePortfolio.ts";
import { eodhProxy } from "./routes/eodhd-proxy.ts";
import { eodhWsProxy } from "./routes/eodhd-ws-proxy.ts";
import { eodhFundamentals } from "./routes/eodhd-fundamentals.ts";
import { eodhRealtime } from "./routes/eodhd-realtime.ts";

// Define allowed origins
const ALLOWED_ORIGINS = [
  "https://fin-insight.netlify.app",
  "http://localhost:3000",
  "http://localhost:5173"
];

// Create a router to handle different endpoints
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // Get the origin from the request
  const requestOrigin = req.headers.get("Origin");
  
  // Validate origin against allowed list
  const isAllowedOrigin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin);
  const origin = isAllowedOrigin ? requestOrigin : ALLOWED_ORIGINS[0];
  
  // Set CORS headers with validated origin
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-API-Key",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400", // 24 hours
  };

  // Handle OPTIONS requests for CORS preflight
  if (req.method === "OPTIONS") {
    // For preflight requests, we need to respond with 204 and appropriate CORS headers
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
    } else if (path === "/api/market-data") {
      return await marketData(req, corsHeaders);
    } else if (path === "/api/analyzePortfolio") {
      return await analyzePortfolio(req, corsHeaders);
    } else if (path.startsWith("/api/eodhd-proxy/")) {
      return await eodhProxy(req, corsHeaders);
    } else if (path === "/api/eodhd-fundamentals") {
      return await eodhFundamentals(req, corsHeaders);
    } else if (path.startsWith("/api/eodhd-realtime/")) {
      return await eodhRealtime(req, corsHeaders);
    } else if (path === "/api/ws/eodhd") {
      // WebSocket endpoint doesn't need CORS headers as it's a WebSocket connection
      return await eodhWsProxy(req);
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// Start the server
serve(handler, { port: 8000 });

console.log("Server running at http://localhost:8000/");
