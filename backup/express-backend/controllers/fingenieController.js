// backend/controllers/fingenieController.js
// Enhanced implementation for FinGenie chatbot with Gemini API and Pinecone vector search

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Conversation from '../models/Conversation.js';
import { generateEmbedding } from '../utils/embeddingUtils.js';
import { querySimilarVectors, initializePinecone } from '../utils/pineconeClient.js';
import { getRealtimeFinancialData, formatFinancialDataForPrompt } from '../utils/financialDataUtils.js';
import { fetchFinancialNews } from '../services/newsService.js';

// Configure dotenv to load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Check if Gemini API key is available
const apiKey = process.env.GEMINI_API_KEY;
const hasApiKey = !!apiKey;

console.log(`API Key available: ${hasApiKey}`);

// Check if Pinecone API key is available
const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexName = process.env.PINECONE_INDEX_NAME || 'fingenie-finance-vectors';
const hasPineconeApiKey = !!pineconeApiKey;

// Set to false to enable full functionality with Pinecone
const SIMPLIFIED_MODE = !hasPineconeApiKey;
console.log(`Running in ${SIMPLIFIED_MODE ? 'simplified mode without knowledge base integration' : 'full mode with knowledge base integration'}`);

// Initialize Pinecone if API key is available
let pineconeInitialized = false;
if (hasPineconeApiKey && !SIMPLIFIED_MODE) {
  try {
    initializePinecone(pineconeApiKey, pineconeIndexName);
    pineconeInitialized = true;
    console.log('Pinecone client initialized successfully');
  } catch (error) {
    console.error('Error initializing Pinecone client:', error);
    console.log('Falling back to simplified mode without knowledge base');
  }
}

// Initialize the Gemini AI client if API key is available
let genAI = null;

if (hasApiKey) {
  console.log('The FinGenie chatbot will work with Gemini AI');
  
  try {
    // Import the Google Generative AI library using the latest approach
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    
    // Initialize the Gemini AI client
    genAI = new GoogleGenerativeAI(apiKey);
    
    console.log('Gemini AI client initialized successfully with key:', apiKey.substring(0, 5) + '...');
  } catch (error) {
    console.error('Error initializing Gemini AI client:', error);
    genAI = null;
  }
} else {
  console.log('No Gemini API key found. The FinGenie chatbot will use fallback responses.');
}

/**
 * Get relevant context from Pinecone based on the user's query
 * @param {string} query - The user's query
 * @returns {Promise<string>} - The relevant context from Pinecone
 */
async function getRelevantContext(query) {
  if (SIMPLIFIED_MODE || !pineconeInitialized) {
    console.log('Running in simplified mode or Pinecone not initialized, skipping context retrieval');
    return '';
  }

  try {
    console.log('Generating embedding for query:', query);
    const queryEmbedding = await generateEmbedding(query);
    
    console.log('Querying Pinecone for similar vectors');
    // Get the top 5 most relevant chunks from Pinecone
    const matches = await querySimilarVectors(queryEmbedding, 5);
    
    if (!matches || matches.length === 0) {
      console.log('No relevant context found in Pinecone');
      return '';
    }
    
    console.log(`Found ${matches.length} relevant chunks in Pinecone`);
    
    // Format the context for the AI
    const formattedContext = matches.map((match, index) => {
      return `[Document ${index + 1} (Similarity: ${match.score.toFixed(2)})]: ${match.metadata.text}`;
    }).join('\n\n');
    
    return formattedContext;
  } catch (error) {
    console.error('Error getting relevant context from Pinecone:', error);
    return '';
  }
}

// Function to check if a query is specifically asking for news
async function isNewsQuery(message) {
  const newsKeywords = [
    'news', 'latest', 'headlines', 'recent', 'update', 'updates', 'article', 'articles',
    'report', 'reports', 'press release', 'announcement', 'announcements',
    'what\'s happening', 'what happened', 'current events'
  ];
  
  const lowercaseMessage = message.toLowerCase();
  
  // Check if the message contains any news keywords
  return newsKeywords.some(keyword => lowercaseMessage.includes(keyword));
}

