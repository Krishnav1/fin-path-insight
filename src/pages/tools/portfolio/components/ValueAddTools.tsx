import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Portfolio } from '@/types/portfolio';
import { 
  RefreshCw, 
  TrendingDown, 
  TrendingUp, 
  BarChart4, 
  Calendar, 
  Calculator, 
  ArrowDownRight, 
  ArrowUpRight,
  Newspaper,
  Percent
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ValueAddToolsProps {
  portfolioData: Portfolio;
}

export default function ValueAddTools({ portfolioData }: ValueAddToolsProps) {
  const [rebalancingTarget, setRebalancingTarget] = useState<'equal' | 'custom' | 'market'>('custom');
  const [whatIfSymbol, setWhatIfSymbol] = useState('RELIANCE.NS');
  const [whatIfChange, setWhatIfChange] = useState(-5);
  const [whatIfResult, setWhatIfResult] = useState<{
    newPortfolioValue: number;
    impact: number;
    impactPercentage: number;
  } | null>(null);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Handle what-if calculation
  const calculateWhatIf = () => {
    const holding = portfolioData.holdings.find(h => h.symbol === whatIfSymbol);
    
    if (!holding) return;
    
    const currentValue = holding.value || 0;
    const changeAmount = currentValue * (whatIfChange / 100);
    const newPortfolioValue = (portfolioData.totalValue || 0) + changeAmount;
    
    setWhatIfResult({
      newPortfolioValue,
      impact: changeAmount,
      impactPercentage: (changeAmount / (portfolioData.totalValue || 1)) * 100
    });
  };
  
  // Mock rebalancing suggestions
  const rebalancingSuggestions = [
    { 
      symbol: 'TCS.NS', 
      name: 'Tata Consultancy Services Ltd.', 
      currentAllocation: 8.3, 
      targetAllocation: 6.0, 
      action: 'Reduce', 
      amount: 28750 
    },
    { 
      symbol: 'RELIANCE.NS', 
      name: 'Reliance Industries Ltd.', 
      currentAllocation: 11.5, 
      targetAllocation: 10.0, 
      action: 'Reduce', 
      amount: 18750 
    },
    { 
      symbol: 'SUNPHARMA.NS', 
      name: 'Sun Pharmaceutical Industries Ltd.', 
      currentAllocation: 4.9, 
      targetAllocation: 7.0, 
      action: 'Add', 
      amount: 26250 
    },
    { 
      symbol: 'NESTLEIND.NS', 
      name: 'Nestle India Ltd.', 
      currentAllocation: 0, 
      targetAllocation: 5.0, 
      action: 'Add', 
      amount: 62500 
    }
  ];
  
  // Mock news
  const mockNews = [
    {
      title: 'TCS Reports Strong Q2 Results, Beats Estimates',
      date: '2023-10-12',
      source: 'Economic Times',
      snippet: 'Tata Consultancy Services reported a 5.2% rise in quarterly profit, beating analyst estimates...',
      impact: 'Positive',
      relevantHoldings: ['TCS.NS']
    },
    {
      title: 'RBI Keeps Repo Rate Unchanged at 6.5%',
      date: '2023-10-06',
      source: 'Business Standard',
      snippet: 'The Reserve Bank of India maintained its key lending rate, citing inflation concerns...',
      impact: 'Neutral',
      relevantHoldings: ['HDFCBANK.NS', 'RELIANCE.NS']
    },
    {
      title: 'Pharma Sector Set for Growth as Govt Announces New Healthcare Policy',
      date: '2023-09-28',
      source: 'Mint',
      snippet: 'The government has announced a comprehensive healthcare policy that is expected to boost the pharmaceutical sector...',
      impact: 'Positive',
      relevantHoldings: ['SUNPHARMA.NS']
    }
  ];
  
  // Mock tax estimates
  const mockTaxEstimates = [
    {
      symbol: 'INFY.NS',
      buyDate: '2022-06-05',
      sellDate: '2023-10-15',
      quantity: 20,
      buyPrice: 1300,
      sellPrice: 1456.30,
      gain: 3126,
      taxRate: 15,
      taxAmount: 468.9
    },
    {
      symbol: 'TCS.NS',
      buyDate: '2022-05-20',
      sellDate: '2023-10-15',
      quantity: 10,
      buyPrice: 3200,
      sellPrice: 3456.80,
      gain: 2568,
      taxRate: 15,
      taxAmount: 385.2
    }
  ];
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="rebalancing">
        <TabsList className="mb-6">
          <TabsTrigger value="rebalancing">Smart Rebalancing</TabsTrigger>
          <TabsTrigger value="whatif">What-If Scenarios</TabsTrigger>
          <TabsTrigger value="news">News Impact</TabsTrigger>
          <TabsTrigger value="tax">Tax Estimator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rebalancing">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Rebalancing</CardTitle>
              <CardDescription>Optimize your portfolio allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="space-y-2">
                    <Label>Rebalancing Strategy</Label>
                    <Select 
                      value={rebalancingTarget} 
                      onValueChange={(value: 'equal' | 'custom' | 'market') => setRebalancingTarget(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equal">Equal Weight</SelectItem>
                        <SelectItem value="custom">Custom Allocation</SelectItem>
                        <SelectItem value="market">Market Weight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-md space-y-3 dark:bg-slate-800">
                    <h4 className="font-medium">Strategy Details</h4>
                    {rebalancingTarget === 'equal' && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Equal weight allocates the same percentage to each holding, regardless of market cap or sector.
                      </p>
                    )}
                    {rebalancingTarget === 'custom' && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Custom allocation allows you to set your own target percentages for each holding or sector.
                      </p>
                    )}
                    {rebalancingTarget === 'market' && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Market weight aligns your sector allocations with benchmark indices like NIFTY 50.
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Current Drift:</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">12.4%</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Rebalancing Cost:</span>
                      <span className="font-medium">₹1,250</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Tax Impact:</span>
                      <span className="font-medium">₹8,540</span>
                    </div>
                  </div>
                  
                  <Button className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Rebalancing Plan
                  </Button>
                </div>
                
                <div className="lg:col-span-2">
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Current %</TableHead>
                          <TableHead>Target %</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rebalancingSuggestions.map((suggestion, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{suggestion.symbol}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{suggestion.name}</div>
                              </div>
                            </TableCell>
                            <TableCell>{suggestion.currentAllocation.toFixed(1)}%</TableCell>
                            <TableCell>{suggestion.targetAllocation.toFixed(1)}%</TableCell>
                            <TableCell>
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                suggestion.action === 'Add' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                              }`}>
                                {suggestion.action === 'Add' ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {suggestion.action}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(suggestion.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    This rebalancing plan aims to optimize your portfolio according to your selected strategy while minimizing transaction costs and tax impact.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="whatif">
          <Card>
            <CardHeader>
              <CardTitle>What-If Scenario Analysis</CardTitle>
              <CardDescription>Simulate market events and their impact on your portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="space-y-2">
                    <Label>Select Stock</Label>
                    <Select 
                      value={whatIfSymbol} 
                      onValueChange={setWhatIfSymbol}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a stock" />
                      </SelectTrigger>
                      <SelectContent>
                        {portfolioData.holdings.map((holding, index) => (
                          <SelectItem key={index} value={holding.symbol}>
                            {holding.symbol} - {holding.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Price Change (%)</Label>
                      <span className="text-sm font-medium">{whatIfChange}%</span>
                    </div>
                    <Slider
                      value={[whatIfChange]}
                      min={-50}
                      max={50}
                      step={1}
                      onValueChange={(value) => setWhatIfChange(value[0])}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>-50%</span>
                      <span>0%</span>
                      <span>+50%</span>
                    </div>
                  </div>
                  
                  <Button onClick={calculateWhatIf} className="w-full">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Impact
                  </Button>
                </div>
                
                <div className="lg:col-span-2">
                  {whatIfResult ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-slate-50 rounded-md dark:bg-slate-800">
                          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">New Portfolio Value</div>
                          <div className="text-xl font-bold">{formatCurrency(whatIfResult.newPortfolioValue)}</div>
                        </div>
                        
                        <div className="p-4 bg-slate-50 rounded-md dark:bg-slate-800">
                          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Absolute Impact</div>
                          <div className={`text-xl font-bold flex items-center ${whatIfResult.impact >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {whatIfResult.impact >= 0 ? (
                              <ArrowUpRight className="h-5 w-5 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5 mr-1" />
                            )}
                            {formatCurrency(Math.abs(whatIfResult.impact))}
                          </div>
                        </div>
                        
                        <div className="p-4 bg-slate-50 rounded-md dark:bg-slate-800">
                          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Relative Impact</div>
                          <div className={`text-xl font-bold flex items-center ${whatIfResult.impactPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {whatIfResult.impactPercentage >= 0 ? (
                              <ArrowUpRight className="h-5 w-5 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5 mr-1" />
                            )}
                            {Math.abs(whatIfResult.impactPercentage).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-slate-50 rounded-md dark:bg-slate-800">
                        <h4 className="font-medium mb-2">FinGenie Analysis</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {whatIfChange < 0 ? (
                            <>
                              If {whatIfSymbol} drops by {Math.abs(whatIfChange)}%, your portfolio would {whatIfResult.impactPercentage < -1 ? 'be significantly affected' : 'experience a minor impact'} with a {Math.abs(whatIfResult.impactPercentage).toFixed(2)}% decrease in total value. This {Math.abs(whatIfResult.impactPercentage) > 2 ? 'highlights a concentration risk' : 'shows good diversification'} in your portfolio.
                            </>
                          ) : (
                            <>
                              If {whatIfSymbol} increases by {whatIfChange}%, your portfolio would gain {whatIfResult.impactPercentage.toFixed(2)}% in total value. This would result in an increase of {formatCurrency(whatIfResult.impact)} to your portfolio.
                            </>
                          )}
                        </p>
                      </div>
                      
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Try different scenarios to understand how your portfolio might respond to market changes and identify potential vulnerabilities.
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-6">
                      <Calculator className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Run a What-If Scenario</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md mb-4">
                        Select a stock and adjust the price change percentage to see how it would impact your overall portfolio.
                      </p>
                      <Button onClick={calculateWhatIf}>
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate Impact
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="news">
          <Card>
            <CardHeader>
              <CardTitle>News Impact Analyzer</CardTitle>
              <CardDescription>See how recent news might affect your portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockNews.map((news, index) => (
                  <div key={index} className="p-4 border rounded-md">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{news.title}</h3>
                      <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        news.impact === 'Positive' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : news.impact === 'Negative'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {news.impact}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{news.date}</span>
                      <span className="mx-2">•</span>
                      <Newspaper className="h-3 w-3 mr-1" />
                      <span>{news.source}</span>
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {news.snippet}
                    </p>
                    
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium">Relevant Holdings:</span>{' '}
                      {news.relevantHoldings.map((symbol, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 mr-1">
                          {symbol}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-center">
                  <Button variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Load More News
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax Estimator</CardTitle>
              <CardDescription>Calculate potential tax implications of selling holdings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="space-y-2">
                    <Label>Select Holding</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a holding" />
                      </SelectTrigger>
                      <SelectContent>
                        {portfolioData.holdings.map((holding, index) => (
                          <SelectItem key={index} value={holding.symbol}>
                            {holding.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Quantity to Sell</Label>
                    <Input type="number" placeholder="Enter quantity" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Sell Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                      <Input className="pl-7" type="number" placeholder="Enter price" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Sell Date</Label>
                    <Input type="date" />
                  </div>
                  
                  <Button className="w-full">
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculate Tax
                  </Button>
                </div>
                
                <div className="lg:col-span-2">
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Buy Date</TableHead>
                          <TableHead>Holding Period</TableHead>
                          <TableHead>Gain/Loss</TableHead>
                          <TableHead>Tax Rate</TableHead>
                          <TableHead className="text-right">Tax Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockTaxEstimates.map((estimate, index) => {
                          // Calculate holding period in months
                          const buyDate = new Date(estimate.buyDate);
                          const sellDate = new Date(estimate.sellDate);
                          const holdingPeriod = (sellDate.getFullYear() - buyDate.getFullYear()) * 12 + 
                                              sellDate.getMonth() - buyDate.getMonth();
                          
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{estimate.symbol}</TableCell>
                              <TableCell>{new Date(estimate.buyDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                {holdingPeriod} months
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {holdingPeriod >= 12 ? 'Long-term' : 'Short-term'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className={`flex items-center ${estimate.gain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {estimate.gain >= 0 ? (
                                    <ArrowUpRight className="h-4 w-4 mr-1" />
                                  ) : (
                                    <ArrowDownRight className="h-4 w-4 mr-1" />
                                  )}
                                  {formatCurrency(estimate.gain)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Percent className="h-4 w-4 mr-1 text-slate-500" />
                                  {estimate.taxRate}%
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(estimate.taxAmount)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        
                        {/* Total row */}
                        <TableRow>
                          <TableCell colSpan={5} className="text-right font-medium">
                            Total Estimated Tax
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(
                              mockTaxEstimates.reduce((sum, item) => sum + item.taxAmount, 0)
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-4 p-4 bg-slate-50 rounded-md dark:bg-slate-800">
                    <h4 className="font-medium mb-2">Tax Notes</h4>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5"></div>
                        <span>Short-term capital gains (held for less than 12 months) are taxed at your income tax slab rate.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5"></div>
                        <span>Long-term capital gains (held for more than 12 months) are taxed at 10% for gains exceeding ₹1 lakh.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5"></div>
                        <span>This is a simplified estimate. Please consult with a tax professional for personalized advice.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
