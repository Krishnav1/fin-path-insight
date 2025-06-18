import React, { useState, useRef, useEffect } from 'react';
import { useFinGenie } from '@/contexts/FinGenieContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Send, 
  Bot, 
  Sparkles, 
  Upload, 
  FileText, 
  BarChart2, 
  PieChart,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  RefreshCw,
  Download,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

export default function FinGeniePage() {
  const { sendMessage, conversations, isLoading, clearConversations } = useFinGenie() as {
    sendMessage: (message: string) => Promise<string | undefined>;
    conversations: any[];
    isLoading: boolean;
    clearConversations: () => void;
  };
  
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([
    { 
      id: 'welcome',
      sender: 'bot', 
      text: 'Hello! I am FinGenie, your AI-powered financial assistant. Ask me anything about finance, investing, markets, or personal finance!',
      timestamp: new Date()
    }
  ]);
  
  // Sample suggested questions
  const suggestedQuestions = [
    "What are the current market trends?",
    "How should I start investing?",
    "Explain dollar-cost averaging",
    "What is a good P/E ratio?",
    "How do I build an emergency fund?",
    "Analyze my portfolio performance"
  ];
  
  // Sample financial insights
  const financialInsights = [
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
  
  // Scroll to bottom of chat when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);
  
  // Update chat history when conversations change
  useEffect(() => {
    if (conversations && conversations.length > 0) {
      const newMessages: any[] = [];
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
  
  const handleSendMessage = async (e?: React.FormEvent, suggestedQuestion?: string) => {
    e?.preventDefault();
    
    const messageToSend = suggestedQuestion || message;
    if (!messageToSend.trim()) return;
    
    // Add user message to chat immediately
    setChatHistory(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: messageToSend,
        timestamp: new Date()
      }
    ]);
    
    setMessage('');
    
    // Send to FinGenie API
    try {
      const response = await sendMessage(messageToSend);
      
      if (!response) {
        throw new Error('No response received');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add fallback response
      setChatHistory(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'bot',
          text: "I'm having trouble processing your request. Please try again later or ask a different question.",
          timestamp: new Date(),
          isError: true
        }
      ]);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file drop logic here
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Handle file selection logic here
  };
  
  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Chat Area */}
            <div className="flex-1">
              <Card className="h-full flex flex-col">
                <CardHeader className="bg-gradient-to-r from-fin-primary to-fin-teal text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bot size={24} />
                      <CardTitle>FinGenie</CardTitle>
                      <Badge variant="outline" className="bg-white/20 text-white border-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI-Powered
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* TabsList will be moved outside the CardHeader */}
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="bg-transparent border-white/20 text-white hover:bg-white/20"
                        onClick={clearConversations}
                      >
                        <RefreshCw size={16} />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-white/80">
                    Your AI finance assistant that provides personalized insights and answers
                  </CardDescription>
                </CardHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <div className="px-6 pt-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
                      <TabsTrigger value="chat">Chat</TabsTrigger>
                      <TabsTrigger value="tools">Tools</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0 mt-0 rounded-none border-0">
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {chatHistory.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
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
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Input Area */}
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        placeholder="Ask FinGenie about finance, investing, or markets..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={isLoading || !message.trim()}>
                        {isLoading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Thinking...
                          </span>
                        ) : (
                          <Send size={18} />
                        )}
                      </Button>
                    </form>
                    
                    <div className="mt-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Suggested questions:</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedQuestions.slice(0, 3).map((question, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleSendMessage(undefined, question)}
                          >
                            {question}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="tools" className="flex-1 p-6 m-0 mt-0 overflow-auto rounded-none border-0">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Financial Tools</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-fin-primary/10 rounded-full text-fin-primary">
                                <BarChart2 size={18} />
                              </div>
                              <CardTitle className="text-base">Portfolio Health Check</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="mb-4">Get a comprehensive analysis of your investment portfolio</CardDescription>
                            <Button className="w-full" size="sm">Run Analysis</Button>
                          </CardContent>
                        </Card>
                        
                        <Card className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-fin-primary/10 rounded-full text-fin-primary">
                                <AlertTriangle size={18} />
                              </div>
                              <CardTitle className="text-base">Risk Assessment</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="mb-4">Evaluate your investment risk tolerance and profile</CardDescription>
                            <Button className="w-full" size="sm">Start Assessment</Button>
                          </CardContent>
                        </Card>
                        
                        <Card className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-fin-primary/10 rounded-full text-fin-primary">
                                <TrendingUp size={18} />
                              </div>
                              <CardTitle className="text-base">Stock Research</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="mb-4">Get in-depth analysis and research on any stock</CardDescription>
                            <Button className="w-full" size="sm">Research Stock</Button>
                          </CardContent>
                        </Card>
                        
                        <Card className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-fin-primary/10 rounded-full text-fin-primary">
                                <Lightbulb size={18} />
                              </div>
                              <CardTitle className="text-base">Financial Planning</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="mb-4">Create a personalized financial plan based on your goals</CardDescription>
                            <Button className="w-full" size="sm">Create Plan</Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Upload Portfolio</h3>
                      <Card>
                        <CardContent className="pt-6">
                          <div 
                            className={`border-2 border-dashed rounded-lg p-6 text-center ${
                              isDragging ? 'border-fin-primary bg-fin-primary/5' : 'border-slate-200 dark:border-slate-700'
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            <div className="flex flex-col items-center">
                              <Upload className="h-8 w-8 text-slate-400 mb-3" />
                              <h3 className="text-base font-medium mb-2">Drag & Drop CSV File</h3>
                              <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                                Upload your portfolio CSV for detailed analysis
                              </p>
                              <Input 
                                type="file" 
                                accept=".csv" 
                                className="hidden" 
                                id="portfolio-file" 
                                onChange={handleFileChange}
                              />
                              <div className="flex gap-3">
                                <label htmlFor="portfolio-file">
                                  <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                                    <span>Select File</span>
                                  </Button>
                                </label>
                                <Button variant="outline" size="sm">
                                  <FileText className="mr-2 h-4 w-4" />
                                  Download Template
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
                </Tabs> {/* Closing the main Tabs wrapper */}
              </Card>
            </div>
            
            {/* Sidebar */}
            <div className="w-full lg:w-80 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Financial Insights</CardTitle>
                  <CardDescription>Latest market updates and tips</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {financialInsights.map(insight => (
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
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Tools</CardTitle>
                  <CardDescription>Explore our financial tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link to="/tools/technical-analysis">
                    <Button variant="ghost" className="w-full justify-between">
                      Technical Analysis
                      <ChevronRight size={16} />
                    </Button>
                  </Link>
                  <Link to="/tools/portfolio-analyzer">
                    <Button variant="ghost" className="w-full justify-between">
                      Portfolio Analyzer
                      <ChevronRight size={16} />
                    </Button>
                  </Link>
                  <Link to="/tools/stock-screener">
                    <Button variant="ghost" className="w-full justify-between">
                      Stock Screener
                      <ChevronRight size={16} />
                    </Button>
                  </Link>
                  <Link to="/tools/retirement-calculator">
                    <Button variant="ghost" className="w-full justify-between">
                      Retirement Calculator
                      <ChevronRight size={16} />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ask FinGenie</CardTitle>
                  <CardDescription>Popular questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {suggestedQuestions.slice(3).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => handleSendMessage(undefined, question)}
                    >
                      <span className="truncate">{question}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
