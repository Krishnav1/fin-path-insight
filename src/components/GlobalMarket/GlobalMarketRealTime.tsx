import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import useRealTimeStock from '@/hooks/useRealTimeStock';
import { ConnectionState } from '@/services/webSocketService';

// Sample symbols for US and European markets
const US_SYMBOLS = ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT'];
const EU_SYMBOLS = ['BMW.XETRA', 'AIR.PARIS', 'NESN.SWISS', 'SAN.MC', 'VOD.L', 'BP.L', 'HSBA.L'];

interface StockDisplayProps {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: Date | null;
}

const StockDisplay: React.FC<StockDisplayProps> = ({ symbol, price, change, changePercent, lastUpdated }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="border rounded-lg p-3 flex justify-between items-center">
      <div>
        <div className="font-semibold">{symbol}</div>
        <div className="text-sm text-gray-500">
          {lastUpdated ? `Updated: ${lastUpdated.toLocaleTimeString()}` : 'No updates yet'}
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold">${(price || 0).toFixed(2)}</div>
        <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
          {(change || 0).toFixed(2)} ({(changePercent || 0).toFixed(2)}%)
        </div>
      </div>
    </div>
  );
};

const GlobalMarketRealTime: React.FC = () => {
  const [usSymbols] = useState<string[]>(US_SYMBOLS);
  const [euSymbols] = useState<string[]>(EU_SYMBOLS);
  const [realTimeEnabled, setRealTimeEnabled] = useState<boolean>(true);
  
  // Use the real-time stock hook with all symbols
  const { 
    connectionState,
    stockData,
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    isConnected
  } = useRealTimeStock([...usSymbols, ...euSymbols], {
    autoConnect: true,
    onConnectionChange: (state) => {
      console.log('WebSocket connection state changed:', state);
    },
    onError: (err) => {
      console.error('WebSocket error:', err);
    }
  });
  
  // Toggle real-time updates
  const toggleRealTime = () => {
    if (realTimeEnabled) {
      disconnect();
    } else {
      connect();
      // Resubscribe to all symbols
      subscribe([...usSymbols, ...euSymbols]);
    }
    setRealTimeEnabled(!realTimeEnabled);
  };
  
  // Get stock data for display with additional safety checks
  const getStockDisplayProps = (symbol: string): StockDisplayProps => {
    const data = stockData[symbol];
    if (data) {
      return {
        symbol,
        price: typeof data.price === 'number' ? data.price : 0,
        change: typeof data.change === 'number' ? data.change : 0,
        changePercent: typeof data.changePercent === 'number' ? data.changePercent : 0,
        lastUpdated: data.lastUpdated instanceof Date ? data.lastUpdated : null
      };
    }
    
    // Default values if no data available
    return {
      symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      lastUpdated: null
    };
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Global Markets (Real-Time)</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="mr-2 text-sm">Real-time:</span>
            <div 
              className={`w-3 h-3 rounded-full mr-1 ${isConnected && realTimeEnabled ? 'bg-green-500' : 'bg-gray-400'}`} 
              title={connectionState}
            ></div>
            <button 
              onClick={toggleRealTime} 
              className={`text-xs px-2 py-1 rounded flex items-center ${realTimeEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
            >
              {realTimeEnabled ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {realTimeEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="text-xs text-gray-500">
            {connectionState === ConnectionState.CONNECTED ? 'Connected' : 
             connectionState === ConnectionState.CONNECTING ? 'Connecting...' :
             connectionState === ConnectionState.RECONNECTING ? 'Reconnecting...' :
             connectionState === ConnectionState.ERROR ? 'Connection Error' : 'Disconnected'}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* US Market Card */}
        <Card>
          <CardHeader>
            <CardTitle>US Market</CardTitle>
            <CardDescription>Real-time stock prices from US exchanges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usSymbols.map(symbol => (
                <StockDisplay 
                  key={symbol} 
                  {...getStockDisplayProps(symbol)} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* European Market Card */}
        <Card>
          <CardHeader>
            <CardTitle>European Market</CardTitle>
            <CardDescription>Real-time stock prices from European exchanges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {euSymbols.map(symbol => (
                <StockDisplay 
                  key={symbol} 
                  {...getStockDisplayProps(symbol)} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        Data provided by EODHD WebSocket API. Last connection attempt: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default GlobalMarketRealTime;
