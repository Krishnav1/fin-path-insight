import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './CompanyAiAnalysis.css';

// Rating badge component for investment recommendation
const RatingBadge = ({ rating }) => {
  let badgeClass = '';
  let icon = '';
  
  if (rating.includes('BUY') || rating.includes('Buy')) {
    badgeClass = 'rating-buy';
    icon = '↑';
  } else if (rating.includes('SELL') || rating.includes('Sell')) {
    badgeClass = 'rating-sell';
    icon = '↓';
  } else if (rating.includes('HOLD') || rating.includes('Hold')) {
    badgeClass = 'rating-hold';
    icon = '→';
  } else {
    badgeClass = 'rating-neutral';
    icon = '•';
  }
  
  return (
    <div className={`rating-badge ${badgeClass}`}>
      <span className="rating-icon">{icon}</span>
      <span className="rating-text">{rating}</span>
    </div>
  );
};

// Risk profile component
const RiskProfile = ({ profile }) => {
  let riskLevel = 'moderate';
  
  if (profile && typeof profile === 'string') {
    if (profile.toLowerCase().includes('conservative') || profile.toLowerCase().includes('low')) {
      riskLevel = 'low';
    } else if (profile.toLowerCase().includes('aggressive') || profile.toLowerCase().includes('high')) {
      riskLevel = 'high';
    }
  }
  
  return (
    <div className="risk-profile">
      <div className="risk-label">Risk Profile:</div>
      <div className="risk-meter">
        <div className={`risk-level ${riskLevel === 'low' ? 'active' : ''}`}>Conservative</div>
        <div className={`risk-level ${riskLevel === 'moderate' ? 'active' : ''}`}>Moderate</div>
        <div className={`risk-level ${riskLevel === 'high' ? 'active' : ''}`}>Aggressive</div>
      </div>
    </div>
  );
};

const CompanyAiAnalysis = ({ companyData }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendation, setRecommendation] = useState('');
  const [riskProfile, setRiskProfile] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!companyData) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.post('/api/ai-analysis/company', { companyData });
        
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        
        const analysisText = response.data.analysis;
        setAnalysis(analysisText);
        
        // Extract recommendation from the analysis text
        extractRecommendationAndRiskProfile(analysisText);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching AI analysis:', err);
        setError(`Failed to load AI analysis. ${err.message}`);
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [companyData]);
  
  // Function to extract recommendation and risk profile from analysis text
  const extractRecommendationAndRiskProfile = (text) => {
    if (!text) return;
    
    // Extract recommendation (BUY, HOLD, SELL)
    const recommendationRegex = /\b(BUY|HOLD|SELL|Buy|Hold|Sell)\b/;
    const recommendationMatch = text.match(recommendationRegex);
    
    if (recommendationMatch) {
      // Look for a more complete recommendation phrase
      const fullRecommendationRegex = /(Strong Buy|Buy|Accumulate|Hold|Reduce|Sell|Strong Sell|STRONG BUY|BUY|ACCUMULATE|HOLD|REDUCE|SELL|STRONG SELL)/;
      const fullMatch = text.match(fullRecommendationRegex);
      
      if (fullMatch) {
        setRecommendation(fullMatch[0]);
      } else {
        setRecommendation(recommendationMatch[0]);
      }
    } else {
      setRecommendation('NEUTRAL');
    }
    
    // Extract risk profile
    const riskRegex = /(Conservative|Moderate|Aggressive|Low Risk|Medium Risk|High Risk)/i;
    const riskMatch = text.match(riskRegex);
    
    if (riskMatch) {
      setRiskProfile(riskMatch[0]);
    } else {
      setRiskProfile('Moderate');
    }
  };

  if (loading) {
    return (
      <div className="ai-analysis-loading">
        <div className="loader"></div>
        <p>Generating AI analysis...</p>
        <p className="loading-subtext">Our AI analyst is reviewing the company data and preparing a comprehensive report.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-analysis-error">
        <h3>Analysis Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="company-ai-analysis">
      <div className="ai-analysis-header">
        <h3>AI Investment Analysis</h3>
        <div className="ai-analysis-info">
          <span className="ai-badge">AI-Generated</span>
          <span className="ai-timestamp">Generated on {new Date().toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>
      
      {/* Investment recommendation summary box */}
      <div className="ai-analysis-summary">
        <div className="summary-left">
          <h4>Investment Recommendation</h4>
          <RatingBadge rating={recommendation} />
        </div>
        <div className="summary-right">
          <RiskProfile profile={riskProfile} />
        </div>
      </div>
      
      {/* Table of contents for the analysis */}
      <div className="ai-analysis-toc">
        <h4>Analysis Contents</h4>
        <ul>
          <li><a href="#business-summary">Business Summary & Strategic Position</a></li>
          <li><a href="#financial-analysis">Enhanced Financial Analysis</a></li>
          <li><a href="#macro-context">Macro & Industry Context</a></li>
          <li><a href="#swot">SWOT Analysis</a></li>
          <li><a href="#valuation">Valuation & Price Target</a></li>
          <li><a href="#risk">Risk Assessment</a></li>
          <li><a href="#sentiment">Sentiment Analysis</a></li>
          <li><a href="#conclusion">Investment Conclusion</a></li>
        </ul>
      </div>
      
      <div className="ai-analysis-content">
        <ReactMarkdown>
          {analysis}
        </ReactMarkdown>
      </div>
      
      {/* Key metrics visualization */}
      <div className="ai-analysis-metrics">
        <h4>Key Metrics at a Glance</h4>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-title">Return Potential</div>
            <div className="metric-value">{recommendation.includes('BUY') || recommendation.includes('Buy') ? 'High' : recommendation.includes('HOLD') || recommendation.includes('Hold') ? 'Moderate' : 'Low'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-title">Risk Level</div>
            <div className="metric-value">{riskProfile}</div>
          </div>
          <div className="metric-card">
            <div className="metric-title">Time Horizon</div>
            <div className="metric-value">Long Term</div>
          </div>
          <div className="metric-card">
            <div className="metric-title">Investor Type</div>
            <div className="metric-value">{riskProfile.toLowerCase().includes('conservative') ? 'Value' : riskProfile.toLowerCase().includes('aggressive') ? 'Growth' : 'Balanced'}</div>
          </div>
        </div>
      </div>
      
      <div className="ai-analysis-disclaimer">
        <p>
          <strong>Disclaimer:</strong> This analysis is generated by an AI model and should be used for informational purposes only. 
          It is not financial advice. Always conduct your own research or consult with a qualified financial advisor 
          before making investment decisions.
        </p>
      </div>
    </div>
  );
};

export default CompanyAiAnalysis;
