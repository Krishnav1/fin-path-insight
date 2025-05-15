import express from 'express';
import { getCached, setCached } from '../services/cacheService.js';
import { getCompanyNews, getMarketNews, fetchFinancialNews } from '../services/newsService.js';

const router = express.Router();

/**
 * @route   GET /api/news/company/:symbol
 * @desc    Get company-specific news
 * @access  Public
 */
router.get('/company/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `company_news_${symbol}`;
    const cachedNews = getCached(cacheKey);
    
    if (cachedNews) {
      return res.json(cachedNews);
    }
    
    // Split ticker from exchange suffix (e.g., "TCS.NS" -> "TCS")
    const displaySymbol = symbol.split('.')[0];
    const companyName = getCompanyName(displaySymbol);
    
    // Fetch real news using our news service
    const newsArticles = await getCompanyNews(displaySymbol, companyName);
    
    if (newsArticles && newsArticles.length > 0) {
      // Cache the real news for 30 minutes
      setCached(cacheKey, newsArticles, 30 * 60);
      return res.json(newsArticles);
    }
    
    // Fallback to mock data if no real news found
    const mockNews = generateMockNews(companyName, displaySymbol);
    setCached(cacheKey, mockNews, 15 * 60); // Cache mock data for 15 minutes
    res.json(mockNews);
  } catch (error) {
    console.error('Error in news endpoint:', error);
    
    // Generate mock news as a fallback
    const displaySymbol = req.params.symbol.split('.')[0];
    const companyName = getCompanyName(displaySymbol);
    const mockNews = generateMockNews(companyName, displaySymbol);
    
    res.json(mockNews);
  }
});

/**
 * @route   GET /api/news/market/:market
 * @desc    Get market-specific news
 * @access  Public
 */
router.get('/market/:market', async (req, res) => {
  try {
    const { market } = req.params;
    const cacheKey = `market_news_${market}`;
    const cachedNews = getCached(cacheKey);
    
    if (cachedNews) {
      return res.json(cachedNews);
    }
    
    // Fetch real news using our news service
    const newsArticles = await getMarketNews(market);
    
    if (newsArticles && newsArticles.length > 0) {
      // Cache the real news for 30 minutes
      setCached(cacheKey, newsArticles, 30 * 60);
      return res.json(newsArticles);
    }
    
    // Fallback to mock data if no real news found
    const mockNews = generateMarketNews(market);
    setCached(cacheKey, mockNews, 15 * 60); // Cache mock data for 15 minutes
    res.json(mockNews);
  } catch (error) {
    console.error('Error in market news endpoint:', error);
    
    // Generate mock news as a fallback
    const mockNews = generateMarketNews(req.params.market);
    res.json(mockNews);
  }
});

/**
 * @route   GET /api/news/latest
 * @desc    Get latest financial news
 * @access  Public
 */
router.get('/latest', async (req, res) => {
  try {
    const cacheKey = 'latest_financial_news';
    const cachedNews = getCached(cacheKey);
    
    if (cachedNews) {
      return res.json(cachedNews);
    }
    
    // Fetch real news using our news service
    const newsArticles = await getMarketNews('global');
    
    if (newsArticles && newsArticles.length > 0) {
      // Add article IDs to each news item
      const newsWithIds = newsArticles.map((article, index) => ({
        ...article,
        id: `latest-${index + 1}`,
        articleId: generateArticleId(article.title)
      }));
      
      // Cache the real news for 30 minutes
      setCached(cacheKey, newsWithIds, 30 * 60);
      return res.json(newsWithIds);
    }
    
    // Fallback to mock data if no real news found
    const mockNews = generateMarketNews('global');
    setCached(cacheKey, mockNews, 15 * 60); // Cache mock data for 15 minutes
    res.json(mockNews);
  } catch (error) {
    console.error('Error in latest news endpoint:', error);
    
    // Generate mock news as a fallback
    const mockNews = generateMarketNews('global');
    res.json(mockNews);
  }
});

