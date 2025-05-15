// backend/controllers/aiAnalysisController.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import NodeCache from 'node-cache';

// Cache for storing API responses to avoid redundant calls
const apiCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

// Configure dotenv to load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Check if Gemini API key is available
const apiKey = process.env.GEMINI_API_KEY;
const hasApiKey = !!apiKey;

// Initialize the Gemini AI client if API key is available
let genAI = null;

if (hasApiKey) {
  console.log('AI Analysis will work with Gemini AI');
  try {
    // Initialize the Gemini AI client
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Gemini AI client initialized successfully for AI Analysis');
  } catch (error) {
    console.error('Error initializing Gemini AI client for AI Analysis:', error);
    genAI = null;
  }
} else {
  console.log('No Gemini API key found. AI Analysis will return a placeholder response.');
}

/**
 * Fetch macroeconomic indicators from external APIs
 * @returns {Promise<Object>} - Macroeconomic data
 */
async function fetchMacroeconomicData() {
  const cacheKey = 'macro_data';
  
  // Check if data is in cache
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    console.log('Using cached macroeconomic data');
    return cachedData;
  }
  
  try {
    // This is a placeholder. In a production environment, you would use a real API
    // For example: Alpha Vantage, FRED API, World Bank API, etc.
    const macroData = {
      gdp_growth: 3.2,
      inflation_rate: 4.1,
      unemployment_rate: 3.7,
      interest_rate: 5.25,
      currency_strength: {
        usd_inr: 83.2,
        usd_eur: 0.92,
        usd_gbp: 0.78
      },
      market_sentiment: 'Cautiously Optimistic',
      geopolitical_factors: [
        'US-China trade tensions affecting global supply chains',
        'Ongoing conflicts in Eastern Europe impacting energy prices',
        'Upcoming elections in major economies creating policy uncertainty'
      ]
    };
    
    // Store in cache
    apiCache.set(cacheKey, macroData);
    return macroData;
  } catch (error) {
    console.error('Error fetching macroeconomic data:', error);
    return {};
  }
}

/**
 * Fetch industry comparison data for a specific sector
 * @param {String} sector - Company sector
 * @param {String} industry - Company industry
 * @returns {Promise<Object>} - Industry comparison data
 */
async function fetchIndustryComparisonData(sector, industry) {
  const cacheKey = `industry_${sector}_${industry}`;
  
  // Check if data is in cache
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    console.log(`Using cached industry data for ${sector}/${industry}`);
    return cachedData;
  }
  
  try {
    // This is a placeholder. In a production environment, you would fetch real data
    // For example: from a financial data API or your own database
    const industryData = {
      average_pe: 22.5,
      average_pb: 3.2,
      average_roe: 15.8,
      average_revenue_growth: 12.3,
      average_profit_margin: 8.7,
      average_debt_to_equity: 1.2,
      average_dividend_yield: 2.1,
      top_performers: [
        { name: 'Company A', ticker: 'COMPA', performance: '+15.2%' },
        { name: 'Company B', ticker: 'COMPB', performance: '+12.8%' },
        { name: 'Company C', ticker: 'COMPC', performance: '+10.5%' }
      ],
      industry_outlook: 'Positive with strong growth potential',
      key_trends: [
        'Increasing digital transformation',
        'Focus on sustainability',
        'Consolidation through M&A activity'
      ]
    };
    
    // Store in cache
    apiCache.set(cacheKey, industryData);
    return industryData;
  } catch (error) {
    console.error(`Error fetching industry data for ${sector}/${industry}:`, error);
    return {};
  }
}

/**
 * Analyze sentiment from news and social media
 * @param {String} companyName - Company name
 * @param {String} ticker - Company ticker symbol
 * @returns {Promise<Object>} - Sentiment analysis results
 */
async function analyzeSentiment(companyName, ticker) {
  const cacheKey = `sentiment_${ticker}`;
  
  // Check if data is in cache
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    console.log(`Using cached sentiment data for ${ticker}`);
    return cachedData;
  }
  
  try {
    // This is a placeholder. In a production environment, you would use a real API
    // For example: News API, Twitter API, or a specialized financial sentiment API
    const sentimentData = {
      overall_sentiment: 'Positive',
      sentiment_score: 0.68, // Scale from -1 (very negative) to 1 (very positive)
      news_sentiment: {
        positive: 65,
        neutral: 25,
        negative: 10
      },
      social_media_sentiment: {
        positive: 58,
        neutral: 30,
        negative: 12
      },
      recent_events: [
        { title: 'Quarterly earnings beat expectations', sentiment: 'Positive' },
        { title: 'New product launch announced', sentiment: 'Positive' },
        { title: 'Minor supply chain disruptions reported', sentiment: 'Negative' }
      ],
      analyst_recommendations: {
        buy: 8,
        hold: 3,
        sell: 1
      }
    };
    
    // Store in cache
    apiCache.set(cacheKey, sentimentData);
    return sentimentData;
  } catch (error) {
    console.error(`Error analyzing sentiment for ${ticker}:`, error);
    return {};
  }
}