// Function to generate navigation links to news categories
function generateNewsNavigationLinks(category = '') {
  // Base URL for the news page
  const baseNewsUrl = '/news';
  
  // Define available news categories
  const categories = {
    'markets': `${baseNewsUrl}/markets`,
    'economy': `${baseNewsUrl}/economy`,
    'companies': `${baseNewsUrl}/companies`,
    'technology': `${baseNewsUrl}/technology`,
    'personal finance': `${baseNewsUrl}/personal-finance`,
    'cryptocurrency': `${baseNewsUrl}/cryptocurrency`
  };
  
  // If a specific category is requested, return just that link
  if (category && categories[category.toLowerCase()]) {
    return `[${category.charAt(0).toUpperCase() + category.slice(1)} News](${categories[category.toLowerCase()]})`;
  }
  
  // Otherwise, return links to all categories
  let links = 'You can explore our news sections:\n';
  Object.entries(categories).forEach(([name, url]) => {
    links += `- [${name.charAt(0).toUpperCase() + name.slice(1)}](${url})\n`;
  });
  
  return links;
}

// Function to enhance a response with news recommendations
async function enhanceResponseWithNews(message, response) {
  try {
    // Extract potential category from message
    const categoryKeywords = ['markets', 'economy', 'companies', 'technology', 'personal finance', 'cryptocurrency'];
    let detectedCategory = '';
    
    for (const category of categoryKeywords) {
      if (message.toLowerCase().includes(category)) {
        detectedCategory = category;
        break;
      }
    }
    
    // Fetch relevant news for the query
    const relevantNews = await fetchFinancialNews(message, 5, detectedCategory);
    
    if (!relevantNews || relevantNews.length === 0) {
      // If no news found but category was detected, at least provide navigation
      if (detectedCategory) {
        return response + '\n\n' + generateNewsNavigationLinks(detectedCategory);
      }
      return response;
    }
    
    // Create a news recommendation section
    let newsSection = '\n\n**Recommended News Articles:**\n';
    relevantNews.forEach((news, index) => {
      newsSection += `${index + 1}. [${news.title}](${news.url}) - ${news.source}\n`;
    });
    
    // Add navigation links based on detected category or general
    newsSection += '\n' + generateNewsNavigationLinks(detectedCategory);
    
    // Append the news section to the response
    return response + newsSection;
  } catch (error) {
    console.error('Error enhancing response with news:', error);
    return response;
  }
}

