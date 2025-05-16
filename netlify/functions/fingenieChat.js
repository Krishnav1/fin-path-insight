const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "CORS preflight successful" })
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { userId, message } = body;
    
    if (!userId || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields: userId and message" })
      };
    }

    // Get conversation history from Supabase
    const { data: chatHistory, error: historyError } = await supabase
      .from("chat_history")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: true });

    if (historyError) {
      console.error("Error fetching chat history:", historyError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to fetch chat history" })
      };
    }

    // Format conversation history for Gemini
    const formattedHistory = chatHistory.map(entry => ({
      role: entry.is_user ? "user" : "model",
      parts: [{ text: entry.content }]
    }));

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Start chat with history
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Send message to Gemini
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const aiReply = response.text();

    // Save user message to Supabase
    const { error: userMsgError } = await supabase
      .from("chat_history")
      .insert([{
        user_id: userId,
        content: message,
        is_user: true,
        timestamp: new Date().toISOString()
      }]);

    if (userMsgError) {
      console.error("Error saving user message:", userMsgError);
    }

    // Save AI response to Supabase
    const { error: aiMsgError } = await supabase
      .from("chat_history")
      .insert([{
        user_id: userId,
        content: aiReply,
        is_user: false,
        timestamp: new Date().toISOString()
      }]);

    if (aiMsgError) {
      console.error("Error saving AI message:", aiMsgError);
    }

    // Return AI response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply: aiReply })
    };
  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};
