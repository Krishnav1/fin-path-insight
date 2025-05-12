import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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

  // Initialize session ID on component mount
  useEffect(() => {
    // Try to get user ID from localStorage if available
    const storedUserId = localStorage.getItem('userId');
    const newSessionId = storedUserId || `guest_${Math.random().toString(36).substring(2, 10)}`;
    setSessionId(newSessionId);
  }, []);

  // Send a message to FinGenie
  const sendMessage = async (message) => {
    if (!message.trim() || !sessionId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:3003/api/fingenie/chat', {
        userId: sessionId,
        message: message
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const botResponse = response.data.message || 'I\'m not sure how to answer that. Could you try asking something about finance or investing?';
      
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
      console.error('Error sending message to FinGenie:', err);
      setError(err.response?.data?.error || 'Failed to communicate with FinGenie');
      return null;
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
