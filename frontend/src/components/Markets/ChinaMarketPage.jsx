import React, { useState } from 'react';
import MarketPage from './MarketPage';

const ChinaMarketPage = () => {
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  
  return (
    <>
      <div className="realtime-toggle-container">
        <label className="realtime-toggle">
          <input 
            type="checkbox" 
            checked={realtimeEnabled} 
            onChange={() => setRealtimeEnabled(!realtimeEnabled)}
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">Enable Real-time Updates</span>
        </label>
      </div>
      <MarketPage
        marketName="China Market"
        marketId="china"
        description="Explore real-time data from Chinese stock markets, including major indices like SSE Composite, SZSE Component, and Hang Seng."
        currencySymbol="¥"
        enableRealtime={realtimeEnabled}
      />
    </>
  );
};

export default ChinaMarketPage;
