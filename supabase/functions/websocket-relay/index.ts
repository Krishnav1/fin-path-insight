// supabase/functions/websocket-relay/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS", // Only GET (for upgrade) and OPTIONS needed
};

// Map user-friendly market names or codes from URL to EODHD WebSocket endpoints
const eodhdMarketEndpoints: Record<string, (apiKey: string) => string> = {
  "us": (apiKey) => `wss://ws.eodhistoricaldata.com/ws/us?api_token=${apiKey}`,
  "us-quote": (apiKey) => `wss://ws.eodhistoricaldata.com/ws/us-quote?api_token=${apiKey}`,
  "forex": (apiKey) => `wss://ws.eodhistoricaldata.com/ws/forex?api_token=${apiKey}`,
  "crypto": (apiKey) => `wss://ws.eodhistoricaldata.com/ws/crypto?api_token=${apiKey}`,
  "nse": (apiKey) => `wss://ws.eodhistoricaldata.com/ws/NSE?api_token=${apiKey}`, // For Indian Market (National Stock Exchange)
  "lse": (apiKey) => `wss://ws.eodhistoricaldata.com/ws/LSE?api_token=${apiKey}`, // For London Stock Exchange (part of European)
  "euronext": (apiKey) => `wss://ws.eodhistoricaldata.com/ws/EURONEXT?api_token=${apiKey}`, // For Euronext (part of European)
  // Add other EODHD supported exchanges as needed. Check EODHD documentation for exact codes.
  // Example for a Chinese exchange if supported by EODHD WebSocket API:
  // "sse": (apiKey) => `wss://ws.eodhistoricaldata.com/ws/SSE?api_token=${apiKey}`,
};

serve(async (req: Request) => {
  // Handle CORS preflight requests.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("EODHD_API_KEY");
  if (!apiKey) {
    console.error("EODHD_API_KEY not set in environment variables for websocket-relay.");
    return new Response("Internal Server Error: API key not configured.", { status: 500, headers: corsHeaders });
  }

  if (req.headers.get("upgrade")?.toLowerCase() !== "websocket") {
    return new Response("Request isn't a websocket upgrade.", { status: 400, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  // Expected format: /functions/v1/websocket-relay/market_identifier
  const marketIdentifier = pathParts[pathParts.length -1];

  if (!marketIdentifier) {
    console.error("Market identifier missing in URL path:", url.pathname);
    return new Response("Market identifier missing in URL path.", { status: 400, headers: corsHeaders });
  }
  
  const getEodhdUrl = eodhdMarketEndpoints[marketIdentifier.toLowerCase()];
  if (!getEodhdUrl) {
    console.error("Unsupported market:", marketIdentifier);
    return new Response(`Unsupported market: ${marketIdentifier}`, { status: 400, headers: corsHeaders });
  }
  const eodhdWsUrl = getEodhdUrl(apiKey);

  const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
  const eodhdSocket = new WebSocket(eodhdWsUrl);

  let eodhdReady = false;
  let clientClosed = false;
  let eodhdClosed = false;

  // Client to Relay (and then to EODHD)
  clientSocket.onopen = () => {
    console.log(`Client connected to relay for market: ${marketIdentifier}`);
  };
  clientSocket.onmessage = (event) => {
    if (eodhdReady && eodhdSocket.readyState === WebSocket.OPEN) {
      eodhdSocket.send(event.data);
    } else {
      console.warn(`Client message for ${marketIdentifier} received but EODHD socket not ready. Message dropped: ${event.data}`);
    }
  };
  clientSocket.onerror = (event) => {
    console.error(`Client WebSocket error for ${marketIdentifier}:`, event instanceof ErrorEvent ? event.message : event.type);
    if (!eodhdClosed && eodhdSocket.readyState === WebSocket.OPEN) eodhdSocket.close(1011, "Client error");
  };
  clientSocket.onclose = (event) => {
    clientClosed = true;
    console.log(`Client WebSocket closed for ${marketIdentifier}: Code ${event.code}, Reason: ${event.reason}`);
    if (!eodhdClosed && eodhdSocket.readyState === WebSocket.OPEN) {
        eodhdSocket.close(event.code === 1000 || event.code === 1005 ? 1000 : event.code, "Client disconnected");
    }
  };

  // EODHD to Relay (and then to Client)
  eodhdSocket.onopen = () => {
    console.log(`Relay connected to EODHD for market: ${marketIdentifier}`);
    eodhdReady = true;
  };
  eodhdSocket.onmessage = (event) => {
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(event.data);
    }
  };
  eodhdSocket.onerror = (event) => {
    console.error(`EODHD WebSocket error for ${marketIdentifier}:`, event instanceof ErrorEvent ? event.message : event.type);
    if (!clientClosed && clientSocket.readyState === WebSocket.OPEN) clientSocket.close(1011, "EODHD connection error");
  };
  eodhdSocket.onclose = (event) => {
    eodhdClosed = true;
    console.log(`EODHD WebSocket closed for ${marketIdentifier}: Code ${event.code}, Reason: ${event.reason}`);
    if (!clientClosed && clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.close(event.code === 1000 || event.code === 1005 ? 1000 : event.code, `EODHD connection closed: ${event.reason}`);
    }
  };

  return response; // Respond to the initial HTTP upgrade request
});