/**
 * Generate an investment analysis report for a company
 * @param {Object} companyData - Company data including financials, news, and market metrics
 * @returns {Promise<Object>} - AI-generated analysis report
 */
const generateCompanyAnalysis = async (companyData) => {
  if (!hasApiKey || !genAI) {
    console.log('Using placeholder response (Gemini AI not available)');
    return {
      analysis: getPlaceholderAnalysis(companyData),
      error: 'AI analysis is not available due to missing API key'
    };
  }

  try {
    console.log('Generating enhanced AI analysis for company:', companyData.company?.name || companyData.symbol);
    
    // Fetch additional data to enhance the analysis
    const companyName = companyData.company?.name || companyData.symbol;
    const sector = companyData.company?.sector || 'Unknown';
    const industry = companyData.company?.industry || 'Unknown';
    
    console.log(`Fetching enhanced data for ${companyName} (${sector}/${industry})`);
    
    // Fetch data in parallel for better performance
    const [macroData, industryData, sentimentData] = await Promise.all([
      fetchMacroeconomicData(),
      fetchIndustryComparisonData(sector, industry),
      analyzeSentiment(companyName, companyData.symbol)
    ]);
    
    // Format the company data for the AI prompt with the enhanced data
    const formattedData = formatEnhancedCompanyDataForPrompt(companyData, macroData, industryData, sentimentData);
    
    // Create the enhanced system prompt
    const systemPrompt = `
You are a senior equity research analyst and financial strategist with deep knowledge of global finance, macroeconomics, and fundamental analysis. Given the following structured financial and market data of a company, generate a high-quality, professional-grade investment report. The tone should be neutral, objective, and insightful like a top-tier sell-side analyst.

Your analysis should include:

1. Business Summary & Strategic Position
   - Core business model with a clear analogy to help investors understand
   - Competitive positioning in the industry
   - Key revenue drivers and business segments

2. Enhanced Financial Analysis
   - Key metrics with plain-English explanations
   - Free Cash Flow (FCF) analysis and implications
   - Segment-wise revenue breakdown where available
   - Earnings quality assessment
   - Trend analysis for 3-year data where available

3. Macro & Industry Context
   - How current macroeconomic factors impact this specific business
   - Industry position relative to peers (using comparative metrics)
   - Sector trends and how the company is positioned to benefit or face challenges

4. Comprehensive SWOT Analysis
   - Strengths: Competitive advantages, financial strengths, market position
   - Weaknesses: Areas of concern in operations, financials, or market position
   - Opportunities: Growth vectors, market expansion, new products/services
   - Threats: Competitive pressures, regulatory risks, macroeconomic headwinds

5. Valuation & Price Target
   - Multiple-based valuation with industry comparisons
   - Intrinsic value assessment
   - Potential catalysts that could change valuation

6. Risk Assessment
   - Specific business risks
   - Financial statement risks
   - Market and macroeconomic risks

7. Sentiment Analysis
   - Broker consensus and recent changes
   - News sentiment trends
   - Social media and market sentiment indicators

8. Investment Conclusion
   - Nuanced BUY/HOLD/SELL recommendation with clear rationale
   - Risk profile assessment (Conservative, Moderate, Aggressive)
   - Investor suitability (e.g., "Suitable for growth investors with 3+ year horizon")
   - Price target with upside/downside potential

Formatting Guidelines:
- Use bullet points for clarity where appropriate
- Include section headings for easy navigation
- Keep explanations investor-friendly but sophisticated
- Use financial insight, not just summaries
- Avoid hallucination; rely only on the given data

Here is the comprehensive company data:
${formattedData}
`;

    // Get the Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Generate content
    const result = await model.generateContent(systemPrompt);
    const response = result.response;
    
    console.log('Successfully generated AI analysis');
    
    return {
      analysis: response.text(),
      error: null
    };
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    return {
      analysis: getPlaceholderAnalysis(companyData),
      error: `Failed to generate AI analysis: ${error.message}`
    };
  }
};

