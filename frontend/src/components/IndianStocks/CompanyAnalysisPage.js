import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CompanyAiAnalysis from './CompanyAiAnalysis';
import './CompanyAnalysisPage.css';

const CompanyAnalysisPage = ({ symbol }) => {
  const [companyData, setCompanyData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('1y');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchCompanyData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch detailed company data with accurate NSE prices
        const response = await axios.get(`/api/indian-stocks/${symbol}?period=${timeframe}`);
        
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        
        setCompanyData(response.data);
        
        if (response.data.history && response.data.history.length > 0) {
          setHistoricalData(response.data.history);
        }
        
        setLoading(false);
      } catch (err) {
        console.error(`Error fetching data for ${symbol}:`, err);
        setError(`Failed to load data for ${symbol}. ${err.message}`);
        setLoading(false);
      }
    };

    if (symbol) {
      fetchCompanyData();
    }
  }, [symbol, timeframe]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  // Format price for display
  const formatPrice = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString('en-IN', { 
      style: 'currency', 
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format percentage for display
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Format large numbers (like market cap) in crores
  const formatInCrores = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const crores = value / 10000000;
    if (crores >= 100000) {
      return `₹${(crores / 100000).toFixed(2)} Lakh Cr`;
    }
    return `₹${crores.toFixed(2)} Cr`;
  };

  // Format volume in lakhs
  const formatVolume = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const lakhs = value / 100000;
    if (lakhs >= 100) {
      return `${(lakhs / 100).toFixed(2)} Cr`;
    }
    return `${lakhs.toFixed(2)} Lakh`;
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  if (loading) {
    return (
      <div className="company-analysis-loading">
        <div className="loader"></div>
        <p>Loading company data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="company-analysis-error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="company-analysis-error">
        <h3>No Data Available</h3>
        <p>Could not find data for {symbol}</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    );
  }

  const renderTabContent = () => {
    switch(activeTab) {
      case 'ai-analysis':
        return <CompanyAiAnalysis companyData={companyData} />;
      case 'overview':
      default:
        return (
          <div className="company-analysis-grid">
            <div className="company-info-card">
              <h3>Company Overview</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Market Cap</span>
                  <span className="info-value">{companyData.company?.marketCap ? formatInCrores(companyData.company.marketCap) : 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">52-Week High</span>
                  <span className="info-value">
                    {historicalData.length > 0 
                      ? formatPrice(Math.max(...historicalData.map(day => day.High))) 
                      : 'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">52-Week Low</span>
                  <span className="info-value">
                    {historicalData.length > 0 
                      ? formatPrice(Math.min(...historicalData.map(day => day.Low))) 
                      : 'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Average Volume</span>
                  <span className="info-value">
                    {historicalData.length > 0 
                      ? formatVolume(historicalData.reduce((sum, day) => sum + day.Volume, 0) / historicalData.length) 
                      : 'N/A'}
                  </span>
                </div>
                {companyData.company?.website && (
                  <div className="info-item full-width">
                    <span className="info-label">Website</span>
                    <span className="info-value">
                      <a href={companyData.company.website} target="_blank" rel="noopener noreferrer">
                        {companyData.company.website}
                      </a>
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="price-history-card">
              <h3>Price History</h3>
              <div className="price-history-table-container">
                <table className="price-history-table">
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
                    {historicalData.slice(-10).reverse().map((day, index) => (
                      <tr key={index}>
                        <td>{formatDate(day.Date)}</td>
                        <td>{day.Open.toFixed(2)}</td>
                        <td>{day.High.toFixed(2)}</td>
                        <td>{day.Low.toFixed(2)}</td>
                        <td className={day.Close > day.Open ? 'positive' : day.Close < day.Open ? 'negative' : ''}>
                          {day.Close.toFixed(2)}
                        </td>
                        <td>{formatVolume(day.Volume)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="trading-summary-card">
              <h3>Trading Summary</h3>
              <div className="trading-summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Today's Open</span>
                  <span className="summary-value">
                    {historicalData.length > 0 
                      ? historicalData[historicalData.length - 1].Open.toFixed(2) 
                      : 'N/A'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Today's High</span>
                  <span className="summary-value">
                    {historicalData.length > 0 
                      ? historicalData[historicalData.length - 1].High.toFixed(2) 
                      : 'N/A'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Today's Low</span>
                  <span className="summary-value">
                    {historicalData.length > 0 
                      ? historicalData[historicalData.length - 1].Low.toFixed(2) 
                      : 'N/A'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Today's Volume</span>
                  <span className="summary-value">
                    {historicalData.length > 0 
                      ? formatVolume(historicalData[historicalData.length - 1].Volume) 
                      : 'N/A'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Previous Close</span>
                  <span className="summary-value">
                    {historicalData.length > 1 
                      ? historicalData[historicalData.length - 2].Close.toFixed(2) 
                      : 'N/A'}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Period Change</span>
                  <span className={`summary-value ${companyData.periodChangePct > 0 ? 'positive' : companyData.periodChangePct < 0 ? 'negative' : ''}`}>
                    {formatPercentage(companyData.periodChangePct)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="company-analysis-page">
      <div className="company-header">
        <div className="company-name-section">
          <h1>{companyData.company?.name || symbol}</h1>
          <p className="company-ticker">{symbol}.NS</p>
          <div className="company-sector-industry">
            <span className="company-sector">{companyData.company?.sector || 'N/A'}</span>
            {companyData.company?.industry && (
              <>
                <span className="separator">•</span>
                <span className="company-industry">{companyData.company.industry}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="company-price-section">
          <div className="current-price">{formatPrice(companyData.currentPrice)}</div>
          <div className={`price-change ${companyData.dayChangePct > 0 ? 'positive' : companyData.dayChangePct < 0 ? 'negative' : ''}`}>
            {formatPercentage(companyData.dayChangePct)}
          </div>
          <div className="price-updated">
            Last Updated: {new Date().toLocaleTimeString('en-IN')}
          </div>
        </div>
      </div>
      
      <div className="company-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'ai-analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-analysis')}
        >
          AI Analysis
        </button>
      </div>
      
      <div className="timeframe-selector">
        <button 
          className={timeframe === '1d' ? 'active' : ''} 
          onClick={() => handleTimeframeChange('1d')}
        >
          1D
        </button>
        <button 
          className={timeframe === '5d' ? 'active' : ''} 
          onClick={() => handleTimeframeChange('5d')}
        >
          5D
        </button>
        <button 
          className={timeframe === '1mo' ? 'active' : ''} 
          onClick={() => handleTimeframeChange('1mo')}
        >
          1M
        </button>
        <button 
          className={timeframe === '3mo' ? 'active' : ''} 
          onClick={() => handleTimeframeChange('3mo')}
        >
          3M
        </button>
        <button 
          className={timeframe === '6mo' ? 'active' : ''} 
          onClick={() => handleTimeframeChange('6mo')}
        >
          6M
        </button>
        <button 
          className={timeframe === '1y' ? 'active' : ''} 
          onClick={() => handleTimeframeChange('1y')}
        >
          1Y
        </button>
        <button 
          className={timeframe === '5y' ? 'active' : ''} 
          onClick={() => handleTimeframeChange('5y')}
        >
          5Y
        </button>
      </div>
      
      {renderTabContent()}
      
      <div className="disclaimer">
        <p>
          <strong>Disclaimer:</strong> The stock data displayed on this page is sourced from Yahoo Finance via the yfinance API. 
          Prices are delayed and should be used for informational purposes only. For the most accurate and up-to-date pricing, 
          please refer to the official NSE website or your broker's platform. Investment decisions should not be made solely 
          based on the information provided here.
        </p>
      </div>
    </div>
  );
};

export default CompanyAnalysisPage;
