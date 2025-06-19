import React, { createContext, useContext, useState, useEffect } from 'react';
// Using fetch instead of axios for consistency
import { supabase } from '@/lib/supabase';

// Create context
const FinGenieContext = createContext();

// Custom hook to use the FinGenie context
export const useFinGenie = () => {
  const context = useContext(FinGenieContext);
  if (!context) {
    throw new Error('useFinGenie must be used within a FinGenieProvider');
  }
  return context;
};

// Provider component
export const FinGenieProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  // Initialize session ID on component mount
  useEffect(() => {
    // Try to get user ID from localStorage if available
    const storedUserId = localStorage.getItem('userId');
    const newSessionId = storedUserId || `guest_${Math.random().toString(36).substring(2, 10)}`;
    setSessionId(newSessionId);
  }, []);

  // Check if message is requesting a stock report
  const isStockReportRequest = (message) => {
    const lowerMessage = message.toLowerCase();
    return (
      (lowerMessage.includes('stock') || lowerMessage.includes('investment')) &&
      (lowerMessage.includes('report') || lowerMessage.includes('analysis')) &&
      (/[A-Z]{1,5}(\.[A-Z]{2,4})?/.test(message)) // Look for ticker symbols like AAPL or RELIANCE.NSE
    );
  };

  // Extract ticker symbol from message
  const extractTickerSymbol = (message) => {
    // Look for stock symbols (1-5 uppercase letters, optionally followed by .XX extension)
    const tickerMatch = message.match(/[A-Z]{1,5}(\.[A-Z]{2,4})?/);
    return tickerMatch ? tickerMatch[0] : null;
  };

  // Generate investment report
  const generateInvestmentReport = async (ticker, query) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/.netlify/functions/getInvestmentReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker,
          query: query || `What's the price forecast and market analysis on ${ticker} stock?`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate investment report');
      }

      const data = await response.json();
      setReportData(data);
      
      // Return a preview of the report with a link
      return `I've generated an investment report for ${ticker}. Here's a summary:\n\n${data.report.substring(0, 300)}...\n\n[View the full report by clicking the Investment Reports tab above]`;
    } catch (err) {
      console.error('Error generating investment report:', err);
      setError(err.message || 'Failed to generate investment report');
      return `I'm sorry, I couldn't generate an investment report for that ticker. ${err.message}`;
    } finally {
      setIsLoading(false);
    }
  };

  // Send a message to FinGenie
  const sendMessage = async (message) => {
    if (!message.trim() || !sessionId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let botResponse;
      
      // Check if this is a stock report request
      if (isStockReportRequest(message)) {
        const ticker = extractTickerSymbol(message);
        if (ticker) {
          botResponse = await generateInvestmentReport(ticker, message);
        } else {
          botResponse = "I'd be happy to generate an investment report for you, but I need a valid stock ticker symbol (like AAPL or RELIANCE.NSE). Could you please specify which stock you're interested in?";
        }
      } else {
        // Regular chat message - use Netlify function directly
        try {
          // Get the user's session token for authentication
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('No active user session found');
          }
          
          const response = await fetch('https://ydakwyplcqoshxcdllah.supabase.co/functions/v1/fingenie-chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              query: message
            })
          });
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          botResponse = data.response || 'I\'m not sure how to answer that. Could you try asking something about finance or investing?';
        } catch (apiErr) {
          console.error('Error with chat API:', apiErr);
          // Fallback message if the API is not available
          botResponse = "I'm currently experiencing connectivity issues with my knowledge base. Please try again later or ask me about generating an investment report for a specific stock (e.g., 'Generate an investment report for AAPL').";
        }
      }
      
      // Update conversations
      setConversations(prev => [
        ...prev,
        {
          id: Date.now(),
          userMessage: message,
          botResponse,
          timestamp: new Date()
        }
      ]);
      
      return botResponse;
    } catch (err) {
      console.error('Error processing message:', err);
      setError(err.message || 'Failed to process your request');
      return "I'm sorry, I encountered an error processing your request. Please try again.";
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all conversations
  const clearConversations = () => {
    setConversations([]);
  };

  // Value to be provided by the context
  const value = {
    sessionId,
    conversations,
    isLoading,
    error,
    reportData,
    sendMessage,
    clearConversations
  };

  return (
    <FinGenieContext.Provider value={value}>
      {children}
    </FinGenieContext.Provider>
  );
};

export default FinGenieContext;
