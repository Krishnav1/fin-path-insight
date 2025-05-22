import React, { useState, useEffect } from 'react';
import { fetchStocks, fetchGainersLosers, fetchSectorPerformance } from '../../services/stockApi';
import './IndianStockDashboard.css';

const IndianStockDashboard = () => {
  const [marketIndices, setMarketIndices] = useState({});
  const [topGainersLosers, setTopGainersLosers] = useState({ gainers: [], losers: [] });
  const [sectorPerformance, setSectorPerformance] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState({
    indices: true,
    gainersLosers: true,
    sectors: true,
    search: false,
    stockData: false
  });
  const [error, setError] = useState({
    indices: null,
    gainersLosers: null,
    sectors: null,
    search: null,
    stockData: null
  });

  // Fetch market indices on component mount
  useEffect(() => {
    const fetchMarketIndices = async () => {
      try {
        // Use EODHD-backed API: fetch NIFTY, SENSEX, etc.
        const indices = ['^NSEI', '^BSESN'];
        const data = await fetchStocks({ symbols: indices, market: 'indian' });
        // Map to expected structure
        const mapped = {};
        indices.forEach((symbol, idx) => {
          mapped[symbol] = {
            company: { name: symbol === '^NSEI' ? 'NIFTY 50' : 'SENSEX' },
            currentPrice: data[idx]?.currentPrice,
            dayChangePct: data[idx]?.changePercent,
          };
        });
        setMarketIndices(mapped);
        setLoading(prev => ({ ...prev, indices: false }));
      } catch (err) {
        console.error('Error fetching market indices:', err);
        setError(prev => ({ ...prev, indices: 'Failed to load market indices' }));
        setLoading(prev => ({ ...prev, indices: false }));
      }
    };
    fetchMarketIndices();
  }, []);

  // Fetch top gainers and losers on component mount
  useEffect(() => {
    const fetchTopGainersLosersProd = async () => {
      try {
        const data = await fetchGainersLosers();
        setTopGainersLosers(data);
        setLoading(prev => ({ ...prev, gainersLosers: false }));
      } catch (err) {
        console.error('Error fetching top gainers and losers:', err);
        setError(prev => ({ ...prev, gainersLosers: 'Failed to load top gainers and losers' }));
        setLoading(prev => ({ ...prev, gainersLosers: false }));
      }
    };
    fetchTopGainersLosersProd();
  }, []);

  // Fetch sector performance on component mount
  useEffect(() => {
    const fetchSectorPerformanceProd = async () => {
      try {
        const data = await fetchSectorPerformance();
        setSectorPerformance(data);
        setLoading(prev => ({ ...prev, sectors: false }));
      } catch (err) {
        console.error('Error fetching sector performance:', err);
        setError(prev => ({ ...prev, sectors: 'Failed to load sector performance' }));
        setLoading(prev => ({ ...prev, sectors: false }));
      }
    };
    fetchSectorPerformanceProd();
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Search for stocks
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(prev => ({ ...prev, search: true }));
    setError(prev => ({ ...prev, search: null }));
    try {
      // For demo: search by symbol. In production, use a backend search endpoint or EODHD screener API.
      const data = await fetchStocks({ symbols: [searchQuery.toUpperCase() + '.NSE'], market: 'indian' });
      setSearchResults(data.map(stock => ({ ticker: stock.symbol, name: stock.name })));
      setLoading(prev => ({ ...prev, search: false }));
    } catch (err) {
      console.error('Error searching stocks:', err);
      setError(prev => ({ ...prev, search: 'Failed to search stocks' }));
      setLoading(prev => ({ ...prev, search: false }));
    }
  };


  // Fetch stock data when a stock is selected
  const handleStockSelect = async (ticker) => {
    setSelectedStock(ticker);
    setLoading(prev => ({ ...prev, stockData: true }));
    setError(prev => ({ ...prev, stockData: null }));
    try {
      const data = await fetchStocks({ symbols: [ticker], market: 'indian' });
      setStockData({
        company: { name: data[0]?.name, sector: 'N/A', industry: 'N/A', marketCap: null },
        currentPrice: data[0]?.currentPrice,
        dayChangePct: data[0]?.changePercent,
        history: [] // Optionally fetch and add history
      });
      setLoading(prev => ({ ...prev, stockData: false }));
    } catch (err) {
      console.error(`Error fetching data for ${ticker}:`, err);
      setError(prev => ({ ...prev, stockData: `Failed to load data for ${ticker}` }));
      setLoading(prev => ({ ...prev, stockData: false }));
    }
  };


  // Format percentage for display
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Format price for display
  const formatPrice = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  };

  // Render market indices
  const renderMarketIndices = () => {
    if (loading.indices) return <div className="loading">Loading market indices...</div>;
    if (error.indices) return <div className="error">{error.indices}</div>;
    
    return (
      <div className="market-indices">
        <h3>Market Indices</h3>
        <div className="indices-grid">
          {Object.entries(marketIndices).map(([symbol, data]) => {
            if (data.error) return null;
            
            return (
              <div key={symbol} className="index-card">
                <h4>{data.company?.name || symbol}</h4>
                <div className="index-price">{data.currentPrice ? formatPrice(data.currentPrice) : 'N/A'}</div>
                <div className={`index-change ${data.dayChangePct > 0 ? 'positive' : data.dayChangePct < 0 ? 'negative' : ''}`}>
                  {data.dayChangePct ? formatPercentage(data.dayChangePct) : 'N/A'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render top gainers and losers
  const renderTopGainersLosers = () => {
    if (loading.gainersLosers) return <div className="loading">Loading top gainers and losers...</div>;
    if (error.gainersLosers) return <div className="error">{error.gainersLosers}</div>;
    
    return (
      <div className="gainers-losers">
        <div className="gainers">
          <h3>Top Gainers</h3>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {topGainersLosers.gainers?.map((stock) => (
                <tr key={stock.ticker} onClick={() => handleStockSelect(stock.ticker)}>
                  <td>{stock.ticker}</td>
                  <td>{stock.name}</td>
                  <td>{formatPrice(stock.price)}</td>
                  <td className="positive">{formatPercentage(stock.changePct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="losers">
          <h3>Top Losers</h3>
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {topGainersLosers.losers?.map((stock) => (
                <tr key={stock.ticker} onClick={() => handleStockSelect(stock.ticker)}>
                  <td>{stock.ticker}</td>
                  <td>{stock.name}</td>
                  <td>{formatPrice(stock.price)}</td>
                  <td className="negative">{formatPercentage(stock.changePct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render sector performance
  const renderSectorPerformance = () => {
    if (loading.sectors) return <div className="loading">Loading sector performance...</div>;
    if (error.sectors) return <div className="error">{error.sectors}</div>;
    
    return (
      <div className="sector-performance">
        <h3>Sector Performance</h3>
        <div className="sectors-grid">
          {sectorPerformance.map((sector) => (
            <div 
              key={sector.sector} 
              className={`sector-card ${sector.changePct > 0 ? 'positive-bg' : sector.changePct < 0 ? 'negative-bg' : ''}`}
            >
              <h4>{sector.sector}</h4>
              <div className={`sector-change ${sector.changePct > 0 ? 'positive' : sector.changePct < 0 ? 'negative' : ''}`}>
                {formatPercentage(sector.changePct)}
              </div>
              <div className="sector-stocks">
                {sector.tickers.slice(0, 3).map(ticker => (
                  <span key={ticker} className="sector-stock" onClick={() => handleStockSelect(ticker.replace('.NS', ''))}>
                    {ticker.replace('.NS', '')}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render search results
  const renderSearchResults = () => {
    if (!searchQuery.trim() && searchResults.length === 0) return null;
    if (loading.search) return <div className="loading">Searching...</div>;
    if (error.search) return <div className="error">{error.search}</div>;
    
    return (
      <div className="search-results">
        <h3>Search Results</h3>
        {searchResults.length === 0 ? (
          <p>No stocks found matching "{searchQuery}"</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((stock) => (
                <tr key={stock.ticker} onClick={() => handleStockSelect(stock.ticker)}>
                  <td>{stock.ticker}</td>
                  <td>{stock.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  // Render stock details
  const renderStockDetails = () => {
    if (!selectedStock) return null;
    if (loading.stockData) return <div className="loading">Loading stock data...</div>;
    if (error.stockData) return <div className="error">{error.stockData}</div>;
    
    if (!stockData) return null;
    
    return (
      <div className="stock-details">
        <h3>{stockData.company?.name || selectedStock}</h3>
        <div className="stock-header">
          <div className="stock-price">{stockData.currentPrice ? formatPrice(stockData.currentPrice) : 'N/A'}</div>
          <div className={`stock-change ${stockData.dayChangePct > 0 ? 'positive' : stockData.dayChangePct < 0 ? 'negative' : ''}`}>
            {stockData.dayChangePct ? formatPercentage(stockData.dayChangePct) : 'N/A'}
          </div>
        </div>
        
        <div className="stock-info">
          <div className="info-item">
            <span className="label">Sector:</span>
            <span className="value">{stockData.company?.sector || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Industry:</span>
            <span className="value">{stockData.company?.industry || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Market Cap:</span>
            <span className="value">
              {stockData.company?.marketCap 
                ? (stockData.company.marketCap / 10000000).toFixed(2) + ' Cr' 
                : 'N/A'}
            </span>
          </div>
        </div>
        
        {stockData.history && stockData.history.length > 0 && (
          <div className="stock-history">
            <h4>Historical Data</h4>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Open</th>
                  <th>High</th>
                  <th>Low</th>
                  <th>Close</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {stockData.history.slice(-5).reverse().map((day) => (
                  <tr key={day.Date}>
                    <td>{new Date(day.Date).toLocaleDateString('en-IN')}</td>
                    <td>{day.Open.toFixed(2)}</td>
                    <td>{day.High.toFixed(2)}</td>
                    <td>{day.Low.toFixed(2)}</td>
                    <td>{day.Close.toFixed(2)}</td>
                    <td>{day.Volume.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="indian-stock-dashboard">
      <h2>Indian Stock Market Dashboard</h2>
      
      <div className="search-container">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search for Indian stocks..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button type="submit">Search</button>
        </form>
      </div>
      
      {renderSearchResults()}
      {renderStockDetails()}
      
      <div className="dashboard-grid">
        {renderMarketIndices()}
        {renderTopGainersLosers()}
        {renderSectorPerformance()}
      </div>
    </div>
  );
};

export default IndianStockDashboard;
