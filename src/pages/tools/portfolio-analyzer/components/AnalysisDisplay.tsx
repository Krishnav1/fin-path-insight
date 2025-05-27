import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, BarChart, LineChart } from '@/components/ui/charts';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle
} from 'lucide-react';
import { GeminiAnalysis, Stock } from '../hooks/usePortfolio';
import { Button } from 'antd';

interface AnalysisDisplayProps {
  activeTab: string;
  analysisResult: GeminiAnalysis | null;
  stocks: Stock[];
}

export function AnalysisDisplay({ activeTab, analysisResult, stocks }: AnalysisDisplayProps) {
  // Generate mock performance data based on current holdings
  const generatePerformanceData = () => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      // Generate a value that trends toward the current total value
      const totalValue = stocks.reduce((sum, stock) => sum + stock.value, 0);
      const startValue = totalValue * 0.9; // Start at 90% of current value
      const randomFactor = 0.98 + Math.random() * 0.04; // Random between 0.98 and 1.02
      const value = startValue * (1 + (i/30) * 0.1) * randomFactor;
      
      return {
        date: date.toISOString().split('T')[0],
        value: Math.round(value)
      };
    });
  };

  // Mock risk metrics
  const riskMetrics = [
    { name: 'Beta', value: 1.2, description: 'Portfolio is more volatile than the market' },
    { name: 'Alpha', value: 3.5, description: 'Portfolio outperforms the market by 3.5%' },
    { name: 'Sharpe Ratio', value: 1.8, description: 'Good risk-adjusted returns' },
    { name: 'Standard Deviation', value: 15.2, description: 'Moderate volatility' },
    { name: 'Max Drawdown', value: -12.5, description: 'Maximum loss from peak to trough' }
  ];

  // Render the Overview tab content
  const renderOverviewTab = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analysisResult ? analysisResult.overview.market_value : `₹${(stocks.reduce((sum, stock) => sum + stock.value, 0) / 100000).toFixed(2)} L`}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Invested: {analysisResult ? analysisResult.overview.total_invested : `₹${(stocks.reduce((sum, stock) => sum + (stock.buyPrice * stock.quantity), 0) / 100000).toFixed(2)} L`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${analysisResult && !analysisResult.overview.absolute_return.includes('-') ? 'text-green-600' : 'text-red-600'}`}>
              {analysisResult ? analysisResult.overview.absolute_return : `₹${(stocks.reduce((sum, stock) => sum + stock.profit, 0) / 100000).toFixed(2)} L`}
            </div>
            <div className={`flex items-center ${analysisResult && !analysisResult.overview.percent_return.includes('-') ? 'text-green-600' : 'text-red-600'}`}>
              {analysisResult && !analysisResult.overview.percent_return.includes('-') ? 
                <TrendingUp className="h-4 w-4 mr-1" /> : 
                <TrendingDown className="h-4 w-4 mr-1" />
              }
              <span>{analysisResult ? analysisResult.overview.percent_return : `${(stocks.reduce((sum, stock) => sum + stock.profit, 0) / stocks.reduce((sum, stock) => sum + (stock.buyPrice * stock.quantity), 0) * 100).toFixed(2)}%`}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            {analysisResult ? (
              <div>
                <div className="mb-2">
                  <div className="text-sm font-medium text-green-600">Top Gainer</div>
                  <div className="font-bold">{analysisResult.overview.top_gainer}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-red-600">Worst Performer</div>
                  <div className="font-bold">{analysisResult.overview.worst_performer}</div>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 dark:text-slate-400 text-sm">
                <div className="text-3xl font-bold">{stocks.length}</div>
                <p>Across {new Set(stocks.map(stock => stock.sector)).size} sectors</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );

  // Render the Allocation tab content
  const renderAllocationTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Sector Allocation</CardTitle>
          <CardDescription>Distribution of your investments across sectors</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <PieChart 
            data={analysisResult && analysisResult.diversification ? 
              Object.entries(analysisResult.diversification.sector_breakdown).map(([name, value]) => ({
                name,
                value: parseFloat(value.replace('%', ''))
              })) : 
              // Fallback to calculated data from stocks
              Object.entries(stocks.reduce((acc, stock) => {
                const sector = stock.sector || 'Other';
                acc[sector] = (acc[sector] || 0) + stock.value;
                return acc;
              }, {} as Record<string, number>)).map(([name, value]) => ({
                name,
                value: Number(((value as number) / stocks.reduce((sum, s) => sum + s.value, 0) * 100).toFixed(1))
              }))
            }
            colors={['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#84cc16', '#14b8a6', '#06b6d4', '#a855f7']}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Allocation Analysis</CardTitle>
          <CardDescription>Sector breakdown and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Sector Breakdown</h3>
              <div className="space-y-3">
                {(analysisResult && analysisResult.diversification ? 
                  Object.entries(analysisResult.diversification.sector_breakdown).map(([name, value]) => ({
                    name,
                    value: value.replace('%', '')
                  })) : 
                  // Fallback to calculated data from stocks
                  Object.entries(stocks.reduce((acc, stock) => {
                    const sector = stock.sector || 'Other';
                    acc[sector] = (acc[sector] || 0) + stock.value;
                    return acc;
                  }, {} as Record<string, number>)).map(([name, value]) => ({
                    name,
                    value: ((value as number) / stocks.reduce((sum, s) => sum + s.value, 0) * 100).toFixed(1)
                  }))
                ).map((sector, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#84cc16', '#14b8a6', '#06b6d4', '#a855f7'][index % 10] }}
                      ></div>
                      <span>{sector.name}</span>
                    </div>
                    <span className="font-medium">{sector.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Allocation Recommendations</h3>
              <div className="space-y-3">
                {analysisResult && analysisResult.recommendations ? (
                  analysisResult.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="mr-3 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))
                ) : (
                  // Fallback recommendations based on portfolio composition
                  [
                    {
                      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
                      message: 'Consider diversifying across more sectors to reduce risk.'
                    },
                    {
                      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
                      message: 'Aim for no more than 10-15% allocation in any single stock.'
                    },
                    {
                      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
                      message: 'Balance growth stocks with some defensive stocks for stability.'
                    }
                  ].map((rec, index) => (
                    <div key={index} className="flex items-start p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="mr-3 mt-0.5">{rec.icon}</div>
                      <p className="text-sm">{rec.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render the Performance tab content
  const renderPerformanceTab = () => (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Historical performance of your portfolio</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {stocks.length > 0 ? (
            <LineChart 
              data={generatePerformanceData()}
              xKey="date"
              yKey="value"
              color="#0ea5e9"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500">Add stocks to your portfolio to see performance data</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Your best performing stocks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stocks
                .sort((a, b) => b.profitPercentage - a.profitPercentage)
                .slice(0, 3)
                .map((stock, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-sm text-slate-500">{stock.name}</div>
                    </div>
                    <div className="text-green-600 font-medium flex items-center">
                      <TrendingUp className="mr-1 h-4 w-4" />
                      {stock.profitPercentage.toFixed(2)}%
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Underperformers</CardTitle>
            <CardDescription>Your worst performing stocks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stocks
                .sort((a, b) => a.profitPercentage - b.profitPercentage)
                .slice(0, 3)
                .map((stock, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <div>
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-sm text-slate-500">{stock.name}</div>
                    </div>
                    <div className={`font-medium flex items-center ${stock.profitPercentage < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stock.profitPercentage < 0 ? <TrendingDown className="mr-1 h-4 w-4" /> : <TrendingUp className="mr-1 h-4 w-4" />}
                      {stock.profitPercentage.toFixed(2)}%
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  // Render the Risk Analysis tab content
  const renderRiskTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk Metrics</CardTitle>
            <CardDescription>Key risk indicators for your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {riskMetrics.map((metric, index) => (
                <div key={index} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{metric.name}</h3>
                    <span className="font-bold">{metric.value}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{metric.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>Overall portfolio risk level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-amber-500 mb-4">
                <span className="text-2xl font-bold">
                  {analysisResult?.diversification?.risk_flag || "Moderate"}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Your portfolio has a {analysisResult?.diversification?.risk_flag?.toLowerCase() || "moderate"} risk level based on its composition and market exposure.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Low Risk</span>
                  <span className="text-sm">High Risk</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full">
                  <div 
                    className="h-2 bg-amber-500 rounded-full" 
                    style={{ 
                      width: analysisResult?.diversification?.risk_flag === 'Low' ? '30%' : 
                             analysisResult?.diversification?.risk_flag === 'High' ? '80%' : '60%' 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render the Recommendations tab content
  const renderRecommendationsTab = () => {
    // State for saved recommendations with localStorage persistence
    const [savedRecommendations, setSavedRecommendations] = useState<string[]>(() => {
      // Initialize from localStorage if available
      const saved = localStorage.getItem('savedPortfolioRecommendations');
      return saved ? JSON.parse(saved) : [];
    });
    
    // Function to save a recommendation
    const saveRecommendation = (recommendation: string) => {
      if (!savedRecommendations.includes(recommendation)) {
        const updatedRecommendations = [...savedRecommendations, recommendation];
        setSavedRecommendations(updatedRecommendations);
        localStorage.setItem('savedPortfolioRecommendations', JSON.stringify(updatedRecommendations));
        toast({
          title: "Recommendation Saved",
          description: "This recommendation has been saved to your list",
          variant: "default"
        });
      }
    };
    
    // Function to remove a recommendation
    const removeRecommendation = (recommendationToRemove: string) => {
      const updatedRecommendations = savedRecommendations.filter(r => r !== recommendationToRemove);
      setSavedRecommendations(updatedRecommendations);
      localStorage.setItem('savedPortfolioRecommendations', JSON.stringify(updatedRecommendations));
    };
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Recommendations</CardTitle>
            <CardDescription>Expert insights and actionable recommendations for your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            {analysisResult ? (
              <div className="space-y-6">
                {/* Summary Section */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-2">Portfolio Summary</h3>
                  <p className="text-slate-700 dark:text-slate-300">{analysisResult.summary}</p>
                </div>
                
                {/* Recommendations List */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Actionable Recommendations</h3>
                  <div className="space-y-3">
                    {analysisResult.recommendations && analysisResult.recommendations.length > 0 ? (
                      analysisResult.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div className="mr-3 mt-0.5">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-slate-700 dark:text-slate-300">{recommendation}</p>
                          </div>
                          <Button 
                            type="text"
                            size="small"
                            className="ml-2 text-slate-500 hover:text-slate-700"
                            onClick={() => saveRecommendation(recommendation)}
                            disabled={savedRecommendations.includes(recommendation)}
                          >
                            {savedRecommendations.includes(recommendation) ? 
                              "Saved" : "Save"}
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-slate-600 dark:text-slate-400">No recommendations available yet.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Stock-specific Recommendations */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Stock-specific Insights</h3>
                  <div className="space-y-3">
                    {analysisResult.stock_breakdown && analysisResult.stock_breakdown.length > 0 ? (
                      analysisResult.stock_breakdown.map((stock, index) => (
                        <div key={index} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow duration-200">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                              <span className="font-semibold mr-2">{stock.symbol}</span>
                              <Badge variant={
                                stock.recommendation.toLowerCase().includes('hold') ? 'outline' :
                                stock.recommendation.toLowerCase().includes('exit') || stock.recommendation.toLowerCase().includes('sell') ? 'destructive' : 'default'
                              }>
                                {stock.recommendation}
                              </Badge>
                            </div>
                            <div className={`font-medium ${
                              stock.percent_gain.includes('-') ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {stock.percent_gain}
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Sector: {stock.sector}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-slate-600 dark:text-slate-400">No stock-specific insights available yet.</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Ask FinGenie Section */}
                <div className="mt-8 p-4 bg-fin-primary/10 rounded-lg border border-fin-primary/20">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-fin-primary/20 flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fin-primary"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                    </div>
                    <h3 className="text-lg font-semibold">Have questions about your portfolio?</h3>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mb-4">
                    Ask FinGenie for personalized insights about your investments, sector allocation, or specific stocks.
                  </p>
                  <Button variant="default" onClick={() => window.location.href = '/tools/fingenie-chat'}>
                    Chat with FinGenie
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Click "Analyze Portfolio" to get personalized recommendations and insights.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Saved Recommendations Section */}
        {savedRecommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Saved Recommendations</CardTitle>
              <CardDescription>Your saved action items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedRecommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <div className="mr-3 mt-0.5">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-700 dark:text-slate-300">{recommendation}</p>
                    </div>
                    <Button 
                      type="text"
                      size="small"
                      className="ml-2 text-red-500 hover:text-red-700"
                      onClick={() => removeRecommendation(recommendation)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Return the appropriate tab content based on the active tab
  switch (activeTab) {
    case 'overview':
      return renderOverviewTab();
    case 'allocation':
      return renderAllocationTab();
    case 'performance':
      return renderPerformanceTab();
    case 'risk':
      return renderRiskTab();
    case 'recommendations':
      return renderRecommendationsTab();
    default:
      return renderOverviewTab();
  }
}
