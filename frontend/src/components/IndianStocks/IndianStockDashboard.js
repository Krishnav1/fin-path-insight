import React, { useState, useEffect } from 'react';
import { fetchStocks, fetchGainersLosers, fetchSectorPerformance, fetchIndianMarketStocks } from '../../services/stockApi';
import './IndianStockDashboard.css';

const IndianStockDashboard = () => {
  const [marketIndices, setMarketIndices] = useState({});
  const [topGainersLosers, setTopGainersLosers] = useState({ gainers: [], losers: [] });
  const [sectorPerformance, setSectorPerformance] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [indianStocks, setIndianStocks] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(20);
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

  // Fetch Indian market stocks on mount and when search/displayLimit changes
  useEffect(() => {
    const fetchMarket = async () => {
      setLoading(prev => ({ ...prev, indices: true }));
      try {
        const stocks = await fetchIndianMarketStocks({ search: searchQuery, limit: displayLimit });
        setIndianStocks(stocks);
        // Optionally, map indices for NIFTY/SENSEX
        const mapped = {};
        stocks.forEach(stock => {
          if (stock.symbol === '^NSEI') mapped['^NSEI'] = { company: { name: 'NIFTY 50' }, currentPrice: stock.currentPrice, dayChangePct: stock.changePercent };
          else if (stock.symbol === '^BSESN') mapped['^BSESN'] = { company: { name: 'SENSEX' }, currentPrice: stock.currentPrice, dayChangePct: stock.changePercent };
        });
        setMarketIndices(mapped);
        setLoading(prev => ({ ...prev, indices: false }));
      } catch (err) {
        console.error('Error fetching Indian market stocks:', err);
        setError(prev => ({ ...prev, indices: 'Failed to load Indian market stocks' }));
        setLoading(prev => ({ ...prev, indices: false }));
      }
    };
    fetchMarket();
  }, [searchQuery, displayLimit]);

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
    setDisplayLimit(20); // Reset pagination on new search
  };

  // Load more stocks
  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + 20);
  };


  // Fetch stock data when a stock is selected
  const handleStockSelect = async (ticker) => {
    setSelectedStock(ticker);
    setLoading(prev => ({ ...prev, stockData: true }));
    setError(prev => ({ ...prev, stockData: null }));
    try {
      // Use fetchIndianMarketStocks for single stock (search param)
      const data = await fetchIndianMarketStocks({ search: ticker, limit: 1 });
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

  // Render Indian stocks table
  const renderIndianStocksTable = () => {
    if (loading.indices) return <div className="loading">Loading stocks...</div>;
    if (error.indices) return <div className="error">{error.indices}</div>;
    if (!indianStocks.length) return <div className="no-results">No stocks found{searchQuery ? ` for "${searchQuery}"` : ''}.</div>;

    return (
      <div className="indian-stocks-table">
        <table className="themed-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>Price</th>
              <th>Change</th>
              <th>Change %</th>
              <th>Volume</th>
            </tr>
          </thead>
          <tbody>
            {indianStocks.map(stock => (
              <tr key={stock.symbol} onClick={() => handleStockSelect(stock.symbol)} className="stock-row">
                <td>{stock.symbol}</td>
                <td>{stock.name}</td>
                <td>{formatPrice(stock.currentPrice)}</td>
                <td className={stock.change > 0 ? 'positive' : stock.change < 0 ? 'negative' : ''}>{stock.change}</td>
                <td className={stock.changePercent > 0 ? 'positive' : stock.changePercent < 0 ? 'negative' : ''}>{formatPercentage(stock.changePercent)}</td>
                <td>{stock.volume?.toLocaleString('en-IN') || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-controls">
          {indianStocks.length === displayLimit && (
            <button className="load-more" onClick={handleLoadMore}>Load More</button>
          )}
        </div>
      </div>
    );
  };

  // --- END TABLE RENDER ---

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
