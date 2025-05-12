import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import IndianStockDashboard from './components/IndianStocks/IndianStockDashboard';
import CompanyAnalysisPage from './components/IndianStocks/CompanyAnalysisPage';
import IndianMarketPage from './components/IndianMarket/IndianMarketPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  // Function to handle stock selection
  const handleStockSelect = (symbol) => {
    setSelectedStock(symbol);
  };

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
              <li><Link to="/stocks">Stocks</Link></li>
              <li><Link to="/indian-market">Indian Market</Link></li>
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
            <Route path="/indian-market" element={<IndianMarketPage />} />
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
