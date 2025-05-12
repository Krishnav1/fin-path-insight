import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Send, 
  Bot, 
  RefreshCw, 
  X
} from 'lucide-react';

const FinGenieChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Generate a session ID for users who aren't logged in
  const [sessionId] = useState(() => {
    // Try to get user ID from localStorage if available
    const storedUserId = localStorage.getItem('userId');
    return storedUserId || `guest_${Math.random().toString(36).substring(2, 10)}`;
  });

  // Scroll to bottom of chat when conversation updates
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, isOpen]);

  // Add initial greeting when chat is first opened
  useEffect(() => {
    if (isOpen && conversation.length === 0) {
      setConversation([
        { 
          sender: 'bot', 
          text: 'Hello! I am FinGenie, your financial assistant. How can I help you today?',
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, conversation.length]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!message.trim()) return;
    
    const userMessage = {
      sender: 'user',
      text: message,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/fingenie/chat', {
        userId: sessionId,
        message: userMessage.text
      });
      
      setConversation(prev => [
        ...prev, 
        { 
          sender: 'bot', 
          text: response.data.reply,
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      console.error('Error sending message to FinGenie:', err);
      setError('Sorry, I encountered an error. Please try again later.');
      
      // Add error message to conversation
      if (err.response?.data?.error) {
        setConversation(prev => [
          ...prev, 
          { 
            sender: 'bot', 
            text: `Error: ${err.response.data.error}`,
            timestamp: new Date(),
            isError: true
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearConversation = () => {
    setConversation([
      { 
        sender: 'bot', 
        text: 'Conversation cleared. How can I help you today?',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg flex items-center justify-center"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>
      
      {/* Chat window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-lg shadow-xl flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center">
              <Bot size={20} className="mr-2" />
              <h3 className="font-semibold">FinGenie</h3>
            </div>
            <button 
              onClick={clearConversation}
              className="text-white/80 hover:text-white"
              title="Clear conversation"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 max-h-96 bg-gray-50">
            {conversation.map((msg, index) => (
              <div 
                key={index} 
                className={`mb-3 ${msg.sender === 'user' ? 'text-right' : ''}`}
              >
                <div 
                  className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : msg.isError 
                        ? 'bg-red-100 text-red-700 rounded-bl-none'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <div className="text-sm">{msg.text}</div>
                  <div className="text-xs mt-1 opacity-70">
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="mb-3">
                <div className="inline-block px-4 py-2 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-lg disabled:bg-blue-400"
              disabled={isLoading || !message.trim()}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FinGenieChat;
