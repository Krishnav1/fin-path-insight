import React, { useState } from 'react';
import MarketPage from './MarketPage';

const USMarketPage = () => {
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
        marketName="US Market"
        marketId="us"
        description="Real-time data and analysis for the United States stock market, including major indices like S&P 500, NASDAQ, and Dow Jones."
        currencySymbol="$"
        enableRealtime={realtimeEnabled}
      />
    </>
  );
};

export default USMarketPage;
