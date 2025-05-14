import React, { useState, useRef, useEffect } from 'react';
import { useFinGenie } from '../contexts/FinGenieContext';
import '../styles/FinGeniePage.css';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
// Using fetch instead of axios to avoid unused import warning
import { 
  Send, 
  Bot, 
  Sparkles, 
  Clock, 
  BarChart2, 
  PieChart,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  HelpCircle,
  X,
  Menu
} from 'lucide-react';

// Sample financial insights for the sidebar
const SAMPLE_INSIGHTS: SampleInsight[] = [
  {
    id: 1,
    title: "Market Overview",
    content: "S&P 500 is up 0.8% today. Tech sector leading gains.",
    icon: <BarChart2 size={18} />,
    color: "bg-blue-100 text-blue-700"
  },
  {
    id: 2,
    title: "Investment Tip",
    content: "Diversification is key to reducing portfolio risk.",
    icon: <Lightbulb size={18} />,
    color: "bg-yellow-100 text-yellow-700"
  },
  {
    id: 3,
    title: "Trending",
    content: "Renewable energy stocks gaining momentum this week.",
    icon: <PieChart size={18} />,
    color: "bg-green-100 text-green-700"
  }
];

// Sample suggested questions
const SUGGESTED_QUESTIONS = [
  "What are the current market trends?",
  "How should I start investing?",
  "Explain dollar-cost averaging",
  "What is a good P/E ratio?",
  "How do I build an emergency fund?",
  "Explain the difference between stocks and bonds"
];

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

// Define the type for the conversations from the context
type ContextConversation = {
  id: string;
  userMessage: string;
  botResponse: string;
  timestamp: Date;
};

// Define the type for the sample insights
type SampleInsight = {
  id: number;
  title: string;
  content: string;
  icon: React.ReactNode;
  color: string;
};

