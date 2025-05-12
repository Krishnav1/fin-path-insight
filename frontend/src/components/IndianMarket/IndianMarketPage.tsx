import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './IndianMarketPage.css'; // We'll create this CSS file next

// Define key indices to display
const KEY_INDICES_SYMBOLS = [
  'NIFTY 50',
  'NIFTY BANK',
  'NIFTY IT',
  'NIFTY NEXT 50',
  'INDIA VIX'
];

const IndianMarketPage = () => {
  const [marketStatus, setMarketStatus] = useState(null);
  const [overviewData, setOverviewData] = useState(null); // New state for overview data
  const [nifty50MoversData, setNifty50MoversData] = useState(null); // New state for NIFTY 50 gainers/losers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch market status (existing)
        const statusResponse = await axios.get('http://localhost:3002/api/indian-market/status');
        setMarketStatus(statusResponse.data);

        // Fetch market overview (new)
        const overviewResponse = await axios.get('http://localhost:3002/api/indian-market/overview');
        setOverviewData(overviewResponse.data);

        // Fetch NIFTY 50 Top Gainers/Losers (new)
        // Encode 'NIFTY 50' as 'NIFTY%2050' for the URL parameter
        const niftyMoversResponse = await axios.get('http://localhost:3002/api/indian-market/index-movers/NIFTY%2050?topN=5');
        setNifty50MoversData(niftyMoversResponse.data);

      } catch (err) {
        console.error('Error fetching Indian market data:', err);
        let errorMessage = 'Failed to fetch market data. Is the backend running on port 3002?';
        if (err.response && err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        setError(errorMessage);
        setMarketStatus(null);
        setOverviewData(null);
        setNifty50MoversData(null); // Reset on error
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="indian-market-page-container"><p>Loading Indian Market data...</p></div>;
  }

  if (error) {
    return <div className="indian-market-page-container"><p className="error-message">Error: {error}</p></div>;
  }

  if (!marketStatus) {
    return <div className="indian-market-page-container"><p>No market data available.</p></div>;
  }

  // Helper to render market segments (existing)
  const renderMarketSegments = () => {
    if (!marketStatus || !marketStatus.marketState || marketStatus.marketState.length === 0) {
      return <p>Market segment data not available.</p>;
    }
    return marketStatus.marketState.map((segment, index) => (
      <div key={index} className="market-segment-card">
        <h4>{segment.market}</h4>
        <p>Status: <span className={`status-${segment.marketStatus?.toLowerCase().replace(/\s+/g, '-')}`}>{segment.marketStatus}</span></p>
        <p>Message: {segment.marketStatusMessage}</p>
        {segment.index && <p>Index: {segment.index} - {segment.last} ({segment.percentChange}%)</p>}
        <p>Trade Date: {segment.tradeDate}</p>
      </div>
    ));
  };

  // Helper to render Key Market Indices (new)
  const renderKeyIndices = () => {
    if (!overviewData || !overviewData.indices || overviewData.indices.length === 0) {
      return <p>Key indices data not available.</p>;
    }
    const filteredIndices = overviewData.indices.filter(index => 
      KEY_INDICES_SYMBOLS.includes(index.indexSymbol)
    );

    if (filteredIndices.length === 0) {
      return <p>Selected key indices data not found. Available indices might have different symbols.</p>;
    }

    return filteredIndices.map((index, idx) => (
      <div key={idx} className="index-card card">
        <h4>{index.indexSymbol}</h4>
        <p>Last: <span className={index.variation >= 0 ? 'positive' : 'negative'}>{index.last.toLocaleString('en-IN')}</span></p>
        <p>Change: <span className={index.variation >= 0 ? 'positive' : 'negative'}>{index.variation.toFixed(2)} ({index.percentChange.toFixed(2)}%)</span></p>
        <p>Open: {index.open.toLocaleString('en-IN')} High: {index.high.toLocaleString('en-IN')} Low: {index.low.toLocaleString('en-IN')}</p>
      </div>
    ));
  };

  // Helper to render Market Breadth (new)
  const renderMarketBreadth = () => {
    if (!overviewData || !overviewData.marketBreadth) {
      return <p>Market breadth data not available.</p>;
    }
    const { advances, declines, unchanged } = overviewData.marketBreadth;
    return (
      <div className="market-breadth-card card">
        <h4>Market Breadth</h4>
        <p>Advances: <span className="positive">{advances}</span></p>
        <p>Declines: <span className="negative">{declines}</span></p>
        <p>Unchanged: <span>{unchanged}</span></p>
        {overviewData.timestamp && <p><em>As of: {new Date(overviewData.timestamp).toLocaleString()}</em></p>}
      </div>
    );
  };

  // Helper to render Top Gainers/Losers for an index (new)
  const renderIndexMovers = (moversData, title) => {
    if (!moversData) {
      return <p>{title} data loading or not available...</p>;
    }
    if (moversData.error) {
      return <p>Error loading {title}: {moversData.error}</p>;
    }
    if (!moversData.topGainers || !moversData.topLosers) {
        return <p>{title} data structure is not as expected.</p>;
    }

    return (
      <div className="index-movers-card card">
        <h3>{title} (from {moversData.indexName})</h3>
        <div className="movers-container">
          <div className="gainers-list">
            <h4>Top Gainers</h4>
            <ul>
              {moversData.topGainers.map((stock, idx) => (
                <li key={`gainer-${idx}`}>
                  {stock.symbol}: <span className="positive">{stock.lastPrice.toLocaleString('en-IN')} (+{stock.pChange.toFixed(2)}%)</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="losers-list">
            <h4>Top Losers</h4>
            <ul>
              {moversData.topLosers.map((stock, idx) => (
                <li key={`loser-${idx}`}>
                  {stock.symbol}: <span className="negative">{stock.lastPrice.toLocaleString('en-IN')} ({stock.pChange.toFixed(2)}%)</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {moversData.timestamp && <p className="timestamp"><em>As of: {new Date(moversData.timestamp).toLocaleString()}</em></p>}
      </div>
    );
  };

  return (
    <div className="indian-market-page-container">
      <header className="page-header">
        <h1>Indian Market Dashboard</h1>
        <p>Live data from National Stock Exchange of India (NSE)</p>
      </header>

      {/* Section for Key Market Indices - New */}
      <section className="key-indices-section">
        <h2>Key Market Indices</h2>
        <div className="indices-grid">
          {renderKeyIndices()}
        </div>
      </section>

      {/* Section for Market Breadth - New */}
      <section className="market-breadth-section">
        <h2>Overall Market Breadth</h2>
        {renderMarketBreadth()}
      </section>

      {/* Section for NIFTY 50 Top Gainers/Losers - New */}
      <section className="nifty50-movers-section">
        <h2>NIFTY 50 Movers</h2>
        {renderIndexMovers(nifty50MoversData, 'Top 5 Gainers & Losers')}
      </section>

      {/* Existing Market Status Section - keep if still relevant */}
      {marketStatus && marketStatus.marketState && (
        <section className="market-status-section">
          <h2>Segment Status</h2>
          <div className="market-segments-grid">
            {renderMarketSegments()}
          </div>
        </section>
      )}

      {/* Other existing sections - keep if still relevant */}
      {marketStatus && marketStatus.indicativenifty50 && (
        <section className="nifty50-overview-section card">
          <h3>NIFTY 50 Snapshot</h3>
          <p><strong>Last:</strong> {marketStatus.indicativenifty50.finalClosingValue || marketStatus.indicativenifty50.closingValue}</p>
          <p><strong>Change:</strong> {marketStatus.indicativenifty50.change}</p>
          <p><strong>% Change:</strong> {marketStatus.indicativenifty50.perChange}%</p>
          <p><strong>Status:</strong> {marketStatus.indicativenifty50.status}</p>
          <p><em>As of: {marketStatus.indicativenifty50.dateTime}</em></p>
        </section>
      )}

      {marketStatus && marketStatus.marketcap && (
        <section className="market-cap-section card">
          <h3>Market Capitalization</h3>
          <p>{marketStatus.marketcap.marketCapinLACCRRupeesFormatted} Lakh Crore Rupees</p>
          <p>({marketStatus.marketcap.marketCapinTRDollars} Trillion USD)</p>
          <p><em>As of: {marketStatus.marketcap.timeStamp}</em></p>
        </section>
      )}
      
      {/* TODO: Add sections for Top Gainers/Losers, Sector Performance, etc. once backend is ready */}
      <footer className="page-footer">
        <p>Disclaimer: Data is sourced from nseindia.com via nse-data package. Delays may occur. For informational purposes only.</p>
      </footer>
    </div>
  );
};

export default IndianMarketPage;