// Enhanced fallback responses to provide more useful information
const fallbackResponses = {
  greeting: "Hello! I am FinGenie, your financial assistant. How can I help you today?",
  
  stocks: "The stock market has been showing mixed signals recently. Major indices like the S&P 500 and Dow Jones have experienced some volatility. Key factors influencing markets include interest rates, inflation data, corporate earnings, and geopolitical events. Would you like information about a specific sector or investment strategy?",
  
  investing: "For investment advice, I recommend starting with these principles:\n\n1. Set clear financial goals (short-term, medium-term, long-term)\n2. Build an emergency fund covering 3-6 months of expenses\n3. Pay off high-interest debt\n4. Take advantage of tax-advantaged accounts like 401(k)s and IRAs\n5. Diversify across asset classes (stocks, bonds, real estate, etc.)\n6. Consider your risk tolerance and time horizon\n7. Keep costs low with index funds or ETFs\n8. Rebalance periodically\n9. Dollar-cost average rather than timing the market\n10. Seek professional advice if needed",
  
  crypto: "Cryptocurrency markets remain highly volatile. Bitcoin and Ethereum are the largest by market cap, but remember that crypto investments carry significant risk. Before investing in crypto, understand blockchain technology basics, use reputable exchanges, consider cold storage for security, only invest what you can afford to lose, and stay informed about regulatory developments.",
  
  retirement: "Retirement planning should include considerations for your desired lifestyle, expected lifespan, inflation, and investment returns. Starting early and maximizing tax-advantaged accounts like 401(k)s and IRAs is generally recommended. The 4% rule suggests withdrawing 4% of your retirement savings in the first year, then adjusting for inflation each subsequent year. Consider working with a financial advisor to create a personalized retirement strategy.",
  
  finance_basics: "Finance is the management of money and includes activities like investing, borrowing, lending, budgeting, saving, and forecasting. Personal finance focuses on individual or family financial decisions, while corporate finance deals with business funding and capital structure. Key concepts include compound interest, risk vs. return, diversification, liquidity, and time value of money.",
  
  budgeting: "Creating a budget starts with tracking your income and expenses. The 50/30/20 rule suggests allocating 50% to needs, 30% to wants, and 20% to savings and debt repayment. Tools like spreadsheets, apps (Mint, YNAB, Personal Capital), or the envelope system can help you stay organized. Review and adjust your budget regularly as your financial situation changes.",
  
  credit: "Your credit score (typically 300-850) affects your ability to borrow money and the interest rates you'll pay. Factors affecting your score include payment history (35%), amounts owed (30%), length of credit history (15%), new credit (10%), and credit mix (10%). To improve your score, pay bills on time, keep credit utilization below 30%, don't close old accounts, limit new applications, and regularly check your credit report for errors.",
  
  taxes: "Tax planning involves understanding different types of taxes (income, capital gains, property, sales) and finding legal ways to minimize your tax burden. Strategies include maximizing deductions and credits, tax-loss harvesting, contributing to tax-advantaged accounts, timing income and expenses, and considering tax implications of investments. Consult with a tax professional for personalized advice.",
  
  insurance: "Insurance protects against financial loss. Essential types include health insurance (medical expenses), auto insurance (vehicle damage/liability), homeowners/renters insurance (property protection), life insurance (income replacement for dependents), and disability insurance (income if unable to work). Review coverage annually, compare quotes, understand policy terms, and consider deductibles vs. premiums.",
  
  dollar_cost_averaging: "Dollar-cost averaging is an investment strategy where you invest a fixed amount regularly, regardless of market conditions. This approach reduces the impact of market volatility and eliminates the need to time the market. When prices are low, your fixed amount buys more shares; when prices are high, it buys fewer. This typically results in a lower average cost per share over time and helps maintain disciplined investing habits.",
  
  pe_ratio: "The Price-to-Earnings (P/E) ratio is a valuation metric that compares a company's stock price to its earnings per share. A high P/E suggests investors expect higher growth in the future, while a low P/E might indicate an undervalued stock or concerns about future performance. The 'good' P/E ratio varies by industry and market conditions. Generally, the S&P 500 average is around 15-25. Always compare a company's P/E to its industry peers and historical averages rather than using an absolute number.",
  
  emergency_fund: "An emergency fund is money set aside for unexpected expenses or financial hardships like medical emergencies, car repairs, or job loss. Aim to save 3-6 months of essential expenses in a readily accessible account like a high-yield savings account. Start small if needed (even $500-$1,000 helps), make regular contributions, use windfalls (tax refunds, bonuses) to boost savings, and only use the fund for true emergencies.",
  
  stocks_vs_bonds: "Stocks represent ownership in a company and offer potential for higher returns but with higher risk and volatility. Bonds are loans to companies or governments that typically provide more stable, lower returns with less risk. Stocks generate returns through price appreciation and dividends, while bonds provide regular interest payments and return of principal at maturity. Most investors include both in their portfolio, adjusting the ratio based on risk tolerance, time horizon, and financial goals.",
  
  news: async (message) => {
    try {
      // Extract potential category from message
      const categoryKeywords = ['markets', 'economy', 'companies', 'technology', 'personal finance', 'cryptocurrency'];
      let detectedCategory = '';
      
      for (const category of categoryKeywords) {
        if (message.toLowerCase().includes(category)) {
          detectedCategory = category;
          break;
        }
      }
      
      // Fetch relevant news
      const relevantNews = await fetchFinancialNews(message, 5, detectedCategory);
      
      let response = "I'd be happy to help you find the latest financial news. ";
      
      if (relevantNews && relevantNews.length > 0) {
        response += "Here are some relevant articles I found:\n\n";
        relevantNews.forEach((news, index) => {
          response += `${index + 1}. [${news.title}](${news.url}) - ${news.source}\n`;
          if (news.snippet) {
            response += `   ${news.snippet}\n\n`;
          }
        });
      }
      
      // Add navigation links
      response += "\n" + generateNewsNavigationLinks(detectedCategory);
      
      return response;
    } catch (error) {
      console.error('Error generating news response:', error);
      return "You can explore our news sections:\n- [Markets](/news/markets)\n- [Economy](/news/economy)\n- [Companies](/news/companies)\n- [Technology](/news/technology)\n- [Personal Finance](/news/personal-finance)\n- [Cryptocurrency](/news/cryptocurrency)";
    }
  },
  
  default: "I can provide information on various financial topics including investing basics, retirement planning, budgeting, credit management, tax strategies, insurance needs, and specific investment vehicles like stocks, bonds, mutual funds, ETFs, and more. What specific aspect of finance would you like to learn about?"
};

