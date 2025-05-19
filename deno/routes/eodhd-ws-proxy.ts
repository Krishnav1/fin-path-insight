// EODHD WebSocket Proxy for Deno Deploy
// This endpoint creates a WebSocket connection to EODHD and forwards real-time updates to clients
/// <reference path="../deno.d.ts" />

const EODHD_WS_URL = 'wss://ws.eodhd.com/ws';

// Store active connections
interface ClientConnection {
  socket: WebSocket;
  subscriptions: Set<string>; // Symbols this client is subscribed to
}

// Global connection management
const clients: Map<string, ClientConnection> = new Map();
let eodhSocket: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY = 3000; // 3 seconds

// Track which symbols we're currently subscribed to with the EODHD WebSocket
const activeSymbols: Set<string> = new Set();

// Connect to EODHD WebSocket
function connectToEODHD() {
  try {
    // Get API key from environment or use premium API key
    // Use a try-catch block to handle potential Deno namespace issues
    let API_KEY = '682ab8a9176503.56947213'; // Default fallback
    try {
      const envKey = Deno?.env?.get?.('EODHD_API_KEY');
      if (envKey) API_KEY = envKey;
    } catch (e) {
      console.error('Error accessing environment variable:', e);
      // Continue with default API key
    }
    
    // Close existing connection if any
    if (eodhSocket) {
      try {
        eodhSocket.close();
      } catch (e) {
        console.error('Error closing existing EODHD socket:', e);
      }
    }
    
    console.log('Connecting to EODHD WebSocket...');
    eodhSocket = new WebSocket(`${EODHD_WS_URL}?api_token=${API_KEY}`);
    
    eodhSocket.onopen = () => {
      console.log('Connected to EODHD WebSocket');
      reconnectAttempts = 0;
      
      // Resubscribe to all active symbols
      if (activeSymbols.size > 0) {
        subscribeToSymbols(Array.from(activeSymbols));
      }
    };
    
    eodhSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Forward the message to all clients who are subscribed to this symbol
        broadcastToInterestedClients(data);
      } catch (error) {
        console.error('Error parsing EODHD WebSocket message:', error);
      }
    };
    
    eodhSocket.onerror = (error) => {
      console.error('EODHD WebSocket error:', error);
    };
    
    eodhSocket.onclose = () => {
      console.log('EODHD WebSocket closed');
      eodhSocket = null;
      
      // Attempt to reconnect with exponential backoff
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts);
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
        
        setTimeout(() => {
          reconnectAttempts++;
          connectToEODHD();
        }, delay);
      } else {
        console.error('Max reconnection attempts reached. Giving up.');
        // Notify all clients of the connection failure
        for (const client of clients.values()) {
          try {
            client.socket.send(JSON.stringify({
              type: 'error',
              message: 'Failed to connect to EODHD WebSocket after multiple attempts'
            }));
          } catch (e) {
            // Ignore errors when sending to clients
          }
        }
      }
    };
  } catch (error) {
    console.error('Error connecting to EODHD WebSocket:', error);
  }
}

// Subscribe to symbols
function subscribeToSymbols(symbols: string[]) {
  if (!eodhSocket || eodhSocket.readyState !== WebSocket.OPEN) {
    console.error('Cannot subscribe: EODHD WebSocket not connected');
    return false;
  }
  
  try {
    // Add symbols to active set
    symbols.forEach(symbol => activeSymbols.add(symbol));
    
    // Send subscription message to EODHD
    const subscriptionMessage = {
      action: 'subscribe',
      symbols: symbols
    };
    
    eodhSocket.send(JSON.stringify(subscriptionMessage));
    console.log(`Subscribed to symbols: ${symbols.join(', ')}`);
    return true;
  } catch (error) {
    console.error('Error subscribing to symbols:', error);
    return false;
  }
}

// Unsubscribe from symbols
function unsubscribeFromSymbols(symbols: string[]) {
  if (!eodhSocket || eodhSocket.readyState !== WebSocket.OPEN) {
    console.error('Cannot unsubscribe: EODHD WebSocket not connected');
    return false;
  }
  
  try {
    // Check if any other clients are still subscribed to these symbols
    const symbolsToUnsubscribe = symbols.filter(symbol => {
      // Remove from active set
      activeSymbols.delete(symbol);
      
      // Check if any client is still subscribed
      for (const client of clients.values()) {
        if (client.subscriptions.has(symbol)) {
          // Someone still wants this symbol, so don't unsubscribe
          activeSymbols.add(symbol); // Add it back
          return false;
        }
      }
      return true;
    });
    
    if (symbolsToUnsubscribe.length === 0) {
      return true; // Nothing to unsubscribe
    }
    
    // Send unsubscription message to EODHD
    const unsubscriptionMessage = {
      action: 'unsubscribe',
      symbols: symbolsToUnsubscribe
    };
    
    eodhSocket.send(JSON.stringify(unsubscriptionMessage));
    console.log(`Unsubscribed from symbols: ${symbolsToUnsubscribe.join(', ')}`);
    return true;
  } catch (error) {
    console.error('Error unsubscribing from symbols:', error);
    return false;
  }
}

