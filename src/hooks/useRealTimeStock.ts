// Custom hook for real-time stock data using WebSocket
import { useState, useEffect, useCallback } from 'react';
import webSocketService, { StockUpdate, ConnectionState } from '@/services/webSocketService';

interface RealTimeStockOptions {
  autoConnect?: boolean;
  onConnectionChange?: (state: ConnectionState) => void;
  onError?: (error: any) => void;
}

export interface RealTimeStockData {
  [symbol: string]: {
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: number;
    lastUpdated: Date;
  };
}

const useRealTimeStock = (
  symbols: string[] = [],
  options: RealTimeStockOptions = {}
) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    webSocketService.getConnectionState()
  );
  const [stockData, setStockData] = useState<RealTimeStockData>({});
  const [error, setError] = useState<string | null>(null);

  // Initialize with default options
  const { 
    autoConnect = true,
    onConnectionChange,
    onError 
  } = options;

  // Handle connection state changes
  useEffect(() => {
    const handleConnectionStateChange = ({ state }: { state: ConnectionState }) => {
      setConnectionState(state);
      if (onConnectionChange) {
        onConnectionChange(state);
      }
    };

    webSocketService.on('connectionStateChange', handleConnectionStateChange);

    return () => {
      webSocketService.off('connectionStateChange', handleConnectionStateChange);
    };
  }, [onConnectionChange]);

  // Handle errors
  useEffect(() => {
    const handleError = (err: any) => {
      setError(err.message || 'Unknown WebSocket error');
      if (onError) {
        onError(err);
      }
    };

    webSocketService.on('error', handleError);

    return () => {
      webSocketService.off('error', handleError);
    };
  }, [onError]);

  // Handle stock updates
  useEffect(() => {
    const handleStockUpdate = (update: StockUpdate) => {
      setStockData(prevData => {
        // Calculate change and change percent if not provided
        let change = update.ch;
        let changePercent = update.chp;

        // If change is not provided but we have previous data, calculate it
        if (change === undefined && prevData[update.s]) {
          change = update.p - prevData[update.s].price;
        }

        // If change percent is not provided but we have change and price, calculate it
        if (changePercent === undefined && change !== undefined && update.p) {
          const prevPrice = update.p - (change || 0);
          if (prevPrice !== 0) {
            changePercent = (change / prevPrice) * 100;
          }
        }

        // Ensure all values have proper defaults
        return {
          ...prevData,
          [update.s]: {
            price: typeof update.p === 'number' ? update.p : 0,
            change: typeof change === 'number' ? change : 0,
            changePercent: typeof changePercent === 'number' ? changePercent : 0,
            volume: typeof update.v === 'number' ? update.v : 0,
            timestamp: typeof update.t === 'number' ? update.t : Date.now(),
            lastUpdated: new Date()
          }
        };
      });
    };

    webSocketService.on('stockUpdate', handleStockUpdate);

    return () => {
      webSocketService.off('stockUpdate', handleStockUpdate);
    };
  }, []);

  // Subscribe to symbols
  useEffect(() => {
    if (symbols.length > 0) {
      // Auto-connect if specified
      if (autoConnect && webSocketService.getConnectionState() === ConnectionState.DISCONNECTED) {
        webSocketService.connect();
      }

      // Subscribe to symbols
      webSocketService.subscribe(symbols);
    }

    // Cleanup: unsubscribe when component unmounts or symbols change
    return () => {
      if (symbols.length > 0) {
        webSocketService.unsubscribe(symbols);
      }
    };
  }, [symbols, autoConnect]);

  // Connect/disconnect methods
  const connect = useCallback(() => {
    webSocketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  // Subscribe/unsubscribe methods
  const subscribe = useCallback((newSymbols: string[]) => {
    webSocketService.subscribe(newSymbols);
  }, []);

  const unsubscribe = useCallback((symbolsToRemove: string[]) => {
    webSocketService.unsubscribe(symbolsToRemove);
  }, []);

  return {
    connectionState,
    stockData,
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    isConnected: connectionState === ConnectionState.CONNECTED
  };
};

export default useRealTimeStock;