// Enhanced function to determine the type of query for fallback responses
async function categorizeQuery(message) {
  const lowercaseMessage = message.toLowerCase();
  
  // Check for greetings
  if (/^(hi|hello|hey|greetings|howdy|namaste|hola)\b/i.test(message)) {
    return 'greeting';
  }
  
  // Check for direct news queries
  if (await isNewsQuery(message)) {
    return 'news';
  }
  
  // Stock market related
  if (lowercaseMessage.match(/\b(stock|market|index|indices|s&p|dow|nasdaq|nyse|bull|bear|trading|trader)\b/) ||
      lowercaseMessage.includes('current market') ||
      lowercaseMessage.includes('market trends')) {
    return 'stocks';
  }
  
  // Investing related
  if (lowerMessage.match(/\b(invest|investing|portfolio|fund|asset|allocation|diversif|return|risk)\b/) ||
      lowerMessage.includes('start investing') ||
      lowerMessage.includes('how to invest') ||
      lowerMessage.includes('investment strategy')) {
    return 'investing';
  }
  
  // Cryptocurrency related
  if (lowerMessage.match(/\b(crypto|bitcoin|ethereum|btc|eth|altcoin|blockchain|token|coin|mining|wallet)\b/)) {
    return 'crypto';
  }
  
  // Retirement planning
  if (lowerMessage.match(/\b(retire|retirement|401k|ira|pension|social security|annuity)\b/)) {
    return 'retirement';
  }
  
  // Basic finance concepts
  if (lowerMessage.match(/\b(finance|money|capital|liquidity|cash flow|balance sheet|income statement)\b/) ||
      lowerMessage.includes('what is finance')) {
    return 'finance_basics';
  }
  
  // Budgeting and saving
  if (lowerMessage.match(/\b(budget|budgeting|save|saving|expense|spending|income|cash|debt|loan)\b/)) {
    return 'budgeting';
  }
  
  // Credit and loans
  if (lowerMessage.match(/\b(credit|score|fico|loan|mortgage|interest|debt|borrow|lending)\b/)) {
    return 'credit';
  }
  
  // Taxes
  if (lowerMessage.match(/\b(tax|taxes|irs|deduction|credit|filing|return|audit|income tax)\b/)) {
    return 'taxes';
  }
  
  // Insurance
  if (lowerMessage.match(/\b(insurance|policy|premium|coverage|deductible|claim|risk|protection)\b/)) {
    return 'insurance';
  }
  
  // Dollar-cost averaging
  if (lowerMessage.includes('dollar-cost') || lowerMessage.includes('dollar cost') || 
      lowerMessage.includes('dca') || lowerMessage.includes('averaging')) {
    return 'dollar_cost_averaging';
  }
  
  // P/E ratio
  if (lowerMessage.includes('p/e') || lowerMessage.includes('pe ratio') || 
      lowerMessage.includes('price to earnings') || lowerMessage.includes('price-to-earnings')) {
    return 'pe_ratio';
  }
  
  // Emergency fund
  if (lowerMessage.includes('emergency fund') || lowerMessage.includes('rainy day fund') || 
      lowerMessage.includes('emergency savings')) {
    return 'emergency_fund';
  }
  
  // Stocks vs bonds
  if ((lowerMessage.includes('stocks') && lowerMessage.includes('bonds')) ||
      lowerMessage.includes('difference between stocks and bonds')) {
    return 'stocks_vs_bonds';
  }
  
  // Default response for unrecognized queries
  return 'default';
}

