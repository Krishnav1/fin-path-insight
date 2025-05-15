import React, { useState, useEffect, useRef } from 'react';
import { finGenieApi } from '../../services/fastApiService';
import ReactMarkdown from 'react-markdown';
import './FinGenieChat.css';

const FinGenieChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');
  const messagesEndRef = useRef(null);

  // Generate a unique user ID on component mount
  useEffect(() => {
    const generatedUserId = 'user_' + Math.random().toString(36).substring(2, 15);
    setUserId(generatedUserId);
    
    // Add welcome message
    setMessages([
      {
        sender: 'bot',
        text: "Hello! I'm FinGenie, your financial assistant. How can I help you today?",
        timestamp: new Date()
      }
    ]);
  }, []);

  // Scroll to bottom of messages when new message is added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      sender: 'user',
      text: input,
      timestamp: new Date()
    };
    
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // Send message to API
      const response = await finGenieApi.sendChatMessage(userId, input);
      
      // Add bot response to chat
      const botMessage = {
        sender: 'bot',
        text: response.message,
        timestamp: new Date()
      };
      
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Add error message to chat
      const errorMessage = {
        sender: 'bot',
        text: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
        isError: true
      };
      
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Clear conversation
  const handleClearConversation = async () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      try {
        await finGenieApi.clearConversation(userId);
        
        // Reset messages to just the welcome message
        setMessages([
          {
            sender: 'bot',
            text: "Hello! I'm FinGenie, your financial assistant. How can I help you today?",
            timestamp: new Date()
          }
        ]);
      } catch (err) {
        console.error('Error clearing conversation:', err);
      }
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fingenie-chat-container">
      <div className="chat-header">
        <div className="chat-title">
          <span className="bot-icon">🤖</span>
          <h2>FinGenie</h2>
        </div>
        <div className="chat-actions">
          <button className="clear-button" onClick={handleClearConversation}>
            Clear Chat
          </button>
        </div>
      </div>
      
      <div className="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'} ${message.isError ? 'error-message' : ''}`}
          >
            <div className="message-content">
              {message.sender === 'bot' ? (
                <ReactMarkdown>{message.text}</ReactMarkdown>
              ) : (
                <p>{message.text}</p>
              )}
            </div>
            <div className="message-timestamp">{formatTimestamp(message.timestamp)}</div>
          </div>
        ))}
        
        {loading && (
          <div className="message bot-message loading-message">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask FinGenie about finance, investing, markets..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
      
      <div className="chat-footer">
        <p>
          FinGenie provides general information, not financial advice. 
          Always consult with qualified professionals for investment decisions.
        </p>
      </div>
    </div>
  );
};

export default FinGenieChat;
