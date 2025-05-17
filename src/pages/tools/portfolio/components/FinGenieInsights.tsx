import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Portfolio } from '@/types/portfolio';
import { Bot, Send, AlertTriangle, CheckCircle, TrendingUp, Lightbulb, RefreshCw } from 'lucide-react';
import { mockSuggestions } from '../data/mockData';

interface FinGenieInsightsProps {
  portfolioData: Portfolio;
}

export default function FinGenieInsights({ portfolioData }: FinGenieInsightsProps) {
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

  // Sample questions for the user to ask
  const sampleQuestions = [
    "Why did my portfolio drop last month?",
    "How can I improve my diversification?",
    "What's my portfolio's risk level?",
    "Which sectors should I invest more in?",
    "If TCS drops 5%, what happens to my portfolio?"
  ];

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
    
    // Set loading state
    setIsLoading(true);
    
    // Simulate AI response (would be replaced with actual API call)
    setTimeout(() => {
      let response = '';
      
      // Generate mock responses based on question keywords
      if (question.toLowerCase().includes('drop') || question.toLowerCase().includes('fell')) {
        response = "Based on your portfolio data, the drop last month was primarily due to the technology sector correction. Your holdings in TCS and Infosys were affected by the broader tech selloff, which was triggered by concerns about high valuations and rising interest rates. However, your diversification into energy and healthcare sectors helped cushion the overall impact.";
      } else if (question.toLowerCase().includes('diversification') || question.toLowerCase().includes('diversify')) {
        response = "Your portfolio could benefit from improved diversification. Currently, you're overweight in Technology (25% vs. benchmark 18%) and Financial Services (35% vs. benchmark 28%). Consider adding exposure to defensive sectors like Consumer Staples and Utilities, which are currently absent from your portfolio. This would help reduce volatility during market downturns.";
      } else if (question.toLowerCase().includes('risk')) {
        response = "Your portfolio has a moderate-to-high risk profile with a beta of 1.1, meaning it's slightly more volatile than the market. The concentration in technology and financial stocks contributes to this risk level. Your volatility (standard deviation) is 15.2%, which is higher than the market average of 13.8%. To reduce risk, consider adding more defensive stocks or increasing allocation to sectors with lower correlation to the broader market.";
      } else if (question.toLowerCase().includes('sector')) {
        response = "Based on current market conditions and your investment goals, you might consider increasing exposure to Healthcare (currently 12% of your portfolio) and Consumer Staples (currently 0%). These sectors typically provide more stability during economic uncertainty. You could also benefit from some exposure to Utilities for dividend income. I'd suggest reducing your Technology allocation slightly, as you're currently overweight compared to market benchmarks.";
      } else if (question.toLowerCase().includes('tcs') && question.toLowerCase().includes('drop')) {
        response = "If TCS drops by 5%, your portfolio value would decrease by approximately ₹5,185 or about 0.41% of your total portfolio value. This is because TCS currently represents 8.3% of your portfolio. The impact is relatively contained due to your diversification across other sectors, demonstrating the benefit of not being too heavily concentrated in any single stock.";
      } else {
        response = "Based on your portfolio data, I can provide the following insights: Your portfolio has a good mix of growth and value stocks, but is slightly overweight in the Technology and Financial sectors compared to market benchmarks. Your overall return of 25% is strong, outperforming the NIFTY 50 by about 6.5%. To optimize further, consider adding more defensive positions and perhaps some international exposure to reduce country-specific risk.";
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
      
      // Reset loading state and clear question input
      setIsLoading(false);
      setQuestion('');
    }, 1500);
  };

  // Handle pressing Enter to send question
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuestion();
    }
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FinGenie Chat */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-fin-primary/10 rounded-full">
                <Bot className="h-5 w-5 text-fin-primary" />
              </div>
              <CardTitle>Ask FinGenie</CardTitle>
            </div>
            <CardDescription>
              Get AI-powered insights about your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] overflow-y-auto border rounded-md p-4 mb-4 space-y-4">
              {conversation.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-fin-primary text-white' 
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                    {message.timestamp && (
                      <div className={`text-xs mt-1 ${
                        message.role === 'user' 
                          ? 'text-fin-primary-50' 
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">FinGenie is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Ask about your portfolio..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <Button 
                onClick={handleSendQuestion}
                disabled={!question.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {sampleQuestions.map((q, i) => (
                  <Button 
                    key={i} 
                    variant="outline" 
                    size="sm"
                    onClick={() => setQuestion(q)}
                    disabled={isLoading}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Portfolio Insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-fin-primary/10 rounded-full">
                <Lightbulb className="h-5 w-5 text-fin-primary" />
              </div>
              <CardTitle>FinGenie Insights</CardTitle>
            </div>
            <CardDescription>
              AI-generated portfolio analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSuggestions.map((suggestion, index) => (
                <div 
                  key={index} 
                  className={`p-3 border rounded-md flex gap-3 ${
                    suggestion.type === 'alert' 
                      ? 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-900' 
                      : suggestion.type === 'positive'
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900'
                      : 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {suggestion.type === 'alert' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    ) : suggestion.type === 'positive' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      suggestion.type === 'alert' 
                        ? 'text-amber-800 dark:text-amber-300' 
                        : suggestion.type === 'positive'
                        ? 'text-green-800 dark:text-green-300'
                        : 'text-blue-800 dark:text-blue-300'
                    }`}>
                      {suggestion.message}
                    </p>
                    {suggestion.details && (
                      <p className={`text-xs mt-1 ${
                        suggestion.type === 'alert' 
                          ? 'text-amber-700 dark:text-amber-400' 
                          : suggestion.type === 'positive'
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-blue-700 dark:text-blue-400'
                      }`}>
                        {suggestion.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Insights
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Risk Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Risk Assessment</CardTitle>
          <CardDescription>
            AI-powered analysis of your portfolio's risk profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Risk Score */}
            <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Risk Score</div>
              <div className="relative w-32 h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#e2e8f0" 
                    strokeWidth="10" 
                    className="dark:stroke-slate-700" 
                  />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#0ea5e9" 
                    strokeWidth="10" 
                    strokeDasharray="283" 
                    strokeDashoffset="85" 
                    className="transform -rotate-90 origin-center" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold">7.2</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">out of 10</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="font-medium">Moderately High</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Risk Level</div>
              </div>
            </div>
            
            {/* Risk Factors */}
            <div className="md:col-span-2">
              <h4 className="font-medium mb-4">Key Risk Factors</h4>
              <div className="space-y-4">
                {[
                  { name: 'Sector Concentration', value: 65, description: 'Technology and Financial sectors dominate' },
                  { name: 'Market Sensitivity', value: 75, description: 'Portfolio beta of 1.1 indicates higher market sensitivity' },
                  { name: 'Individual Stock Risk', value: 45, description: 'No single stock exceeds 15% of portfolio' },
                  { name: 'Geographic Diversification', value: 85, description: 'Heavily concentrated in Indian market' }
                ].map((factor, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{factor.name}</span>
                      <span className="font-medium">{factor.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          factor.value > 70 
                            ? 'bg-red-500' 
                            : factor.value > 40 
                            ? 'bg-amber-500' 
                            : 'bg-green-500'
                        }`} 
                        style={{ width: `${factor.value}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {factor.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