// Function to get conversation history from MongoDB
async function getConversationHistory(userId) {
  try {
    let conversation = await Conversation.findOne({ userId });
    
    if (!conversation) {
      // Create a new conversation if one doesn't exist
      conversation = new Conversation({
        userId,
        messages: []
      });
    }
    
    return conversation;
  } catch (error) {
    console.error('Error retrieving conversation history:', error);
    throw error;
  }
}

// Function to add message to conversation history in MongoDB
async function addMessageToHistory(userId, message, sender) {
  try {
    const conversation = await getConversationHistory(userId);
    
    conversation.messages.push({
      sender,
      text: message,
      timestamp: new Date()
    });
    
    await conversation.save();
    return conversation;
  } catch (error) {
    console.error('Error adding message to history:', error);
    throw error;
  }
}

// This function is replaced by the enhanced getRelevantContext function above

/**
 * Get response from Gemini AI using the latest API approach with vector search enhancement
 * @param {string} userId - User ID
 * @param {string} message - User's message
 * @param {Object} conversationHistory - Conversation history
 * @returns {string} - AI response
 */
async function getGeminiResponse(userId, message, conversationHistory) {
  if (!genAI) {
    console.error('Gemini AI client not initialized, apiKey exists:', !!apiKey);
    throw new Error('Gemini AI client not initialized');
  }
  
  try {
    console.log('Getting Gemini response for message:', message);
    
    // Get the Gemini model - using gemini-1.5-flash for better performance
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash'
    });
    
    // Format conversation history for Gemini
    const formattedHistory = [];
    
    // Add conversation history if available
    if (conversationHistory && conversationHistory.messages && conversationHistory.messages.length > 0) {
      // We'll only use the last few messages to avoid token limits
      const recentMessages = conversationHistory.messages.slice(-6); // Last 6 messages (3 exchanges)
      
      for (const msg of recentMessages) {
        formattedHistory.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }
    
    console.log('Formatted history length:', formattedHistory.length);
    
    // Get relevant context from Pinecone vector database
    const relevantContext = await getRelevantContext(message);
    console.log('Retrieved context length:', relevantContext.length);
    
    // Get real-time financial data based on the user's query
    console.log('Fetching real-time financial data for query:', message);
    const financialData = await getRealtimeFinancialData(message);
    const formattedFinancialData = formatFinancialDataForPrompt(financialData);
    console.log('Retrieved financial data for symbols:', financialData?.symbols || []);
    
    // Get relevant news based on the user's query
    console.log('Fetching relevant news for query:', message);
    const relevantNews = await fetchFinancialNews(message, 3);
    let formattedNews = '';
    
    if (relevantNews && relevantNews.length > 0) {
      formattedNews = '--- RELEVANT FINANCIAL NEWS ---\n\n';
      relevantNews.forEach((news, index) => {
        formattedNews += `${index + 1}. ${news.title} (${news.source})\n`;
        formattedNews += `   ${news.snippet}\n\n`;
      });
      console.log(`Retrieved ${relevantNews.length} relevant news articles`);
    }
    
    // Set generation config
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    };
    
    // Create the system prompt with context
    const systemPrompt = `You are FinGenie, a polite, helpful, and professional financial assistant. Always respond to user questions in a clean, structured format using markdown. If the user asks for financial news, company share price, investment insights, or definitions, use the following structure in your replies:

1. **Title** (bolded and relevant to the topic)
2. **Answer Summary:** A 2–3 sentence overview or definition
3. **Key Information:** A bullet list of key details or steps
4. **Additional Insights (if needed):** Brief explanations or tips
5. **Note/Disclaimer:** Always remind the user that financial data may change and to consult official sources or professionals for investment advice
6. If the user asks for real-time data (like stock prices), say:
   - "📈 *Real-time share prices may change. Please check reliable financial sites like Yahoo Finance or Google Finance for the latest data.*"

Keep the tone friendly but professional. Always aim for clarity. Respond only with relevant financial or investing information. If asked an unrelated question, politely redirect the user.

${relevantContext ? `--- RELEVANT DOCUMENT EXCERPTS ---\n\n${relevantContext}\n\n` : ''}
${formattedFinancialData ? `--- REAL-TIME FINANCIAL DATA ---\n\n${formattedFinancialData}\n\n` : ''}
${formattedNews ? `${formattedNews}\n\n` : ''}

Use the above information if relevant to the user's query. If the information doesn't address the query completely, provide general financial advice based on your knowledge.

When discussing news, you can refer to the provided articles and offer to show more details if the user is interested.`;
    
    // Prepare the content for the API call
    const content = [
      { role: 'user', parts: [{ text: systemPrompt + '\n\nUser query: ' + message }] }
    ];
    
    // Add conversation history if available
    if (formattedHistory.length > 0) {
      content.unshift(...formattedHistory);
    }
    
    // Generate content using the latest API approach
    const result = await model.generateContent({
      contents: content,
      generationConfig
    });
    
    const response = result.response;
    
    console.log('Received response from Gemini');
    return response.text();
  } catch (error) {
    console.error('Error getting response from Gemini:', error);
    throw error;
  }
}