/**
 * Format enhanced company data for the AI prompt including macro, industry, and sentiment data
 * @param {Object} companyData - Raw company data
 * @param {Object} macroData - Macroeconomic data
 * @param {Object} industryData - Industry comparison data
 * @param {Object} sentimentData - Sentiment analysis data
 * @returns {String} - Formatted enhanced data for the AI prompt
 */
const formatEnhancedCompanyDataForPrompt = (companyData, macroData, industryData, sentimentData) => {
  try {
    // Basic company information
    let formattedData = `
==== COMPANY OVERVIEW ====
Name: ${companyData.company?.name || companyData.symbol}
Ticker: ${companyData.symbol}.NS
Sector: ${companyData.company?.sector || 'N/A'}
Industry: ${companyData.company?.industry || 'N/A'}
`;

    // Market data
    formattedData += `
==== MARKET DATA ====
Current Price: ₹${companyData.currentPrice?.toFixed(2) || 'N/A'}
Day Change: ${companyData.dayChangePct > 0 ? '+' : ''}${companyData.dayChangePct?.toFixed(2) || 'N/A'}%
Market Cap: ₹${formatInCrores(companyData.company?.marketCap) || 'N/A'}
`;

    // Historical performance
    if (companyData.history && companyData.history.length > 0) {
      // Calculate 52-week high/low
      const high52Week = Math.max(...companyData.history.map(day => day.High));
      const low52Week = Math.min(...companyData.history.map(day => day.Low));
      
      // Calculate 1-year return
      const oldestPrice = companyData.history[0].Close;
      const latestPrice = companyData.history[companyData.history.length - 1].Close;
      const yearReturn = ((latestPrice - oldestPrice) / oldestPrice) * 100;
      
      // Calculate volatility (standard deviation of returns)
      const returns = [];
      for (let i = 1; i < companyData.history.length; i++) {
        const dailyReturn = (companyData.history[i].Close - companyData.history[i-1].Close) / companyData.history[i-1].Close;
        returns.push(dailyReturn);
      }
      const avgReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;
      const squaredDiffs = returns.map(val => Math.pow(val - avgReturn, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / squaredDiffs.length;
      const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility
      
      formattedData += `
==== PERFORMANCE METRICS ====
52-Week High: ₹${high52Week.toFixed(2)}
52-Week Low: ₹${low52Week.toFixed(2)}
1-Year Return: ${yearReturn > 0 ? '+' : ''}${yearReturn.toFixed(2)}%
Period Change: ${companyData.periodChangePct > 0 ? '+' : ''}${companyData.periodChangePct?.toFixed(2) || 'N/A'}%
Annualized Volatility: ${volatility.toFixed(2)}%
Risk-Adjusted Return (Return/Volatility): ${(yearReturn / volatility).toFixed(2)}
`;
    }

    // Financial ratios (if available)
    if (companyData.company?.financials) {
      const financials = companyData.company.financials;
      formattedData += `
==== FINANCIAL RATIOS ====
P/E Ratio: ${financials.pe || 'N/A'}
EPS: ₹${financials.eps || 'N/A'}
ROE: ${financials.roe || 'N/A'}%
Debt-to-Equity: ${financials.debtToEquity || 'N/A'}
Dividend Yield: ${financials.dividendYield || 'N/A'}%
`;
      
      // Add calculated PEG ratio if growth rate is available
      if (financials.pe && financials.earningsGrowth) {
        const pegRatio = financials.pe / financials.earningsGrowth;
        formattedData += `PEG Ratio: ${pegRatio.toFixed(2)}
`;
      }
    }

    // Recent trading activity
    if (companyData.history && companyData.history.length > 0) {
      const recentDays = companyData.history.slice(-5).reverse();
      formattedData += `
==== RECENT TRADING ACTIVITY ====`;
      
      recentDays.forEach(day => {
        formattedData += `
${new Date(day.Date).toLocaleDateString('en-IN')}: Open ₹${day.Open.toFixed(2)}, High ₹${day.High.toFixed(2)}, Low ₹${day.Low.toFixed(2)}, Close ₹${day.Close.toFixed(2)}, Volume ${formatVolume(day.Volume)}`;
      });
    }

    // Macroeconomic context
    if (Object.keys(macroData).length > 0) {
      formattedData += `

==== MACROECONOMIC CONTEXT ====
GDP Growth: ${macroData.gdp_growth}%
Inflation Rate: ${macroData.inflation_rate}%
Interest Rate: ${macroData.interest_rate}%
Unemployment Rate: ${macroData.unemployment_rate}%
USD/INR Exchange Rate: ${macroData.currency_strength.usd_inr}
Market Sentiment: ${macroData.market_sentiment}

Geopolitical Factors:
`;
      
      macroData.geopolitical_factors.forEach(factor => {
        formattedData += `- ${factor}\n`;
      });
    }

    // Industry comparison
    if (Object.keys(industryData).length > 0) {
      formattedData += `
==== INDUSTRY COMPARISON ====
Industry Average P/E: ${industryData.average_pe}
Industry Average P/B: ${industryData.average_pb}
Industry Average ROE: ${industryData.average_roe}%
Industry Average Revenue Growth: ${industryData.average_revenue_growth}%
Industry Average Profit Margin: ${industryData.average_profit_margin}%
Industry Average Debt-to-Equity: ${industryData.average_debt_to_equity}
Industry Average Dividend Yield: ${industryData.average_dividend_yield}%

Industry Outlook: ${industryData.industry_outlook}

Key Industry Trends:
`;
      
      industryData.key_trends.forEach(trend => {
        formattedData += `- ${trend}\n`;
      });
      
      formattedData += `
Top Performing Peers:
`;
      
      industryData.top_performers.forEach(peer => {
        formattedData += `- ${peer.name} (${peer.ticker}): ${peer.performance}\n`;
      });
    }

    // Sentiment analysis
    if (Object.keys(sentimentData).length > 0) {
      formattedData += `
==== SENTIMENT ANALYSIS ====
Overall Sentiment: ${sentimentData.overall_sentiment}
Sentiment Score: ${sentimentData.sentiment_score} (-1 to +1 scale)

News Sentiment Breakdown:
- Positive: ${sentimentData.news_sentiment.positive}%
- Neutral: ${sentimentData.news_sentiment.neutral}%
- Negative: ${sentimentData.news_sentiment.negative}%

Analyst Recommendations:
- Buy: ${sentimentData.analyst_recommendations.buy}
- Hold: ${sentimentData.analyst_recommendations.hold}
- Sell: ${sentimentData.analyst_recommendations.sell}

Recent Events:
`;
      
      sentimentData.recent_events.forEach(event => {
        formattedData += `- ${event.title} (${event.sentiment})\n`;
      });
    }

    // News (if available)
    if (companyData.news && companyData.news.length > 0) {
      formattedData += `
==== RECENT NEWS ====`;
      
      companyData.news.slice(0, 3).forEach(item => {
        formattedData += `
- ${item.title} (${new Date(item.date).toLocaleDateString('en-IN')})
  ${item.summary || 'No summary available'}`;
      });
    }

    return formattedData;
  } catch (error) {
    console.error('Error formatting enhanced company data for AI prompt:', error);
    return `Company: ${companyData.symbol}\nPrice: ₹${companyData.currentPrice || 'N/A'}`;
  }
};

/**
 * Format company data for the AI prompt (basic version)
 * @param {Object} companyData - Raw company data
 * @returns {String} - Formatted data for the AI prompt
 */
const formatCompanyDataForPrompt = (companyData) => {
  try {
    // Basic company information
    let formattedData = `
COMPANY OVERVIEW:
Name: ${companyData.company?.name || companyData.symbol}
Ticker: ${companyData.symbol}.NS
Sector: ${companyData.company?.sector || 'N/A'}
Industry: ${companyData.company?.industry || 'N/A'}
`;

    // Market data
    formattedData += `
MARKET DATA:
Current Price: ₹${companyData.currentPrice?.toFixed(2) || 'N/A'}
Day Change: ${companyData.dayChangePct > 0 ? '+' : ''}${companyData.dayChangePct?.toFixed(2) || 'N/A'}%
Market Cap: ₹${formatInCrores(companyData.company?.marketCap) || 'N/A'}
`;

    // Historical performance
    if (companyData.history && companyData.history.length > 0) {
      // Calculate 52-week high/low
      const high52Week = Math.max(...companyData.history.map(day => day.High));
      const low52Week = Math.min(...companyData.history.map(day => day.Low));
      
      // Calculate 1-year return
      const oldestPrice = companyData.history[0].Close;
      const latestPrice = companyData.history[companyData.history.length - 1].Close;
      const yearReturn = ((latestPrice - oldestPrice) / oldestPrice) * 100;
      
      formattedData += `
PERFORMANCE:
52-Week High: ₹${high52Week.toFixed(2)}
52-Week Low: ₹${low52Week.toFixed(2)}
1-Year Return: ${yearReturn > 0 ? '+' : ''}${yearReturn.toFixed(2)}%
Period Change: ${companyData.periodChangePct > 0 ? '+' : ''}${companyData.periodChangePct?.toFixed(2) || 'N/A'}%
`;
    }

    // Financial ratios (if available)
    if (companyData.company?.financials) {
      const financials = companyData.company.financials;
      formattedData += `
FINANCIAL RATIOS:
P/E Ratio: ${financials.pe || 'N/A'}
EPS: ₹${financials.eps || 'N/A'}
ROE: ${financials.roe || 'N/A'}%
Debt-to-Equity: ${financials.debtToEquity || 'N/A'}
Dividend Yield: ${financials.dividendYield || 'N/A'}%
`;
    }

    // Recent trading activity
    if (companyData.history && companyData.history.length > 0) {
      const recentDays = companyData.history.slice(-5).reverse();
      formattedData += `
RECENT TRADING ACTIVITY:`;
      
      recentDays.forEach(day => {
        formattedData += `
${new Date(day.Date).toLocaleDateString('en-IN')}: Open ₹${day.Open.toFixed(2)}, High ₹${day.High.toFixed(2)}, Low ₹${day.Low.toFixed(2)}, Close ₹${day.Close.toFixed(2)}, Volume ${formatVolume(day.Volume)}`;
      });
    }

    // News (if available)
    if (companyData.news && companyData.news.length > 0) {
      formattedData += `
RECENT NEWS:`;
      
      companyData.news.slice(0, 3).forEach(item => {
        formattedData += `
- ${item.title} (${new Date(item.date).toLocaleDateString('en-IN')})
  ${item.summary || 'No summary available'}`;
      });
    }

    return formattedData;
  } catch (error) {
    console.error('Error formatting company data for AI prompt:', error);
    return `Company: ${companyData.symbol}\nPrice: ₹${companyData.currentPrice || 'N/A'}`;
  }
};

/**
 * Format large numbers (like market cap) in crores
 * @param {Number} value - Value to format
 * @returns {String} - Formatted value
 */
const formatInCrores = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const crores = value / 10000000;
  if (crores >= 100000) {
    return `${(crores / 100000).toFixed(2)} Lakh Cr`;
  }
  return `${crores.toFixed(2)} Cr`;
};

/**
 * Format volume in lakhs
 * @param {Number} value - Value to format
 * @returns {String} - Formatted value
 */
const formatVolume = (value) => {
  if (value === null || value === undefined) return 'N/A';
  const lakhs = value / 100000;
  if (lakhs >= 100) {
    return `${(lakhs / 100).toFixed(2)} Cr`;
  }
  return `${lakhs.toFixed(2)} Lakh`;
};

/**
 * Get a placeholder analysis when AI is not available
 * @param {Object} companyData - Company data
 * @returns {String} - Placeholder analysis
 */
const getPlaceholderAnalysis = (companyData) => {
  const companyName = companyData.company?.name || companyData.symbol;
  
  return `# Investment Analysis for ${companyName}

## Business Summary
${companyName} operates in the ${companyData.company?.sector || 'unknown'} sector, specifically in the ${companyData.company?.industry || 'unknown'} industry. The company has shown ${companyData.periodChangePct > 0 ? 'positive' : 'negative'} performance over the selected period.

## Key Financial Metrics
* Current Price: ₹${companyData.currentPrice?.toFixed(2) || 'N/A'}
* Market Cap: ${formatInCrores(companyData.company?.marketCap) || 'N/A'}
* Day Change: ${companyData.dayChangePct > 0 ? '+' : ''}${companyData.dayChangePct?.toFixed(2) || 'N/A'}%

## Note
This is a placeholder analysis. For a detailed AI-powered investment report, please ensure the Gemini API key is configured correctly in the backend.`;
};

/**
 * Handle the request to generate company analysis
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleCompanyAnalysis = async (req, res) => {
  try {
    const { companyData } = req.body;

    if (!companyData) {
      return res.status(400).json({ 
        error: 'Company data is required in the request body.' 
      });
    }

    console.log(`Generating analysis for ${companyData.symbol}`);
    
    const analysisResult = await generateCompanyAnalysis(companyData);
    
    res.json({
      analysis: analysisResult.analysis,
      error: analysisResult.error
    });
  } catch (error) {
    console.error('Error in AI Analysis handler:', error);
    res.status(500).json({ 
      error: 'AI Analysis is currently experiencing technical difficulties.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export { handleCompanyAnalysis };
