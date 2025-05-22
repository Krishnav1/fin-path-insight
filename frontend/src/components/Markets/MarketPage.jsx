import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchMarketStocks, fetchMarketIndices } from '../../services/stockApi';
import websocketService from '../../services/websocketService';
import './MarketPage.css';

const MarketPage = ({ 
  marketName, 
  marketId, 
  description, 
  currencySymbol = '$',
  defaultIndices = [],
  enableRealtime = false
}) => {
  const [marketIndices, setMarketIndices] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState({
    indices: true,
    stocks: true
  });
  const [error, setError] = useState({
    indices: null,
    stocks: null
  });

  // Connect to WebSocket if real-time updates are enabled
  useEffect(() => {
    if (enableRealtime) {
      // Connect to WebSocket server
      const marketIdentifierMap = {
        'us': 'us',
        'indian': 'nse', // National Stock Exchange for India
        'european': 'euronext', // Defaulting to Euronext, adjust as needed (e.g., 'lse' for London)
        'china': 'sse', // Example: Shanghai Stock Exchange - verify EODHD support and code
        // Add other mappings as necessary
      };
      const identifier = marketIdentifierMap[marketId.toLowerCase()];
      if (!identifier) {
        console.error(`No WebSocket market identifier for marketId: ${marketId}`);
        return; // Don't try to connect if identifier is missing
      }
      const wsUrl = `wss://ydakwyplcqoshxcdllah.supabase.co/functions/v1/websocket-relay/${identifier}`;
      websocketService.connect(wsUrl)
        .then(() => {
          console.log(`WebSocket connected for ${marketName}`);
        })
        .catch(error => {
          console.error(`WebSocket connection error for ${marketName}:`, error);
        });
    }

    return () => {
      // Disconnect from WebSocket when component unmounts
      if (enableRealtime && websocketService.isConnected) {
        websocketService.disconnect();
      }
    };
  }, [enableRealtime, marketName]);

  // Fetch market indices and top stocks on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(prev => ({ ...prev, indices: true }));
        setError(prev => ({ ...prev, indices: null }));
        
        // Fetch market indices
        const indicesData = await fetchMarketIndices(marketId);
        setMarketIndices(indicesData);
        
        // Subscribe to real-time updates for indices if enabled
        if (enableRealtime && websocketService.isConnected) {
          indicesData.forEach(index => {
            websocketService.subscribe(index.symbol, (data) => {
              // Update the index with real-time data
              setMarketIndices(prevIndices => {
                return prevIndices.map(prevIndex => {
                  if (prevIndex.symbol === data.s) {
                    return {
                      ...prevIndex,
                      price: data.p || data.close || prevIndex.price,
                      change: data.change || (data.p ? data.p - prevIndex.price : prevIndex.change),
                      changePercent: data.changePercent || data.change_p || prevIndex.changePercent,
                      lastUpdated: new Date().toISOString()
                    };
                  }
                  return prevIndex;
                });
              });
            });
          });
        }
      } catch (err) {
        console.error(`Error fetching ${marketName} indices:`, err);
        setError(prev => ({ 
          ...prev, 
          indices: `Failed to load ${marketName} indices. ${err.message}` 
        }));
      } finally {
        setLoading(prev => ({ ...prev, indices: false }));
      }

      try {
        setLoading(prev => ({ ...prev, stocks: true }));
        setError(prev => ({ ...prev, stocks: null }));
        
        // Fetch top stocks for this market
        const stocksData = await fetchMarketStocks(marketId, { limit: 50 });
        setStocks(stocksData);
        setFilteredStocks(stocksData);
        
        // Subscribe to real-time updates for stocks if enabled
        if (enableRealtime && websocketService.isConnected) {
          // Subscribe to top 10 stocks for real-time updates
          stocksData.slice(0, 10).forEach(stock => {
            websocketService.subscribe(stock.symbol, (data) => {
              // Update the stock with real-time data
              setStocks(prevStocks => {
                const updatedStocks = prevStocks.map(prevStock => {
                  if (prevStock.symbol === data.s) {
                    return {
                      ...prevStock,
                      currentPrice: data.p || data.close || prevStock.currentPrice,
                      change: data.change || (data.p ? data.p - prevStock.currentPrice : prevStock.change),
                      changePercent: data.changePercent || data.change_p || prevStock.changePercent,
                      volume: data.v || data.volume || prevStock.volume,
                      lastUpdated: new Date().toISOString()
                    };
                  }
                  return prevStock;
                });
                
                // Also update filtered stocks
                setFilteredStocks(prevFiltered => {
                  if (!searchQuery) return updatedStocks;
                  
                  const query = searchQuery.toLowerCase();
                  return updatedStocks.filter(
                    stock => 
                      stock.symbol.toLowerCase().includes(query) || 
                      stock.name.toLowerCase().includes(query)
                  );
                });
                
                return updatedStocks;
              });
            });
          });
        }
      } catch (err) {
        console.error(`Error fetching ${marketName} stocks:`, err);
        setError(prev => ({ 
          ...prev, 
          stocks: `Failed to load ${marketName} stocks. ${err.message}` 
        }));
      } finally {
        setLoading(prev => ({ ...prev, stocks: false }));
      }
    };

    fetchData();
  }, [marketId, marketName]);

  // Filter stocks based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStocks(stocks);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = stocks.filter(
      stock => 
        stock.symbol.toLowerCase().includes(query) || 
        stock.name.toLowerCase().includes(query)
    );
    setFilteredStocks(filtered);
  }, [searchQuery, stocks]);

  // Format price with currency symbol
  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'N/A';
    return `${currencySymbol}${price.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  // Format percentage for display
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Render market indices section
  const renderMarketIndices = () => {
    if (loading.indices) {
      return <div className="loading-message">Loading market indices...</div>;
    }

    if (error.indices) {
      return <div className="error-message">{error.indices}</div>;
    }

    if (!marketIndices || marketIndices.length === 0) {
      return <div className="info-message">No market indices available.</div>;
    }

    return (
      <div className="indices-grid">
        {marketIndices.map((index, idx) => (
          <div key={idx} className="index-card">
            <h4>{index.name}</h4>
            <div className="index-price">{formatPrice(index.price)}</div>
            <div className={`index-change ${index.changePercent > 0 ? 'positive' : index.changePercent < 0 ? 'negative' : ''}`}>
              {formatPercentage(index.changePercent)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render stocks table
  const renderStocksTable = () => {
    if (loading.stocks) {
      return <div className="loading-message">Loading stocks...</div>;
    }

    if (error.stocks) {
      return <div className="error-message">{error.stocks}</div>;
    }

    if (!filteredStocks || filteredStocks.length === 0) {
      return <div className="info-message">No stocks found matching your criteria.</div>;
    }

    return (
      <div className="stocks-table-container">
        <table className="stocks-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>Price</th>
              <th>Change</th>
              <th>% Change</th>
              <th>Volume</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.map((stock, index) => (
              <tr key={index} className={stock.changePercent > 0 ? 'positive-row' : stock.changePercent < 0 ? 'negative-row' : ''}>
                <td className="symbol-cell">{stock.symbol}</td>
                <td className="name-cell">{stock.name}</td>
                <td>{formatPrice(stock.currentPrice)}</td>
                <td className={stock.change > 0 ? 'positive' : stock.change < 0 ? 'negative' : ''}>
                  {stock.change ? formatPrice(stock.change) : 'N/A'}
                </td>
                <td className={stock.changePercent > 0 ? 'positive' : stock.changePercent < 0 ? 'negative' : ''}>
                  {formatPercentage(stock.changePercent)}
                </td>
                <td>{stock.volume ? stock.volume.toLocaleString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="market-page-container">
      <div className="page-header">
        <h1>{marketName}</h1>
        <p>{description}</p>
        {enableRealtime && websocketService.isConnected && (
          <div className="realtime-badge">Real-time Updates Active</div>
        )}
      </div>

      <section className="market-indices-section">
        <h2>Market Indices</h2>
        {renderMarketIndices()}
      </section>

      <section className="stocks-section">
        <h2>Top Stocks</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder={`Search ${marketName} stocks...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        {renderStocksTable()}
      </section>
    </div>
  );
};

export default MarketPage;
