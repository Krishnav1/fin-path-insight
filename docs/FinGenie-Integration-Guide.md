# FinGenie Integration Guide

This guide explains how to integrate FinGenie into your main application and how to train the model to improve its capabilities over time.

## Table of Contents
1. [Integration Steps](#integration-steps)
2. [Component Structure](#component-structure)
3. [Training the Model](#training-the-model)
4. [Advanced Features](#advanced-features)
5. [Troubleshooting](#troubleshooting)

## Integration Steps

### 1. Add FinGenie Provider to Your App

In your main application entry point (e.g., `App.jsx` or `main.jsx`), wrap your application with the `FinGenieProvider`:

```jsx
// src/App.jsx or src/main.jsx
import { FinGenieProvider } from './contexts/FinGenieContext';

function App() {
  return (
    <FinGenieProvider>
      {/* Your app components */}
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/fingenie" element={<FinGeniePage />} />
          {/* Other routes */}
        </Routes>
      </Router>
    </FinGenieProvider>
  );
}
```

### 2. Add FinGenie Chat Widget to Your Layout

For a floating chat widget that's available throughout your application:

```jsx
// src/components/Layout.jsx
import FinGenieChat from './components/FinGenie/FinGenieChat';

function Layout({ children }) {
  return (
    <div>
      {/* Your app header, navigation, etc. */}
      <main>{children}</main>
      <FinGenieChat /> {/* This will add the floating chat button */}
      {/* Your app footer */}
    </div>
  );
}
```

### 3. Add FinGenie Page to Your Navigation

Add a link to the FinGenie page in your navigation menu:

```jsx
// In your navigation component
<Link to="/fingenie" className="nav-link">
  <Bot size={18} className="mr-2" />
  FinGenie AI Assistant
</Link>
```

### 4. Environment Variables

Make sure your `.env` file contains the Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

## Component Structure

FinGenie consists of the following components:

1. **Backend**:
   - `fingenieController.js`: Handles API requests, interacts with Gemini, and manages conversation storage
   - `fingenieRoutes.js`: Defines API endpoints
   - `Conversation.js`: MongoDB model for storing conversations

2. **Frontend**:
   - `FinGenieContext.jsx`: Context provider for global state management
   - `FinGenieChat.jsx`: Floating chat widget component
   - `FinGeniePage.jsx`: Full-page chat interface

## Training the Model

### 1. Collecting Training Data

To improve FinGenie's responses, you should collect conversation data:

1. **Conversation Logging**:
   - The MongoDB `Conversation` model already stores all user-bot interactions
   - Periodically export this data for analysis and training

2. **User Feedback Collection**:
   - Add a feedback mechanism to rate responses (thumbs up/down)
   - Store this feedback alongside the conversations

Example feedback component to add to `FinGenieChat.jsx`:

```jsx
// Add this to each bot message
<div className="flex items-center mt-2 space-x-2">
  <span className="text-xs text-gray-500">Was this helpful?</span>
  <button 
    onClick={() => submitFeedback(msg.id, 'positive')}
    className="text-gray-400 hover:text-green-500"
  >
    <ThumbsUp size={14} />
  </button>
  <button 
    onClick={() => submitFeedback(msg.id, 'negative')}
    className="text-gray-400 hover:text-red-500"
  >
    <ThumbsDown size={14} />
  </button>
</div>
```

### 2. Fine-tuning with Gemini

Google's Gemini Pro supports fine-tuning through their API. Here's how to prepare your data:

1. **Format Your Data**:
   - Export conversations from MongoDB
   - Transform into Gemini's fine-tuning format:

```javascript
const finetuningSamples = conversations.map(conversation => {
  return {
    messages: conversation.messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      content: msg.text
    }))
  };
});
```

2. **Create a Fine-tuning Job**:
   - Use the Gemini API to create a fine-tuning job
   - Monitor the job status
   - Once complete, update your API to use the fine-tuned model

Example code for fine-tuning (to be implemented in a separate admin script):

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

async function createFineTuningJob(apiKey, trainingData) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // This is a simplified example - check the latest Gemini documentation
  // for the exact fine-tuning API endpoints and parameters
  const response = await genAI.createFineTuningJob({
    model: 'gemini-1.0-pro',
    trainingData: trainingData,
    hyperparameters: {
      learningRate: 1e-5,
      epochs: 3
    }
  });
  
  return response.jobId;
}
```

### 3. Retrieval Augmented Generation (RAG)

To enhance FinGenie with specific financial knowledge:

1. **Create a Knowledge Base**:
   - Collect financial documents, articles, and data
   - Process and index this content using a vector database (e.g., Pinecone, Weaviate)

2. **Implement RAG in the Controller**:

```javascript
// In fingenieController.js
async function getGeminiResponseWithRAG(userId, message, conversationHistory) {
  // 1. Search for relevant documents based on the query
  const relevantDocs = await searchVectorDB(message);
  
  // 2. Format conversation history for Gemini
  const formattedHistory = conversationHistory.messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));
  
  // 3. Create a context-enhanced prompt with the relevant documents
  const contextEnhancedPrompt = `
    You are FinGenie, a specialized financial assistant. 
    Use the following information to help answer the user's question:
    
    ${relevantDocs.map(doc => doc.content).join('\n\n')}
    
    Current user query: ${message}
  `;
  
  // 4. Initialize chat with history
  const chat = model.startChat({
    history: formattedHistory,
    generationConfig: {
      maxOutputTokens: 2000,
      temperature: 0.7,
    },
  });
  
  // 5. Send the context-enhanced prompt
  const result = await chat.sendMessage(contextEnhancedPrompt);
  
  return result.response.text();
}
```

## Advanced Features

### 1. Financial Data Integration

Enhance FinGenie by connecting it to real-time financial data:

```javascript
// Example of integrating stock data API in fingenieController.js
async function getStockData(symbol) {
  try {
    const response = await axios.get(`https://api.example.com/stocks/${symbol}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return null;
  }
}

// Then in your getGeminiResponse function:
if (message.toLowerCase().includes('stock price') || message.toLowerCase().includes('ticker')) {
  // Extract stock symbol from message
  const symbol = extractStockSymbol(message);
  if (symbol) {
    const stockData = await getStockData(symbol);
    if (stockData) {
      // Add stock data to the prompt
      enhancedPrompt = `${message}\n\nCurrent data for ${symbol}: Price: $${stockData.price}, Change: ${stockData.change}%`;
    }
  }
}
```

### 2. Personalization

Implement user-specific personalization:

```javascript
// In fingenieController.js
async function getPersonalizedResponse(userId, message, conversationHistory) {
  // Get user preferences/portfolio from database
  const userProfile = await getUserProfile(userId);
  
  let personalizedPrompt = message;
  
  if (userProfile) {
    personalizedPrompt = `
      The user has the following profile:
      - Investment style: ${userProfile.investmentStyle}
      - Risk tolerance: ${userProfile.riskTolerance}
      - Financial goals: ${userProfile.goals.join(', ')}
      
      With this context in mind, please provide a personalized response to: ${message}
    `;
  }
  
  // Continue with Gemini API call using personalizedPrompt
}
```

## Troubleshooting

### Common Issues and Solutions

1. **API Key Issues**:
   - Ensure `GEMINI_API_KEY` is correctly set in your `.env` file
   - Check that dotenv is properly configured to load the environment variables

2. **MongoDB Connection Problems**:
   - Verify MongoDB connection string in `.env`
   - Ensure the MongoDB service is running
   - Check network connectivity to MongoDB Atlas if using cloud hosting

3. **CORS Errors**:
   - Ensure your backend has proper CORS configuration
   - Check that frontend API calls use the correct URL

4. **Rate Limiting**:
   - Implement caching to reduce API calls to Gemini
   - Add rate limiting on your own API endpoints

### Debugging

Add the following to your `fingenieController.js` for better debugging:

```javascript
// Debug mode flag
const DEBUG = process.env.NODE_ENV === 'development';

// Enhanced error logging
function logError(context, error) {
  if (DEBUG) {
    console.error(`[FinGenie Error] ${context}:`, error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  } else {
    console.error(`[FinGenie Error] ${context}: ${error.message}`);
  }
}
```

---

By following this guide, you'll have a fully functional FinGenie AI assistant integrated into your application, with the ability to continuously improve its capabilities through training and additional features.
