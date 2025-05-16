const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini API client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// In-memory storage for conversation history (in production, use a database)
const conversationHistory = {};

exports.handler = async (event, context) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Parse request body
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON payload' })
    };
  }

  // Extract userId and message from request
  const { userId, message } = body;

  if (!userId || !message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing userId or message in request body' })
    };
  }

  try {
    // Initialize conversation history for this user if it doesn't exist
    if (!conversationHistory[userId]) {
      conversationHistory[userId] = [];
    }

    // Add user message to history
    conversationHistory[userId].push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Prepare the conversation for Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Format the conversation history for Gemini
    const chat = model.startChat({
      history: conversationHistory[userId],
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    // Send the message to Gemini
    const result = await chat.sendMessage(message);
    const response = result.response;
    const botReply = response.text();

    // Add bot response to history
    conversationHistory[userId].push({
      role: 'model',
      parts: [{ text: botReply }]
    });

    // Limit conversation history to last 20 messages to prevent token limits
    if (conversationHistory[userId].length > 20) {
      conversationHistory[userId] = conversationHistory[userId].slice(-20);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // For CORS
      },
      body: JSON.stringify({
        response: botReply, // Changed from 'reply' to 'response' to match frontend expectations
        userId: userId
      })
    };
  } catch (error) {
    console.error('Error processing chat request:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: `Failed to process chat request: ${error.message}`,
        userId: userId
      })
    };
  }
};