/**
 * @route   GET /api/news/category/:category
 * @desc    Get news by category
 * @access  Public
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['markets', 'economy', 'companies', 'technology', 'crypto', 'regulation', 'investing', 'all'];
    
    if (!validCategories.includes(category.toLowerCase()) && category !== 'all') {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const cacheKey = `news_category_${category}`;
    const cachedNews = getCached(cacheKey);
    
    if (cachedNews) {
      return res.json(cachedNews);
    }
    
    // For 'all' category, fetch general financial news
    if (category === 'all') {
      const allNews = await getMarketNews('global');
      
      if (allNews && allNews.length > 0) {
        // Add article IDs to each news item
        const newsWithIds = allNews.map((article, index) => ({
          ...article,
          id: `all-${index + 1}`,
          articleId: generateArticleId(article.title)
        }));
        
        setCached(cacheKey, newsWithIds, 30 * 60);
        return res.json(newsWithIds);
      }
    } else {
      // Fetch news specific to the category
      const categoryNews = await fetchFinancialNews(`financial ${category}`, 10, category);
      
      if (categoryNews && categoryNews.length > 0) {
        // Add article IDs to each news item
        const newsWithIds = categoryNews.map((article, index) => ({
          ...article,
          id: `${category}-${index + 1}`,
          articleId: generateArticleId(article.title)
        }));
        
        setCached(cacheKey, newsWithIds, 30 * 60);
        return res.json(newsWithIds);
      }
    }
    
    // Fallback to mock data
    const mockNews = generateCategoryNews(category);
    setCached(cacheKey, mockNews, 15 * 60);
    res.json(mockNews);
  } catch (error) {
    console.error(`Error in category news endpoint:`, error);
    
    // Fallback to mock data
    const mockNews = generateCategoryNews(req.params.category);
    res.json(mockNews);
  }
});

/**
 * @route   GET /api/news/article/:articleId or GET /api/news/article?id=:articleId
 * @desc    Get full article by ID (supports both path and query parameter)
 * @access  Public
 */
