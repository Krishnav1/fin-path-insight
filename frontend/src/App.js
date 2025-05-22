import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import IndianStockDashboard from './components/IndianStocks/IndianStockDashboard';
import CompanyAnalysisPage from './components/IndianStocks/CompanyAnalysisPage';
import IndianMarketPage from './components/IndianMarket/IndianMarketPage';
import USMarketPage from './components/Markets/USMarketPage';
import EuropeanMarketPage from './components/Markets/EuropeanMarketPage';
import ChinaMarketPage from './components/Markets/ChinaMarketPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [marketsDropdownOpen, setMarketsDropdownOpen] = useState(false);
  const [stocksDropdownOpen, setStocksDropdownOpen] = useState(false);
  const marketsDropdownRef = useRef(null);
  const stocksDropdownRef = useRef(null);

  // Function to handle stock selection
  const handleStockSelect = (symbol) => {
    setSelectedStock(symbol);
  };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (marketsDropdownRef.current && !marketsDropdownRef.current.contains(event.target)) {
        setMarketsDropdownOpen(false);
      }
      if (stocksDropdownRef.current && !stocksDropdownRef.current.contains(event.target)) {
        setStocksDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="logo">
            <Link to="/">FinPath Insight</Link>
          </div>
          <nav className="main-nav">
            <ul>
              <li><Link to="/dashboard">Dashboard</Link></li>
              
              {/* Markets Dropdown */}
              <li className="dropdown" ref={marketsDropdownRef}>
                <button 
                  className="dropdown-toggle" 
                  onClick={() => {
                    setMarketsDropdownOpen(!marketsDropdownOpen);
                    setStocksDropdownOpen(false);
                  }}
                >
                  Markets <span className="dropdown-arrow">▼</span>
                </button>
                {marketsDropdownOpen && (
                  <div className="dropdown-menu">
                    <Link to="/us-market" onClick={() => setMarketsDropdownOpen(false)}>US Market</Link>
                    <Link to="/european-market" onClick={() => setMarketsDropdownOpen(false)}>European Market</Link>
                    <Link to="/china-market" onClick={() => setMarketsDropdownOpen(false)}>China Market</Link>
                    <Link to="/indian-market" onClick={() => setMarketsDropdownOpen(false)}>Indian Market</Link>
                  </div>
                )}
              </li>
              
              {/* Stocks Dropdown */}
              <li className="dropdown" ref={stocksDropdownRef}>
                <button 
                  className="dropdown-toggle" 
                  onClick={() => {
                    setStocksDropdownOpen(!stocksDropdownOpen);
                    setMarketsDropdownOpen(false);
                  }}
                >
                  Stocks <span className="dropdown-arrow">▼</span>
                </button>
                {stocksDropdownOpen && (
                  <div className="dropdown-menu">
                    <Link to="/stocks" onClick={() => setStocksDropdownOpen(false)}>All Stocks</Link>
                    <Link to="/etfs" onClick={() => setStocksDropdownOpen(false)}>ETFs</Link>
                    <Link to="/crypto" onClick={() => setStocksDropdownOpen(false)}>Crypto</Link>
                    <Link to="/market-movers" onClick={() => setStocksDropdownOpen(false)}>Market Movers</Link>
                  </div>
                )}
              </li>
              
              {isAuthenticated ? (
                <li><Link to="/profile">Profile</Link></li>
              ) : (
                <li><Link to="/login">Login</Link></li>
              )}
            </ul>
          </nav>
        </header>

        <main className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<IndianStockDashboard onStockSelect={handleStockSelect} />} />
            <Route path="/stocks/:symbol" element={<CompanyAnalysisPage />} />
            
            {/* Market Pages */}
            <Route path="/indian-market" element={<IndianMarketPage />} />
            <Route path="/us-market" element={<USMarketPage />} />
            <Route path="/european-market" element={<EuropeanMarketPage />} />
            <Route path="/china-market" element={<ChinaMarketPage />} />
            
            {/* Placeholder routes for future development */}
            <Route path="/stocks" element={<div className="placeholder-page">All Stocks Page (Coming Soon)</div>} />
            <Route path="/etfs" element={<div className="placeholder-page">ETFs Page (Coming Soon)</div>} />
            <Route path="/crypto" element={<div className="placeholder-page">Crypto Page (Coming Soon)</div>} />
            <Route path="/market-movers" element={<div className="placeholder-page">Market Movers Page (Coming Soon)</div>} />
            
            <Route path="/login" element={<div>Login Page</div>} />
            <Route path="/profile" element={
              isAuthenticated ? <div>Profile Page</div> : <Navigate to="/login" />
            } />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} FinPath Insight. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
