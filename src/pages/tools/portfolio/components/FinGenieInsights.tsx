import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Portfolio } from '@/types/portfolio';
import { Bot, Send, AlertTriangle, CheckCircle, TrendingUp, Lightbulb, RefreshCw } from 'lucide-react';
import { GeminiAnalysis } from '@/services/portfolio-service';

interface FinGenieInsightsProps {
  portfolioData: Portfolio;
  analysisData: GeminiAnalysis | null;
}

export default function FinGenieInsights({ portfolioData, analysisData }: FinGenieInsightsProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
  }[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m FinGenie, your AI financial assistant. I can analyze your portfolio and provide personalized insights. What would you like to know about your investments?',
      timestamp: new Date()
    }
  ]);

  // Generate sample questions based on portfolio and analysis data
  const generateSampleQuestions = () => {
    if (!analysisData) return defaultSampleQuestions;
    
    const questions = [
      `How can I improve my ${analysisData.diversification.risk_flag.toLowerCase()} risk portfolio?`,
      `What strategies can I use to optimize my ${analysisData.diversification.sector_breakdown ? Object.keys(analysisData.diversification.sector_breakdown)[0] : 'sector'} exposure?`,
      `Should I hold or sell ${analysisData.stock_breakdown[0]?.symbol || 'my top stocks'}?`,
      `What would happen if ${analysisData.overview.top_gainer || 'my top performer'} drops by 10%?`,
      `How can I rebalance my portfolio to reduce risk?`
    ];
    
    return questions;
  };
  
  // Default sample questions for the user to ask
  const defaultSampleQuestions = [
    "Why did my portfolio drop last month?",
    "How can I improve my diversification?",
    "What's my portfolio's risk level?",
    "Which sectors should I invest more in?",
    "If my top stock drops 5%, what happens to my portfolio?"
  ];
  
  const sampleQuestions = analysisData ? generateSampleQuestions() : defaultSampleQuestions;

  // Handle sending a question to FinGenie
  const handleSendQuestion = () => {
    if (!question.trim()) return;
    
    // Add user question to conversation
    setConversation(prev => [
      ...prev,
      {
        role: 'user',
        content: question,
        timestamp: new Date()
      }
    ]);
    
    // Simulate AI thinking
    setIsLoading(true);
    
    // Clear input
    setQuestion('');
    
    // Simulate AI response after a delay
    setTimeout(() => {
      // Generate mock response based on question
      let response = "I'm analyzing your portfolio data...";
      
      if (question.toLowerCase().includes('risk')) {
        response = "Based on your current allocation, your portfolio has a moderate risk profile with a beta of 1.2 relative to the market. You could reduce risk by adding more defensive stocks or increasing your allocation to bonds.";
      } else if (question.toLowerCase().includes('diversif')) {
        response = "Your portfolio is currently concentrated in Technology (45%) and Financial Services (30%). Consider adding exposure to Healthcare, Consumer Staples, or Utilities for better diversification.";
      } else if (question.toLowerCase().includes('drop')) {
        response = "Your portfolio declined primarily due to weakness in tech stocks last month. Rising interest rates particularly impacted high-growth companies with distant earnings. Consider rebalancing to include more value-oriented stocks.";
      } else if (question.toLowerCase().includes('sector')) {
        response = "Based on your risk profile and current market conditions, you might consider increasing exposure to Healthcare and Consumer Staples, which tend to be more resilient during economic uncertainty.";
      } else {
        response = "I've analyzed your portfolio and noticed you could improve returns by rebalancing some positions. Your tech allocation is high at 45% - consider taking some profits and diversifying into other sectors like Healthcare or Consumer Staples.";
      }
      
      // Add AI response to conversation
      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response,
          timestamp: new Date()
        }
      ]);
      
      setIsLoading(false);
    }, 1500);
  };

  // Handle clicking a sample question
  const handleSampleQuestion = (q: string) => {
    setQuestion(q);
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {analysisData && (
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-fin-primary" />
              FinGenie Portfolio Analysis
            </CardTitle>
            <CardDescription>
              AI-powered insights and recommendations for your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="stocks">Stocks</TabsTrigger>
                <TabsTrigger value="sectors">Sectors</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary">
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-medium mb-2">Portfolio Summary</h3>
                    <p className="text-slate-700 dark:text-slate-300">{analysisData.summary}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Total Return</h4>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold text-fin-primary">{analysisData.overview?.percent_return || '0%'}</p>
                      <p className="text-xs text-slate-500 mt-1">Absolute: {analysisData.overview?.absolute_return || '₹0'}</p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Top Performer</h4>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-lg font-bold">{analysisData.overview?.top_gainer || 'N/A'}</p>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Risk Level</h4>
                        {analysisData.diversification.risk_flag === 'Low' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {analysisData.diversification.risk_flag === 'Medium' && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        {analysisData.diversification.risk_flag === 'High' && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <p className="text-lg font-bold">{analysisData.diversification.risk_flag}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="stocks">
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-medium mb-4">Stock Performance</h3>
                    <div className="space-y-3">
                      {analysisData.stock_breakdown.map((stock, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                          <div>
                            <p className="font-medium">{stock.symbol}</p>
                            <p className="text-xs text-slate-500">{stock.sector}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${stock.percent_gain.includes('-') ? 'text-red-500' : 'text-green-500'}`}>
                              {stock.percent_gain}
                            </p>
                            <p className="text-xs text-slate-500">{stock.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="sectors">
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-medium mb-4">Sector Allocation</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(analysisData.diversification.sector_breakdown).map(([sector, percentage], index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded">
                          <span className="text-sm font-medium">{sector}</span>
                          <span className="text-sm font-bold">{percentage}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-md">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Risk Assessment</p>
                          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                            Your portfolio has a {analysisData.diversification.risk_flag.toLowerCase()} concentration risk based on sector allocation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="recommendations">
                <div className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-800">
                    <h3 className="text-lg font-medium mb-4">Recommendations</h3>
                    <ul className="space-y-3">
                      {analysisData.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-700 dark:text-slate-300">{recommendation}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
      
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-fin-primary" />
            FinGenie Chat
          </CardTitle>
          <CardDescription>
            Ask questions about your portfolio and get personalized insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800" style={{ minHeight: '300px', maxHeight: '300px' }}>
              {conversation.map((message, index) => (
                <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-3 rounded-lg ${message.role === 'user' ? 'bg-fin-primary text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100'}`}>
                    {message.content}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {message.timestamp?.toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center space-x-2 text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>FinGenie is thinking...</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask FinGenie about your portfolio..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
              />
              <Button onClick={handleSendQuestion} disabled={isLoading || !question.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {sampleQuestions.map((q, index) => (
                <Button key={index} variant="outline" size="sm" onClick={() => handleSampleQuestion(q)}>
                  {q}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