router.get('/article/:articleId?', async (req, res) => {
  try {
    // Get article ID from either path parameter or query parameter
    let articleId = req.params.articleId || req.query.id;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }
    
    const cacheKey = `news_article_${articleId}`;
    const cachedArticle = getCached(cacheKey);
    
    if (cachedArticle) {
      return res.json(cachedArticle);
    }
    
    // Try to find the article in our cached news
    const allCacheKeys = [
      'latest_financial_news',
      'news_category_all',
      'news_category_markets',
      'news_category_economy',
      'news_category_companies',
      'news_category_technology',
      'news_category_crypto',
      'news_category_regulation',
      'news_category_investing'
    ];
    
    let foundArticle = null;
    
    for (const key of allCacheKeys) {
      const cachedNews = getCached(key);
      if (cachedNews) {
        foundArticle = cachedNews.find(article => 
          article.articleId === articleId || 
          article.id === articleId
        );
        
        if (foundArticle) break;
      }
    }
    
    if (foundArticle) {
      // Enhance the article with more content
      const enhancedArticle = {
        ...foundArticle,
        fullContent: foundArticle.snippet + '\n\n' + generateArticleContent(foundArticle.title),
        relatedArticles: generateRelatedArticles(foundArticle.category || 'markets', foundArticle.title)
      };
      
      setCached(cacheKey, enhancedArticle, 60 * 60); // Cache for 1 hour
      return res.json(enhancedArticle);
    }
    
    // If article not found, generate a mock article
    const mockArticle = generateMockArticle(articleId);
    setCached(cacheKey, mockArticle, 30 * 60);
    res.json(mockArticle);
  } catch (error) {
    console.error('Error in article endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Helper function to generate mock news for a company
function generateMockNews(companyName, symbol) {
  const now = new Date();
  
  return [
    {
      id: `${symbol}-1`,
      articleId: generateArticleId(`${companyName} Reports Strong Quarterly Results`),
      title: `${companyName} Reports Strong Quarterly Results`,
      url: `/news/article/${generateArticleId(`${companyName} Reports Strong Quarterly Results`)}`,
      source: 'Financial Times',
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      snippet: `${companyName} (${symbol}) exceeded analyst expectations with 15% revenue growth...`,
      category: 'companies'
    },
    {
      id: `${symbol}-2`,
      articleId: generateArticleId(`${companyName} Announces New Product Line`),
      title: `${companyName} Announces New Product Line`,
      url: `/news/article/${generateArticleId(`${companyName} Announces New Product Line`)}`,
      source: 'Bloomberg',
      publishedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      snippet: `${companyName} is expanding its product portfolio with innovative...`,
      category: 'companies'
    },
    {
      id: `${symbol}-3`,
      articleId: generateArticleId(`Analysts Upgrade ${companyName} Stock to Buy`),
      title: `Analysts Upgrade ${companyName} Stock to "Buy"`,
      url: `/news/article/${generateArticleId(`Analysts Upgrade ${companyName} Stock to Buy`)}`,
      source: 'CNBC',
      publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      snippet: `Major analysts have upgraded ${companyName} citing strong growth potential...`,
      category: 'markets'
    },
    {
      id: `${symbol}-4`,
      articleId: generateArticleId(`${companyName} Expands Operations in Asian Markets`),
      title: `${companyName} Expands Operations in Asian Markets`,
      url: `/news/article/${generateArticleId(`${companyName} Expands Operations in Asian Markets`)}`,
      source: 'Reuters',
      publishedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      snippet: `${companyName} announced today its plan to expand operations in key Asian markets...`,
      category: 'companies'
    },
    {
      id: `${symbol}-5`,
      articleId: generateArticleId(`${companyName} Appoints New Chief Technology Officer`),
      title: `${companyName} Appoints New Chief Technology Officer`,
      url: `/news/article/${generateArticleId(`${companyName} Appoints New Chief Technology Officer`)}`,
      source: 'Wall Street Journal',
      publishedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      snippet: `${companyName} has appointed a new CTO to lead its digital transformation initiatives...`,
      category: 'technology'
    }
  ];
}

// Helper function to generate mock market news
function generateMarketNews(market) {
  const now = new Date();
  const marketName = market.charAt(0).toUpperCase() + market.slice(1);
  
  return [
    {
      id: `${market}-1`,
      articleId: generateArticleId(`${marketName} Markets Rise on Economic Data`),
      title: `${marketName} Markets Rise on Economic Data`,
      url: `/news/article/${generateArticleId(`${marketName} Markets Rise on Economic Data`)}`,
      source: 'Financial Times',
      publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      snippet: `${marketName} stock markets rallied today following better-than-expected economic reports...`,
      category: 'markets'
    },
    {
      id: `${market}-2`,
      articleId: generateArticleId(`Inflation Concerns Impact ${marketName} Trading`),
      title: `Inflation Concerns Impact ${marketName} Trading`,
      url: `/news/article/${generateArticleId(`Inflation Concerns Impact ${marketName} Trading`)}`,
      source: 'Bloomberg',
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      snippet: `Investors in ${marketName} markets responded to latest inflation data with...`,
      category: 'economy'
    },
    {
      id: `${market}-3`,
      articleId: generateArticleId(`Tech Stocks Lead ${marketName} Market Gains`),
      title: `Tech Stocks Lead ${marketName} Market Gains`,
      url: `/news/article/${generateArticleId(`Tech Stocks Lead ${marketName} Market Gains`)}`,
      source: 'CNBC',
      publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      snippet: `Technology sector stocks pushed the broader ${marketName} market higher as...`,
      category: 'technology'
    },
    {
      id: `${market}-4`,
      articleId: generateArticleId(`${marketName} Central Bank Holds Interest Rates`),
      title: `${marketName} Central Bank Holds Interest Rates`,
      url: `/news/article/${generateArticleId(`${marketName} Central Bank Holds Interest Rates`)}`,
      source: 'Reuters',
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      snippet: `The central bank's decision to maintain current rates brought relief to ${marketName} markets...`,
      category: 'economy'
    },
    {
      id: `${market}-5`,
      articleId: generateArticleId(`Foreign Investors Increase Exposure to ${marketName} Equities`),
      title: `Foreign Investors Increase Exposure to ${marketName} Equities`,
      url: `/news/article/${generateArticleId(`Foreign Investors Increase Exposure to ${marketName} Equities`)}`,
      source: 'Wall Street Journal',
      publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      snippet: `Global funds are increasing their allocation to ${marketName} stocks amid favorable...`,
      category: 'investing'
    }
  ];
}

// Helper function to generate mock news for a specific category
function generateCategoryNews(category) {
  const now = new Date();
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  
  // Default to 'all' if category is invalid
  const validCategory = ['markets', 'economy', 'companies', 'technology', 'crypto', 'regulation', 'investing', 'all'].includes(category) 
    ? category 
    : 'all';
  
  const categoryContent = {
    'markets': [
      { title: 'Global Markets Hit New Highs as Investor Confidence Grows', snippet: 'Stock markets around the world reached record levels as economic data points to sustained growth...' },
      { title: 'Asian Markets Rally on Strong Export Data', snippet: 'Markets across Asia posted significant gains following better-than-expected export figures from China and Japan...' },
      { title: 'European Markets Close Higher Despite Political Uncertainty', snippet: 'Major European indices finished in positive territory despite ongoing political challenges in several countries...' },
      { title: 'Market Volatility Index Falls to Three-Year Low', snippet: 'The VIX, often referred to as the "fear index," dropped to levels not seen since before the pandemic...' },
      { title: 'Small-Cap Stocks Outperform Broader Market', snippet: 'Smaller companies have been outpacing their larger counterparts as investors seek growth opportunities...' }
    ],
    'economy': [
      { title: 'Inflation Data Shows Cooling Trend in Major Economies', snippet: 'Consumer price indices across developed economies indicate that inflation pressures may be easing...' },
      { title: 'Central Banks Signal Potential Rate Cuts Later This Year', snippet: 'Several major central banks have hinted at possible interest rate reductions if inflation continues to moderate...' },
      { title: 'Job Market Remains Resilient Despite Economic Headwinds', snippet: 'Employment figures released this week show continued strength in hiring across multiple sectors...' },
      { title: 'Global Supply Chain Pressures Continue to Ease', snippet: 'Logistics and transportation metrics indicate further normalization in global supply chains...' },
      { title: 'Consumer Spending Holds Steady in Face of Economic Uncertainty', snippet: 'Retail sales data suggests consumers remain confident despite various economic challenges...' }
    ],
    'companies': [
      { title: 'Tech Giant Announces Major Restructuring Plan', snippet: 'One of the world\'s largest technology companies unveiled a comprehensive reorganization strategy...' },
      { title: 'Pharmaceutical Firm Reports Breakthrough in Cancer Treatment', snippet: 'A leading pharmaceutical company announced promising results from late-stage clinical trials...' },
      { title: 'Retail Chain Expands International Presence with New Acquisitions', snippet: 'A major retail corporation has completed the purchase of several overseas competitors...' },
      { title: 'Energy Company Commits to Ambitious Carbon Neutrality Timeline', snippet: 'One of the world\'s largest energy producers has pledged to achieve carbon neutrality by 2030...' },
      { title: 'Automotive Manufacturer Accelerates Electric Vehicle Production', snippet: 'A prominent car maker announced plans to significantly increase its electric vehicle manufacturing capacity...' }
    ],
    'technology': [
      { title: 'AI Breakthrough Promises to Transform Healthcare Diagnostics', snippet: 'Researchers have developed a new artificial intelligence system capable of detecting diseases earlier than current methods...' },
      { title: 'Tech Companies Unveil Next Generation of Quantum Computing Hardware', snippet: 'Several technology firms showcased their latest quantum computing processors at an industry conference...' },
      { title: 'Cybersecurity Experts Warn of Sophisticated New Threat Vector', snippet: 'Security researchers have identified a previously unknown vulnerability affecting widely used software...' },
      { title: 'Virtual Reality Adoption Accelerates in Corporate Training Programs', snippet: 'More companies are implementing VR-based training solutions to improve employee skills development...' },
      { title: 'New Semiconductor Technology Promises Major Efficiency Gains', snippet: 'A breakthrough in chip design could lead to significant improvements in computing power and energy efficiency...' }
    ],
    'crypto': [
      { title: 'Bitcoin Surges Past Key Resistance Level', snippet: 'The world\'s largest cryptocurrency broke through a significant price threshold after weeks of consolidation...' },
      { title: 'Major Financial Institution Launches Cryptocurrency Custody Service', snippet: 'A global banking leader has begun offering digital asset custody solutions to institutional clients...' },
      { title: 'Regulatory Framework for Cryptocurrencies Takes Shape', snippet: 'Lawmakers in several countries are finalizing comprehensive regulations for digital assets...' },
      { title: 'Ethereum Completes Major Network Upgrade', snippet: 'The second-largest blockchain platform has successfully implemented a significant protocol improvement...' },
      { title: 'Central Bank Digital Currencies Gain Momentum Globally', snippet: 'More countries are advancing their plans to launch government-backed digital currencies...' }
    ],
    'regulation': [
      { title: 'Financial Regulators Propose New Rules for Market Makers', snippet: 'Regulatory agencies have introduced draft guidelines aimed at improving market stability and transparency...' },
      { title: 'Antitrust Investigation Targets Tech Sector Practices', snippet: 'Competition authorities have launched a broad inquiry into potential anticompetitive behavior...' },
      { title: 'New Data Privacy Laws to Take Effect Next Quarter', snippet: 'Companies are preparing for the implementation of comprehensive data protection regulations...' },
      { title: 'Environmental Compliance Standards Tightened for Manufacturing', snippet: 'Industrial firms face stricter emissions and waste management requirements under new rules...' },
      { title: 'Financial Reporting Requirements Enhanced for Public Companies', snippet: 'Securities regulators have approved changes to disclosure rules for publicly traded corporations...' }
    ],
    'investing': [
      { title: 'Passive Investment Strategies Continue to Gain Market Share', snippet: 'Index funds and ETFs are attracting record inflows as investors favor low-cost investment vehicles...' },
      { title: 'Alternative Investments See Increased Allocation from Institutional Investors', snippet: 'Pension funds and endowments are boosting their exposure to private equity, real estate, and other alternatives...' },
      { title: 'ESG Investing Reaches New Milestone', snippet: 'Assets under management in environmental, social, and governance funds have surpassed a significant threshold...' },
      { title: 'Dividend Stocks Outperform in Current Market Environment', snippet: 'Companies with strong dividend histories are showing resilience amid market uncertainty...' },
      { title: 'New Tax-Advantaged Investment Accounts Introduced', snippet: 'Legislators have approved new retirement and savings vehicles with favorable tax treatment...' }
    ],
    'all': [
      { title: 'Markets Rally as Economic Outlook Improves', snippet: 'Global stock markets posted strong gains following positive economic indicators and corporate earnings...' },
      { title: 'Central Bank Signals Shift in Monetary Policy', snippet: 'Policymakers indicated a potential change in approach to interest rates and inflation management...' },
      { title: 'Major Tech Company Unveils Revolutionary Product', snippet: 'A leading technology firm has announced an innovative new offering that could reshape the industry...' },
      { title: 'Cryptocurrency Regulations Take Shape Globally', snippet: 'Governments around the world are developing frameworks to oversee digital asset markets...' },
      { title: 'Sustainable Investing Reaches Record Levels', snippet: 'Funds focused on environmental and social governance criteria have attracted unprecedented capital...' }
    ]
  };
  
  // Get content for the requested category
  const content = categoryContent[validCategory] || categoryContent['all'];
  
  // Generate mock news articles
  return content.map((item, index) => ({
    id: `${validCategory}-${index + 1}`,
    articleId: generateArticleId(item.title),
    title: item.title,
    url: `/news/article/${generateArticleId(item.title)}`,
    source: ['Financial Times', 'Bloomberg', 'CNBC', 'Reuters', 'Wall Street Journal'][index % 5],
    publishedAt: new Date(now.getTime() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
    snippet: item.snippet,
    category: validCategory === 'all' ? ['markets', 'economy', 'companies', 'technology', 'crypto'][index % 5] : validCategory
  }));
}

// Helper function to generate a unique article ID from a title
function generateArticleId(title) {
  if (!title) return 'article-' + Date.now();
  
  // Convert title to lowercase, remove special characters, and replace spaces with hyphens
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50) // Limit length
    .replace(/-+$/, ''); // Remove trailing hyphens
}

// Helper function to generate mock article content
function generateArticleContent(title) {
  if (!title) return 'Article content not available.';
  
  // Generate paragraphs based on the title
  const paragraphs = [
    `In a significant development for the financial world, ${title.toLowerCase()}. Analysts have been closely monitoring this situation, with many expressing optimism about the implications for investors and markets alike.`,
    
    `Market participants reacted swiftly to the news, with trading volumes surging across major exchanges. "This is exactly the kind of movement we've been anticipating," noted Jane Smith, chief market strategist at Global Investments. "The data clearly supports a positive outlook for the coming quarter."`,
    
    `Historical trends suggest that similar patterns have preceded periods of sustained growth. However, some experts urge caution. "While the indicators are certainly promising, we need to consider the broader economic context," explained Dr. Robert Johnson, economist at Capital Research Institute. "Several underlying factors could still influence the trajectory in unexpected ways."`,
    
    `Institutional investors appear to be positioning themselves strategically in response to these developments. Regulatory filings indicate significant position adjustments among major funds, particularly in sectors most likely to benefit from the current environment.`,
    
    `Looking ahead, market observers will be paying close attention to upcoming economic data releases and policy announcements. These could provide further clarity on whether the current trend represents a temporary fluctuation or the beginning of a more substantial shift in market dynamics.`
  ];
  
  return paragraphs.join('\n\n');
}

// Helper function to generate related articles
function generateRelatedArticles(category, currentTitle) {
  // Get mock news for the category
  const categoryNews = generateCategoryNews(category);
  
  // Filter out the current article and take up to 3 related articles
  return categoryNews
    .filter(article => article.title !== currentTitle)
    .slice(0, 3)
    .map(article => ({
      id: article.id,
      articleId: article.articleId,
      title: article.title,
      url: article.url,
      category: article.category
    }));
}

// Helper function to generate a mock article when article ID is not found
function generateMockArticle(articleId) {
  const now = new Date();
  const categories = ['markets', 'economy', 'companies', 'technology', 'crypto', 'regulation', 'investing'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  // Create a title from the article ID
  let title = articleId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  if (title.length < 20) {
    title = `Financial Markets: ${title} Impact Analysis`;
  }
  
  const article = {
    id: articleId,
    articleId: articleId,
    title: title,
    url: `/news/article/${articleId}`,
    source: ['Financial Times', 'Bloomberg', 'CNBC', 'Reuters', 'Wall Street Journal'][Math.floor(Math.random() * 5)],
    publishedAt: new Date(now.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(),
    snippet: `A comprehensive analysis of the latest developments related to ${title.toLowerCase()}...`,
    category: category,
    fullContent: generateArticleContent(title),
    relatedArticles: generateRelatedArticles(category, title)
  };
  
  return article;
}

// Helper function to get company name from symbol
function getCompanyName(symbol) {
  const companies = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com',
    'META': 'Meta Platforms',
    'TSLA': 'Tesla',
    'NFLX': 'Netflix',
    'NVDA': 'NVIDIA',
    'TCS': 'Tata Consultancy Services',
    'INFY': 'Infosys',
    'WIPRO': 'Wipro',
    'RELIANCE': 'Reliance Industries',
    'HDFCBANK': 'HDFC Bank',
    'ICICIBANK': 'ICICI Bank',
    'BHARTIARTL': 'Bharti Airtel'
  };
  
  return companies[symbol] || `${symbol} Corp`;
}

export default router; 