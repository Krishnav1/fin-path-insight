import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
  Download,
  Bookmark,
  Share2
} from 'lucide-react';

export default function TechnicalAnalysisPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState('1d');
  const [indicator, setIndicator] = useState('all');
  const [loading, setLoading] = useState(false);
  
  // Mock stock data
  const stockData = {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd.',
    price: 2876.45,
    change: 32.50,
    changePercent: 1.14,
    open: 2850.10,
    high: 2885.75,
    low: 2845.30,
    volume: 2450000,
    marketCap: 1950000000000,
    pe: 22.5,
    dividend: 0.35,
    sector: 'Energy'
  };
  
  // Mock technical indicators
  const technicalIndicators = [
    { name: 'RSI (14)', value: 62.5, signal: 'Neutral', description: 'Relative Strength Index measures momentum' },
    { name: 'MACD', value: '5.2/2.1', signal: 'Bullish', description: 'Moving Average Convergence Divergence' },
    { name: 'MA (50)', value: 2750.25, signal: 'Bullish', description: '50-day Moving Average' },
    { name: 'MA (200)', value: 2650.80, signal: 'Bullish', description: '200-day Moving Average' },
    { name: 'Bollinger Bands', value: '2750-2950', signal: 'Neutral', description: 'Volatility indicator' },
    { name: 'Stochastic', value: 75.3, signal: 'Neutral', description: 'Momentum indicator comparing closing price to price range' }
  ];
  
  // Mock chart patterns
  const chartPatterns = [
    { name: 'Double Bottom', confidence: 'High', timeframe: '1M', description: 'Bullish reversal pattern' },
    { name: 'Golden Cross', confidence: 'Medium', timeframe: '1W', description: '50-day MA crossed above 200-day MA' }
  ];
  
  // Mock support and resistance levels
  const supportResistance = [
    { type: 'Resistance', level: 2900, strength: 'Strong' },
    { type: 'Resistance', level: 2950, strength: 'Moderate' },
    { type: 'Support', level: 2800, strength: 'Strong' },
    { type: 'Support', level: 2750, strength: 'Moderate' }
  ];
  
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Technical Analysis</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Analyze stock price movements, patterns, and technical indicators
          </p>
          
          {/* Search Section */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="stock-search" className="mb-2 block">Enter Stock Symbol</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      id="stock-search" 
                      placeholder="e.g. RELIANCE.NS, TCS.NS" 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="timeframe" className="mb-2 block">Timeframe</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger id="timeframe" className="w-[140px]">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">1 Day</SelectItem>
                      <SelectItem value="1w">1 Week</SelectItem>
                      <SelectItem value="1m">1 Month</SelectItem>
                      <SelectItem value="3m">3 Months</SelectItem>
                      <SelectItem value="6m">6 Months</SelectItem>
                      <SelectItem value="1y">1 Year</SelectItem>
                      <SelectItem value="5y">5 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="indicator" className="mb-2 block">Indicators</Label>
                  <Select value={indicator} onValueChange={setIndicator}>
                    <SelectTrigger id="indicator" className="w-[140px]">
                      <SelectValue placeholder="Select indicators" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Indicators</SelectItem>
                      <SelectItem value="momentum">Momentum</SelectItem>
                      <SelectItem value="trend">Trend</SelectItem>
                      <SelectItem value="volatility">Volatility</SelectItem>
                      <SelectItem value="volume">Volume</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Search className="mr-2 h-4 w-4" />
                        Analyze
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Stock Overview */}
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-2xl">{stockData.symbol}</CardTitle>
                    <Badge variant="outline">{stockData.sector}</Badge>
                  </div>
                  <CardDescription className="text-base">{stockData.name}</CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold mb-1">₹{stockData.price.toFixed(2)}</div>
                  <div className={`flex items-center justify-end ${stockData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stockData.change >= 0 ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <span>{stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)}</span>
                    <span className="ml-1">({stockData.changePercent.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Open</div>
                  <div className="font-medium">₹{stockData.open.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">High</div>
                  <div className="font-medium">₹{stockData.high.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Low</div>
                  <div className="font-medium">₹{stockData.low.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Volume</div>
                  <div className="font-medium">{(stockData.volume / 1000000).toFixed(2)}M</div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Chart Placeholder */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Price Chart</CardTitle>
              <CardDescription>
                {stockData.symbol} price movement with selected indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-slate-500 dark:text-slate-400 mb-2">Interactive chart would be displayed here</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    Showing {stockData.symbol} with {timeframe === '1d' ? '1 Day' : timeframe === '1w' ? '1 Week' : timeframe === '1m' ? '1 Month' : timeframe === '3m' ? '3 Months' : timeframe === '6m' ? '6 Months' : timeframe === '1y' ? '1 Year' : '5 Years'} timeframe
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Technical Analysis Tabs */}
          <Tabs defaultValue="indicators" className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="indicators">Technical Indicators</TabsTrigger>
              <TabsTrigger value="patterns">Chart Patterns</TabsTrigger>
              <TabsTrigger value="levels">Support & Resistance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="indicators" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Indicators</CardTitle>
                  <CardDescription>
                    Key technical indicators for {stockData.symbol}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {technicalIndicators.map((indicator, index) => (
                      <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{indicator.name}</h3>
                          <Badge 
                            variant={indicator.signal === 'Bullish' ? 'default' : indicator.signal === 'Bearish' ? 'destructive' : 'outline'}
                            className={indicator.signal === 'Neutral' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200' : ''}
                          >
                            {indicator.signal}
                          </Badge>
                        </div>
                        <div className="text-lg font-bold mb-2">{indicator.value}</div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{indicator.description}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-fin-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">Technical Analysis Summary</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-2">
                          Based on the technical indicators, the overall signal for {stockData.symbol} is <span className="font-medium text-green-600">Bullish</span>.
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          4 indicators are bullish, 2 are neutral, and 0 are bearish. The stock is trading above both its 50-day and 200-day moving averages, indicating a strong uptrend.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="patterns" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Chart Patterns</CardTitle>
                  <CardDescription>
                    Identified chart patterns for {stockData.symbol}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chartPatterns.length > 0 ? (
                    <div className="space-y-6">
                      {chartPatterns.map((pattern, index) => (
                        <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold">{pattern.name}</h3>
                            <Badge 
                              variant="outline"
                              className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200"
                            >
                              {pattern.timeframe} Timeframe
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Confidence</div>
                              <div className="font-medium">{pattern.confidence}</div>
                            </div>
                            <div className="md:col-span-2">
                              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Description</div>
                              <div className="font-medium">{pattern.description}</div>
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-fin-primary mt-0.5" />
                              <div>
                                <h4 className="font-medium mb-1">Pattern Implication</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {pattern.name === 'Double Bottom' 
                                    ? 'A double bottom pattern indicates a potential reversal from a downtrend to an uptrend. The price has tested a support level twice and bounced, suggesting buying pressure at that level.'
                                    : 'A golden cross is a bullish signal where the 50-day moving average crosses above the 200-day moving average, suggesting potential for continued upward momentum.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-slate-500 dark:text-slate-400 mb-2">No chart patterns detected</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500">
                        Try changing the timeframe to identify potential patterns
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="levels" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Support & Resistance Levels</CardTitle>
                  <CardDescription>
                    Key price levels for {stockData.symbol}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative h-60 mb-8 bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                    <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-slate-300 dark:border-slate-600"></div>
                    
                    {/* Resistance levels */}
                    {supportResistance.filter(level => level.type === 'Resistance').map((level, index) => (
                      <div 
                        key={index} 
                        className="absolute left-0 right-0 border-t-2 border-red-500" 
                        style={{ 
                          top: `${30 + index * 20}%`,
                        }}
                      >
                        <div className="absolute right-4 -top-3 bg-white dark:bg-slate-800 px-2 text-sm text-red-500 font-medium flex items-center">
                          <span>R: ₹{level.level}</span>
                          <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-800">{level.strength}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Current price */}
                    <div 
                      className="absolute left-0 right-0 border-t-2 border-blue-500" 
                      style={{ top: '50%' }}
                    >
                      <div className="absolute left-4 -top-3 bg-white dark:bg-slate-800 px-2 text-sm text-blue-500 font-medium">
                        Current: ₹{stockData.price.toFixed(2)}
                      </div>
                    </div>
                    
                    {/* Support levels */}
                    {supportResistance.filter(level => level.type === 'Support').map((level, index) => (
                      <div 
                        key={index} 
                        className="absolute left-0 right-0 border-t-2 border-green-500" 
                        style={{ 
                          top: `${70 + index * 20}%`,
                        }}
                      >
                        <div className="absolute right-4 -top-3 bg-white dark:bg-slate-800 px-2 text-sm text-green-500 font-medium flex items-center">
                          <span>S: ₹{level.level}</span>
                          <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800">{level.strength}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Resistance Levels</h3>
                      <div className="space-y-3">
                        {supportResistance.filter(level => level.type === 'Resistance').map((level, index) => (
                          <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <div className="font-medium">₹{level.level}</div>
                            <Badge 
                              variant="outline"
                              className={`${
                                level.strength === 'Strong' 
                                  ? 'bg-red-100 text-red-800 border-red-200' 
                                  : 'bg-amber-100 text-amber-800 border-amber-200'
                              }`}
                            >
                              {level.strength}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Support Levels</h3>
                      <div className="space-y-3">
                        {supportResistance.filter(level => level.type === 'Support').map((level, index) => (
                          <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <div className="font-medium">₹{level.level}</div>
                            <Badge 
                              variant="outline"
                              className={`${
                                level.strength === 'Strong' 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-amber-100 text-amber-800 border-amber-200'
                              }`}
                            >
                              {level.strength}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-fin-primary mt-0.5" />
                      <div>
                        <h3 className="font-medium mb-1">Trading Insight</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          The stock is currently trading between strong support at ₹2800 and resistance at ₹2900. A breakout above ₹2900 could signal further upside potential, while a breakdown below ₹2800 might indicate a reversal of the current trend.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
