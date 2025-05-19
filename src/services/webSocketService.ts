// WebSocket Service for real-time stock data
// This service connects to our Deno backend WebSocket proxy for EODHD data

// Simple browser-compatible EventEmitter implementation
class EventEmitter {
  private events: Record<string, Array<(...args: any[]) => void>> = {};

  on(event: string, listener: (...args: any[]) => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}

// Define the structure of stock update messages
export interface StockUpdate {
  s: string;         // Symbol
  p: number;         // Price
  t: number;         // Timestamp
  v: number;         // Volume
  c?: number[];      // OHLC data [open, high, low, close]
  dm?: string;       // Market/Exchange
  ch?: number;       // Change
  chp?: number;      // Change Percent
}

// Define WebSocket connection states
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private pingInterval: number | null = null;
  private subscriptions: Set<string> = new Set();
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 3000; // 3 seconds
  private readonly PING_INTERVAL = 30000; // 30 seconds
  private readonly eventEmitter = new EventEmitter();
  private clientId: string | null = null;
  
  // Get the WebSocket URL based on environment
  private getWebSocketUrl(): string {
    const isProduction = import.meta.env.PROD;
    const devUrl = 'ws://localhost:8000/api/ws/eodhd';
    const prodUrl = 'wss://fin-path-insight.deno.dev/api/ws/eodhd';
    
    return isProduction ? prodUrl : devUrl;
  }
  
  // Connect to the WebSocket server
  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }
    
    this.setConnectionState(ConnectionState.CONNECTING);
    
    try {
      const wsUrl = this.getWebSocketUrl();
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.setConnectionState(ConnectionState.ERROR);
      this.scheduleReconnect();
    }
  }
  
  // Disconnect from the WebSocket server
  public disconnect(): void {
    this.clearTimers();
    
    if (this.socket) {
      try {
        this.socket.close();
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      
      this.socket = null;
    }
    
    this.setConnectionState(ConnectionState.DISCONNECTED);
  }
  
  // Subscribe to stock symbols
  public subscribe(symbols: string[]): void {
    if (!symbols || symbols.length === 0) return;
    
    // Filter out symbols we're already subscribed to
    const newSymbols = symbols.filter(symbol => !this.subscriptions.has(symbol));
    if (newSymbols.length === 0) return;
    
    // Add to local subscriptions set
    newSymbols.forEach(symbol => this.subscriptions.add(symbol));
    
    // If connected, send subscription message
    if (this.isConnected()) {
      this.sendSubscriptionMessage(newSymbols);
    } else {
      // If not connected, connect first
      this.connect();
    }
  }
  
  // Unsubscribe from stock symbols
  public unsubscribe(symbols: string[]): void {
    if (!symbols || symbols.length === 0) return;
    
    // Filter to only include symbols we're actually subscribed to
    const symbolsToUnsubscribe = symbols.filter(symbol => this.subscriptions.has(symbol));
    if (symbolsToUnsubscribe.length === 0) return;
    
    // Remove from local subscriptions set
    symbolsToUnsubscribe.forEach(symbol => this.subscriptions.delete(symbol));
    
    // If connected, send unsubscription message
    if (this.isConnected()) {
      this.sendUnsubscriptionMessage(symbolsToUnsubscribe);
    }
  }
  
  // Check if connected to WebSocket server
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  // Get current connection state
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  // Add event listener
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
  
  // Remove event listener
  public off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
  
  // Handle WebSocket open event
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.setConnectionState(ConnectionState.CONNECTED);
    this.reconnectAttempts = 0;
    
    // Start ping interval to keep connection alive
    this.startPingInterval();
    
    // Resubscribe to all symbols
    if (this.subscriptions.size > 0) {
      this.sendSubscriptionMessage(Array.from(this.subscriptions));
    }
  }
  
  // Handle WebSocket message event
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      // Handle different message types
      if (data.type === 'connection_success') {
        this.clientId = data.clientId;
        this.eventEmitter.emit('connection', { state: ConnectionState.CONNECTED });
      } else if (data.type === 'subscription_success') {
        this.eventEmitter.emit('subscription', { symbols: data.symbols });
      } else if (data.type === 'unsubscription_success') {
        this.eventEmitter.emit('unsubscription', { symbols: data.symbols });
      } else if (data.type === 'error') {
        console.error('WebSocket error message:', data.message);
        this.eventEmitter.emit('error', { message: data.message });
      } else if (data.type === 'pong') {
        // Pong received, connection is alive
      } else if (data.s) {
        // This is a stock update
        this.eventEmitter.emit('stockUpdate', data as StockUpdate);
        // Also emit an event specific to this symbol
        this.eventEmitter.emit(`stockUpdate:${data.s}`, data as StockUpdate);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
  
  // Handle WebSocket error event
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.setConnectionState(ConnectionState.ERROR);
    this.eventEmitter.emit('error', { event });
  }
  
  // Handle WebSocket close event
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    this.socket = null;
    this.clearTimers();
    
    if (this.connectionState !== ConnectionState.DISCONNECTED) {
      this.setConnectionState(ConnectionState.RECONNECTING);
      this.scheduleReconnect();
    }
  }
  
  // Send subscription message to server
  private sendSubscriptionMessage(symbols: string[]): void {
    if (!this.isConnected() || symbols.length === 0) return;
    
    try {
      const message = {
        action: 'subscribe',
        symbols
      };
      
      this.socket!.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending subscription message:', error);
    }
  }
  
  // Send unsubscription message to server
  private sendUnsubscriptionMessage(symbols: string[]): void {
    if (!this.isConnected() || symbols.length === 0) return;
    
    try {
      const message = {
        action: 'unsubscribe',
        symbols
      };
      
      this.socket!.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending unsubscription message:', error);
    }
  }
  
  // Send ping message to keep connection alive
  private sendPing(): void {
    if (!this.isConnected()) return;
    
    try {
      const message = {
        action: 'ping',
        timestamp: Date.now()
      };
      
      this.socket!.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending ping message:', error);
    }
  }
  
  // Start ping interval
  private startPingInterval(): void {
    this.clearTimers();
    this.pingInterval = window.setInterval(() => this.sendPing(), this.PING_INTERVAL);
  }
  
  // Schedule reconnect with exponential backoff
  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      const delay = this.RECONNECT_DELAY * Math.pow(1.5, this.reconnectAttempts);
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.MAX_RECONNECT_ATTEMPTS})`);
      
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.setConnectionState(ConnectionState.ERROR);
      this.eventEmitter.emit('maxReconnectAttemptsReached');
    }
  }
  
  // Clear all timers
  private clearTimers(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  // Set connection state and emit event
  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.eventEmitter.emit('connectionStateChange', { state });
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
