import React, { useState, useRef, useEffect } from 'react';
import { useFinGenie } from '../contexts/FinGenieContext';
import '../styles/FinGeniePage.css';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import FinGenieInvestmentReport from '../components/FinGenieInvestmentReport';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { voiceInputService } from '../services/voiceInputService';
import ExportConversationsDialog from '../components/ExportConversationsDialog';
import { conversationService } from '../services/conversationService';
import { 
  Send, 
  Bot, 
  Sparkles, 
  Clock, 
  BarChart2, 
  PieChart,
  Lightbulb,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Menu,
  MessageSquare,
  TrendingUp,
  Mic,
  MicOff,
  Zap,
  AlertCircle,
  Download
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

// Quick action prompts
const QUICK_ACTIONS = [
  { icon: <BarChart2 size={16} />, label: 'Analyze my portfolio', prompt: 'Analyze my portfolio performance and give me insights' },
  { icon: <TrendingUp size={16} />, label: 'Market summary', prompt: 'Give me a summary of today\'s market performance' },
  { icon: <Sparkles size={16} />, label: 'Top gainers', prompt: 'Show me today\'s top gainers in the Indian market' },
  { icon: <PieChart size={16} />, label: 'Investment advice', prompt: 'What are some good investment strategies for beginners?' },
];

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

// Define the type for the conversations from the context
interface ContextConversation {
  id: number;
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
  const { sendMessage, conversations, isLoading, clearConversations, error } = useFinGenie();
  const [message, setMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'investment-report'
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([
    { 
      id: 'welcome',
      sender: 'bot', 
      text: 'Hello! I am FinGenie, your AI-powered financial assistant. Ask me anything about finance, investing, markets, or personal finance!',
      timestamp: new Date()
    }
  ]);

  // Initialize voice input
  useEffect(() => {
    setVoiceSupported(voiceInputService.isSupported());

    if (voiceInputService.isSupported()) {
      voiceInputService.initialize(
        {
          language: 'en-US',
          continuous: false,
          interimResults: true
        },
        {
          onResult: (transcript, isFinal) => {
            setMessage(transcript);
            if (isFinal) {
              setIsListening(false);
            }
          },
          onError: (error) => {
            setVoiceError(error);
            setIsListening(false);
          },
          onStart: () => {
            setIsListening(true);
            setVoiceError(null);
          },
          onEnd: () => {
            setIsListening(false);
          }
        }
      );
    }

    return () => {
      voiceInputService.destroy();
    };
  }, []);

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
    if (e) {
      e.preventDefault();
    }
    
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage('');
    
    // Add user message to chat immediately
    const userMessageId = `user-${Date.now()}`;
    const newUserMessage: Message = {
      id: userMessageId,
      sender: 'user',
      text: userMessage,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, newUserMessage]);
    
    try {
      // Send message to FinGenie and get response
      const response = await sendMessage(userMessage);
      
      if (response) {
        // Response is handled by the context and will be reflected in conversations
      } else {
        // Handle error case
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          sender: 'bot',
          text: 'Sorry, I encountered an error processing your request. Please try again.',
          timestamp: new Date(),
          isError: true
        };
        
        setChatHistory(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender: 'bot',
        text: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
    }
  };
  
  const handleSuggestedQuestion = (question: string) => {
    setMessage(question);
    handleSendMessage();
  };

  const handleQuickAction = (prompt: string) => {
    setMessage(prompt);
    setTimeout(() => handleSendMessage(), 100);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      voiceInputService.stop();
    } else {
      voiceInputService.start();
    }
  };

  const handleExportConversations = () => {
    setShowExportDialog(true);
  };

  const getExportableConversations = () => {
    return chatHistory
      .filter(msg => msg.id !== 'welcome')
      .map(msg => ({
        id: msg.id,
        user_message: msg.sender === 'user' ? msg.text : '',
        bot_response: msg.sender === 'bot' ? msg.text : '',
        created_at: msg.timestamp.toISOString()
      }));
  };
  
  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(timestamp);
  };
  
  const formatDate = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(timestamp);
  };
  
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />
      
      <div className="flex-1 flex flex-col">
        <div className="container mx-auto px-4 py-6 flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-fin-gradient text-white rounded-t-xl p-4 flex justify-between items-center">
            <div className="flex items-center">
              <Bot size={24} className="mr-2" />
              <h1 className="text-xl font-semibold">FinGenie</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'chat' ? 'bg-white/20' : 'hover:bg-white/10'} text-white flex items-center`}
              >
                <MessageSquare size={16} className="mr-1" /> Chat
              </button>
              <button 
                onClick={() => setActiveTab('investment-report')}
                className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'investment-report' ? 'bg-white/20' : 'hover:bg-white/10'} text-white flex items-center`}
              >
                <TrendingUp size={16} className="mr-1" /> Reports
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportConversations}
                  className="p-2 hover:bg-white/10 rounded-md transition-colors"
                  disabled={chatHistory.length <= 1}
                  title="Export conversations"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={toggleMobileMenu}
                  className="md:hidden p-2"
                >
                  <Menu size={20} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-b-xl shadow-sm flex relative">
            {/* Chat area */}
            <div className="flex-1 flex flex-col">
              {activeTab === 'chat' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatHistory.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'user' ? 'bg-fin-teal text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'} ${msg.isError ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : ''}`}
                      >
                        {msg.sender === 'bot' && (
                          <div className="flex items-center mb-1">
                            <Bot size={16} className="mr-1 text-fin-teal" />
                            <span className="font-medium text-fin-teal">FinGenie</span>
                          </div>
                        )}
                        {msg.sender === 'bot' ? (
                          <MarkdownRenderer content={msg.text} />
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        )}
                        <div className="text-xs opacity-70 mt-1 text-right">
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg p-3 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        <div className="flex items-center mb-1">
                          <Bot size={16} className="mr-1 text-fin-teal" />
                          <span className="font-medium text-fin-teal">FinGenie</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
              
              {activeTab === 'investment-report' && (
                <div className="flex-1 overflow-y-auto p-4">
                  <FinGenieInvestmentReport />
                </div>
              )}
            </div>
            
            {/* Chat input - only show when chat tab is active */}
            {activeTab === 'chat' && (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-700">
                {/* Error banner */}
                {(error || voiceError) && (
                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                    <AlertCircle size={18} className="text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-800 dark:text-red-200">{error || voiceError}</p>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mb-3 flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleQuickAction(action.prompt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-fin-teal to-fin-teal-dark text-white rounded-full text-sm hover:shadow-md transition-all"
                      disabled={isLoading}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                      <Zap size={12} />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={isListening ? "Listening..." : "Ask FinGenie anything about finance..."}
                      className="w-full px-4 py-2 pr-20 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-fin-teal"
                      disabled={isLoading || isListening}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      {voiceSupported && (
                        <button
                          type="button"
                          onClick={toggleVoiceInput}
                          className={`p-1.5 rounded-full transition-colors ${
                            isListening 
                              ? 'bg-red-500 text-white animate-pulse' 
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600'
                          }`}
                          disabled={isLoading}
                          title={isListening ? 'Stop listening' : 'Start voice input'}
                        >
                          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                      )}
                      <button
                        type="submit"
                        className="p-1.5 text-fin-teal disabled:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full transition-colors"
                        disabled={!message.trim() || isLoading || isListening}
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Suggested questions */}
                <div className="mt-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((question, index) => (
                      <button
                        key={index}
                        type="button"
                        className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full transition-colors"
                        onClick={() => handleSuggestedQuestion(question)}
                        disabled={isLoading}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}
            
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
      
      {/* Export Dialog */}
      <ExportConversationsDialog
        conversations={getExportableConversations()}
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
};

export default FinGeniePage;
