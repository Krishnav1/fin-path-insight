import React, { useState } from 'react';
import MarketPage from './MarketPage';

const EuropeanMarketPage = () => {
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
        marketName="European Market"
        marketId="european"
        description="Comprehensive data and insights for European stock markets, featuring major indices like DAX, FTSE 100, and Euro Stoxx 50."
        currencySymbol="€"
        enableRealtime={realtimeEnabled}
      />
    </>
  );
};

export default EuropeanMarketPage;