const handleChat = async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required in the request body.' });
    }

    console.log(`User ${userId} sent: "${message}"`);
    
    // Add user's message to conversation history in MongoDB
    let conversation;
    try {
      conversation = await addMessageToHistory(userId, message, 'user');
      console.log('Added user message to conversation history');
    } catch (dbError) {
      console.error('Error with MongoDB conversation:', dbError);
      // Continue even if DB fails - we'll use in-memory for this request
      conversation = { messages: [{ sender: 'user', text: message }] };
    }
    
    let botResponseContent;
    let useAI = true;
    
    // Check if we should use AI or fallback to predefined responses
    if (!apiKey || !genAI) {
      console.log('Using fallback responses (Gemini AI not available)');
      useAI = false;
    }
    
    // Try using the AI first
    if (useAI) {
      try {
        console.log('Attempting to get response from Gemini AI');
        botResponseContent = await getGeminiResponse(userId, message, conversation);
        console.log('Successfully got response from Gemini AI');
      } catch (aiError) {
        console.error('Error using Gemini AI:', aiError);
        useAI = false;
      }
    }
    
    // Use fallback responses if AI failed or is not available
    if (!useAI || !botResponseContent) {
      console.log('Using enhanced fallback response system');
      const queryType = await categorizeQuery(message);
      console.log('Query categorized as:', queryType);
      
      // Check if the fallback response is a function (for async responses)
      if (typeof fallbackResponses[queryType] === 'function') {
        botResponseContent = await fallbackResponses[queryType](message);
      } else {
        botResponseContent = fallbackResponses[queryType];
      }
    }
    
    // Add bot's response to conversation history in MongoDB
    try {
      await addMessageToHistory(userId, botResponseContent, 'bot');
      console.log('Added bot response to conversation history');
    } catch (dbError) {
      console.error('Error saving bot response to MongoDB:', dbError);
      // Continue even if DB fails
    }
    
    console.log(`FinGenie responded: "${botResponseContent.substring(0, 100)}${botResponseContent.length > 100 ? '...' : ''}"`);
    
    // Check if this is a news-related query or if we should enhance with news anyway
    const isNewsRelated = await isNewsQuery(message);
    
    // If it's a news query or randomly decide to enhance some responses with news (30% chance)
    if (isNewsRelated || Math.random() < 0.3) {
      console.log('Enhancing response with news recommendations');
      botResponseContent = await enhanceResponseWithNews(message, botResponseContent);
    }
    
    // Return response in the format expected by the frontend
    res.json({ message: botResponseContent });
  } catch (error) {
    console.error('Error in FinGenie chat handler:', error);
    res.status(500).json({ 
      error: 'FinGenie is currently experiencing technical difficulties. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export { handleChat };