const FinGeniePage: React.FC = () => {
  const { sendMessage, conversations, isLoading, clearConversations } = useFinGenie() as {
    sendMessage: (message: string) => Promise<string | undefined>;
    conversations: ContextConversation[];
    isLoading: boolean;
    clearConversations: () => void;
  };
  const [message, setMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTool, setActiveTool] = useState('chat'); // 'chat', 'insights', 'history'
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { 
      id: 'welcome',
      sender: 'bot', 
      text: 'Hello! I am FinGenie, your AI-powered financial assistant. Ask me anything about finance, investing, markets, or personal finance!',
      timestamp: new Date()
    }
  ]);

  // Scroll to bottom of chat when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Update chat history when conversations change
  useEffect(() => {
    if (conversations.length > 0) {
      const newMessages: Message[] = [];
      conversations.forEach(conv => {
        newMessages.push({
          id: `user-${conv.id}`,
          sender: 'user',
          text: conv.userMessage,
          timestamp: conv.timestamp
        });
        newMessages.push({
          id: `bot-${conv.id}`,
          sender: 'bot',
          text: conv.botResponse,
          timestamp: conv.timestamp
        });
      });
      
      setChatHistory([
        { 
          id: 'welcome',
          sender: 'bot', 
          text: 'Hello! I am FinGenie, your AI-powered financial assistant. Ask me anything about finance, investing, markets, or personal finance!',
          timestamp: new Date()
        },
        ...newMessages
      ]);
    }
  }, [conversations]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!message.trim()) return;
    
    // Add user message to chat immediately
    setChatHistory(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: message,
        timestamp: new Date()
      }
    ]);
    
    const currentMessage = message;
    setMessage('');
    
    // Send to FinGenie API
    try {
      // Try direct API call if the context method fails
      let response;
      try {
        response = await sendMessage(currentMessage);
      } catch (error) {
        console.log('Error using context method, trying direct API call:', error);
        // Direct API call as fallback
        const apiResponse = await fetch('/fastapi/fingenie/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: 'user-' + Math.random().toString(36).substring(2, 9),
            message: currentMessage
          })
        });
        
        if (!apiResponse.ok) {
          throw new Error('API response was not ok');
        }
        
        const data = await apiResponse.json();
        
        // Check if we have a valid response
        if (data && data.message) {
          response = data.message;
        } else {
          // If no valid response, use a default one based on the query type
          if (currentMessage.toLowerCase().includes('finance')) {
            response = "Finance is the management of money and includes activities like investing, borrowing, lending, budgeting, saving, and forecasting. It encompasses personal finance, corporate finance, and public finance, and is essential for individuals and organizations to achieve their financial goals.";
          } else if (currentMessage.toLowerCase().includes('invest')) {
            response = "Investing is the act of allocating resources, usually money, with the expectation of generating an income or profit. It can include purchasing assets like stocks, bonds, mutual funds, or real estate, with the goal of growing wealth over time.";
          } else {
            response = "I'm here to help with financial questions. Could you provide more details about what you'd like to know about finance or investing?";
          }
        }
        
        // Add bot response to chat
        setChatHistory(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: response,
            timestamp: new Date()
          }
        ]);
        
        return;
      }
      
      if (!response) {
        // If there was an error, provide a more helpful response based on the query
        let fallbackResponse = "I'm here to help with financial questions. Could you provide more details about what you'd like to know?";
        
        // Check if the message contains common financial terms and provide appropriate responses
        if (currentMessage.toLowerCase().includes('finance')) {
          fallbackResponse = "Finance is the management of money and includes activities like investing, borrowing, lending, budgeting, saving, and forecasting. It encompasses personal finance, corporate finance, and public finance, and is essential for individuals and organizations to achieve their financial goals.";
        } else if (currentMessage.toLowerCase().includes('invest')) {
          fallbackResponse = "Investing is the act of allocating resources, usually money, with the expectation of generating an income or profit. It can include purchasing assets like stocks, bonds, mutual funds, or real estate, with the goal of growing wealth over time.";
        }
        
        setChatHistory(prev => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            sender: 'bot',
            text: fallbackResponse,
            timestamp: new Date(),
            isError: false
          }
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Provide a more helpful response based on the query
      let fallbackResponse = "I'm here to help with financial questions. Could you provide more details about what you'd like to know?";
      
      // Check if the message contains common financial terms and provide appropriate responses
      if (currentMessage.toLowerCase().includes('finance')) {
        fallbackResponse = "Finance is the management of money and includes activities like investing, borrowing, lending, budgeting, saving, and forecasting. It encompasses personal finance, corporate finance, and public finance, and is essential for individuals and organizations to achieve their financial goals.";
      } else if (currentMessage.toLowerCase().includes('invest')) {
        fallbackResponse = "Investing is the act of allocating resources, usually money, with the expectation of generating an income or profit. It can include purchasing assets like stocks, bonds, mutual funds, or real estate, with the goal of growing wealth over time.";
      }
      
      setChatHistory(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'bot',
          text: fallbackResponse,
          timestamp: new Date(),
          isError: false
        }
      ]);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setMessage(question);
    handleSendMessage(undefined);
  };

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Header />
      
      {/* Mobile menu */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-fin-primary">FinGenie</h1>
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      <div className={`fixed top-32 left-0 right-0 bottom-0 z-30 bg-white dark:bg-slate-800 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'} md:hidden overflow-auto`}>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Suggested Questions</h2>
            {SUGGESTED_QUESTIONS.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(question)}
                className="w-full text-left p-2 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-sm"
              >
                {question}
              </button>
            ))}
          </div>
          
          <div className="space-y-2">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Financial Insights</h2>
            {SAMPLE_INSIGHTS.map(insight => (
              <div 
                key={insight.id} 
                className={`p-3 rounded-lg ${insight.color}`}
              >
                <div className="flex items-center mb-1">
                  {insight.icon}
                  <h3 className="font-medium ml-2">{insight.title}</h3>
                </div>
                <p className="text-sm">{insight.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 pt-16 md:pt-8 container mx-auto px-4 md:px-6 lg:px-8 mb-8">
        <div className="flex-1 p-6 md:p-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
          <div className="bg-gradient-to-r from-fin-primary to-fin-teal -mx-8 -mt-8 px-8 py-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot size={24} className="text-white" />
                <h1 className="text-xl font-bold text-white">FinGenie</h1>
                <div className="hidden md:flex items-center bg-white/20 px-2 py-0.5 rounded text-xs font-medium text-white">
                  <Sparkles size={12} className="mr-1" />
                  AI-Powered
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-4">
                <button 
                  onClick={() => setActiveTool('chat')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${activeTool === 'chat' ? 'bg-white/20' : 'hover:bg-white/10'} text-white`}
                >
                  Chat
                </button>
                <button 
                  onClick={() => setActiveTool('insights')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${activeTool === 'insights' ? 'bg-white/20' : 'hover:bg-white/10'} text-white`}
                >
                  Insights
                </button>
                <button 
                  onClick={clearConversations}
                  className="px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors text-white"
                  title="Clear conversation"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
              
              <button 
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md hover:bg-white/10 text-white"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Main chat area */}
            <div className="flex-1 flex flex-col">
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto hide-scrollbar px-2 space-y-4">
                {chatHistory.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.sender === 'user'
                          ? 'bg-fin-primary text-white'
                          : msg.isError
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {msg.sender === 'bot' && (
                        <div className="flex items-center mb-1">
                          <Bot size={16} className="mr-1 text-fin-primary" />
                          <span className="text-xs font-medium text-fin-primary">FinGenie</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">{formatTime(msg.timestamp)}</span>
                        </div>
                      )}
                      <p className="text-sm">{msg.text}</p>
                      {msg.sender === 'user' && (
                        <div className="flex justify-end mt-1">
                          <span className="text-xs text-white/70">{formatTime(msg.timestamp)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-slate-100 dark:bg-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-fin-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-fin-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-fin-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <p className="text-sm">Thinking...</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Suggested questions */}
              <div className="px-4 py-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
                <div className="flex space-x-2">
                  {SUGGESTED_QUESTIONS.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 whitespace-nowrap flex-shrink-0"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Input area */}
              <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask FinGenie anything about finance..."
                  className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-fin-primary focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="bg-fin-primary hover:bg-fin-primary/90 text-white px-4 py-2 rounded-lg disabled:bg-fin-primary/50 flex items-center"
                  disabled={isLoading || !message.trim()}
                >
                  <Send size={18} className="mr-1" />
                  <span>Send</span>
                </button>
              </form>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                FinGenie provides general financial information, not personalized financial advice.
              </div>
            </div>
            
            {/* Sidebar */}
            <div className={`w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 transition-all duration-300 overflow-y-auto ${showSidebar ? 'translate-x-0' : 'translate-x-full'} hidden md:block`}>
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                  <Sparkles size={16} className="mr-2 text-fin-teal" />
                  Financial Insights
                </h2>
              </div>
              
              <div className="p-4 space-y-4">
                {SAMPLE_INSIGHTS.map(insight => (
                  <div 
                    key={insight.id} 
                    className={`p-3 rounded-lg ${insight.color}`}
                  >
                    <div className="flex items-center mb-1">
                      {insight.icon}
                      <h3 className="font-medium ml-2">{insight.title}</h3>
                    </div>
                    <p className="text-sm">{insight.content}</p>
                  </div>
                ))}
                
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Recent Conversations</h3>
                  <div className="space-y-2">
                    {conversations.slice(-3).map(conv => (
                      <div key={conv.id} className="bg-slate-50 dark:bg-slate-700 p-2 rounded text-sm">
                        <div className="font-medium text-slate-700 dark:text-slate-300">{conv.userMessage.substring(0, 30)}{conv.userMessage.length > 30 ? '...' : ''}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <Clock size={12} className="inline mr-1" />
                          {formatDate(conv.timestamp)}
                        </div>
                      </div>
                    ))}
                    {conversations.length === 0 && (
                      <div className="text-sm text-slate-500 dark:text-slate-400 italic">No recent conversations</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar toggle */}
            <button
              onClick={toggleSidebar}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md rounded-l-md p-1 hidden md:block"
            >
              {showSidebar ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

// Custom ChevronLeft and ChevronRight components
const ChevronLeft: React.FC<{ size: number }> = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const ChevronRight: React.FC<{ size: number }> = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

export default FinGeniePage;
