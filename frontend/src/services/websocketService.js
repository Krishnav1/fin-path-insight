/**
 * WebSocket Service for Real-Time Market Data
 * 
 * This service establishes a WebSocket connection to our backend relay,
 * which securely connects to EODHD's WebSocket API without exposing API keys.
 */

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 seconds
    this.subscriptions = new Map(); // Symbol -> callback map
    this.messageHandlers = new Map(); // Event type -> handler function
  }

  /**
   * Connect to the WebSocket server
   * @param {string} url - WebSocket server URL
   * @returns {Promise} - Resolves when connected
   */
  connect(url) {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(url);
        
        this.socket.onopen = () => {
          console.log('WebSocket connection established');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.socket.onclose = (event) => {
          console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
          this.isConnected = false;
          this._attemptReconnect(url);
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
        
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this._handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Subscribe to updates for a specific symbol
   * @param {string} symbol - Stock/index symbol
   * @param {Function} callback - Function to call when updates are received
   */
  subscribe(symbol, callback) {
    if (!this.isConnected) {
      console.warn('WebSocket not connected. Cannot subscribe.');
      return;
    }
    
    // Store callback for this symbol
    this.subscriptions.set(symbol, callback);
    
    // Send subscription message to server
    this.socket.send(JSON.stringify({
      action: 'subscribe',
      symbols: symbol
    }));
  }

  /**
   * Unsubscribe from updates for a specific symbol
   * @param {string} symbol - Stock/index symbol
   */
  unsubscribe(symbol) {
    if (!this.isConnected) {
      console.warn('WebSocket not connected. Cannot unsubscribe.');
      return;
    }
    
    // Remove callback for this symbol
    this.subscriptions.delete(symbol);
    
    // Send unsubscription message to server
    this.socket.send(JSON.stringify({
      action: 'unsubscribe',
      symbols: symbol
    }));
  }

  /**
   * Register a handler for a specific message type
   * @param {string} type - Message type
   * @param {Function} handler - Handler function
   */
  registerHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.subscriptions.clear();
    }
  }

  /**
   * Handle incoming WebSocket messages
   * @private
   * @param {Object} data - Parsed message data
   */
  _handleMessage(data) {
    // If the data has a symbol property, it's a stock update
    if (data.s) {
      const symbol = data.s;
      const callback = this.subscriptions.get(symbol);
      
      if (callback) {
        callback(data);
      }
    } 
    // Otherwise, check for registered handlers
    else if (data.type && this.messageHandlers.has(data.type)) {
      const handler = this.messageHandlers.get(data.type);
      handler(data);
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   * @private
   * @param {string} url - WebSocket server URL
   */
  _attemptReconnect(url) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    
    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect(url).catch(() => {
        // Error handling is done in the connect method
      });
    }, this.reconnectDelay);
  }
}

// Create and export a singleton instance
const websocketService = new WebSocketService();
export default websocketService;