// Broadcast message to clients interested in the symbol
function broadcastToInterestedClients(data: any) {
  if (!data || !data.s) {
    return; // No symbol in the data, can't route it
  }
  
  const symbol = data.s;
  
  for (const [clientId, client] of clients.entries()) {
    if (client.subscriptions.has(symbol)) {
      try {
        client.socket.send(JSON.stringify(data));
      } catch (error) {
        console.error(`Error sending to client ${clientId}:`, error);
        // Remove client if we can't send to it
        removeClient(clientId);
      }
    }
  }
}

// Remove a client and clean up its subscriptions
function removeClient(clientId: string) {
  const client = clients.get(clientId);
  if (!client) return;
  
  // Get symbols this client was subscribed to
  const clientSymbols = Array.from(client.subscriptions);
  
  // Remove client
  clients.delete(clientId);
  
  // Check if we need to unsubscribe from any symbols
  const symbolsToUnsubscribe = clientSymbols.filter(symbol => {
    // Check if any other client is still subscribed
    for (const c of clients.values()) {
      if (c.subscriptions.has(symbol)) {
        return false; // Someone still wants this symbol
      }
    }
    return true; // No one wants this symbol anymore
  });
  
  if (symbolsToUnsubscribe.length > 0) {
    unsubscribeFromSymbols(symbolsToUnsubscribe);
  }
}

// Handle WebSocket upgrade requests
export async function eodhWsProxy(req: Request): Promise<Response> {
  // Only accept WebSocket upgrade requests
  const upgrade = req.headers.get('upgrade') || '';
  if (upgrade.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket request', { status: 400 });
  }
  
  try {
    // Create WebSocket pair
    // Handle potential Deno namespace issues
    let socket: WebSocket;
    let response: Response;
    
    try {
      const upgrade = Deno?.upgradeWebSocket?.(req);
      if (upgrade) {
        socket = upgrade.socket;
        response = upgrade.response;
      } else {
        throw new Error('WebSocket upgrade failed');
      }
    } catch (e) {
      console.error('Error upgrading WebSocket:', e);
      return new Response('WebSocket upgrade failed: ' + e.message, { status: 500 });
    }
    
    // Generate a unique client ID
    const clientId = crypto.randomUUID();
    
    // Set up client connection
    const clientConnection: ClientConnection = {
      socket,
      subscriptions: new Set()
    };
    
    // Store client connection
    clients.set(clientId, clientConnection);
    
    // Ensure EODHD connection is active
    if (!eodhSocket || eodhSocket.readyState !== WebSocket.OPEN) {
      connectToEODHD();
    }
    
    // Handle client messages
    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.action === 'subscribe' && Array.isArray(message.symbols)) {
          // Add symbols to client's subscriptions
          message.symbols.forEach((symbol: string) => {
            clientConnection.subscriptions.add(symbol);
          });
          
          // Subscribe to symbols with EODHD if not already subscribed
          const newSymbols = message.symbols.filter((symbol: string) => !activeSymbols.has(symbol));
          if (newSymbols.length > 0) {
            subscribeToSymbols(newSymbols);
          }
          
          // Confirm subscription to client
          socket.send(JSON.stringify({
            type: 'subscription_success',
            symbols: message.symbols
          }));
        } else if (message.action === 'unsubscribe' && Array.isArray(message.symbols)) {
          // Remove symbols from client's subscriptions
          message.symbols.forEach((symbol: string) => {
            clientConnection.subscriptions.delete(symbol);
          });
          
          // Check if we need to unsubscribe from EODHD
          unsubscribeFromSymbols(message.symbols);
          
          // Confirm unsubscription to client
          socket.send(JSON.stringify({
            type: 'unsubscription_success',
            symbols: message.symbols
          }));
        } else if (message.action === 'ping') {
          // Respond to ping with pong
          socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (error) {
        console.error('Error handling client message:', error);
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    };
    
    // Handle client disconnect
    socket.onclose = () => {
      console.log(`Client ${clientId} disconnected`);
      removeClient(clientId);
    };
    
    socket.onerror = (error) => {
      console.error(`Client ${clientId} error:`, error);
      removeClient(clientId);
    };
    
    // Send initial connection success message
    socket.send(JSON.stringify({
      type: 'connection_success',
      message: 'Connected to EODHD WebSocket proxy',
      clientId
    }));
    
    return response;
  } catch (error) {
    console.error('Error handling WebSocket upgrade:', error);
    return new Response(`WebSocket upgrade error: ${error.message}`, { status: 500 });
  }
}
