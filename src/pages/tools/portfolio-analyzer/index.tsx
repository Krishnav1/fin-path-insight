import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PieChart, BarChart, LineChart } from '@/components/ui/charts';
import { 
  Upload, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Share2,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  Trash2,
  Edit,
  Plus
} from 'lucide-react';

export default function PortfolioAnalyzerPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isDragging, setIsDragging] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  
  // Automatically redirect to the functional portfolio page after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setRedirecting(true);
      setTimeout(() => {
        navigate('/tools/portfolio');
      }, 2000);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  // Mock portfolio data
  const portfolioData = {
    totalValue: 1250000,
    invested: 1000000,
    returns: 250000,
    returnsPercentage: 25,
    stocks: [
      { 
        symbol: 'RELIANCE.NS', 
        name: 'Reliance Industries Ltd.', 
        quantity: 50, 
        buyPrice: 2500, 
        currentPrice: 2876.45,
        value: 143822.50,
        profit: 18822.50,
        profitPercentage: 15.06,
        allocation: 11.51,
        sector: 'Energy'
      },
      { 
        symbol: 'TCS.NS', 
        name: 'Tata Consultancy Services Ltd.', 
        quantity: 30, 
        buyPrice: 3200, 
        currentPrice: 3456.80,
        value: 103704,
        profit: 7704,
        profitPercentage: 8.02,
        allocation: 8.30,
        sector: 'Technology'
      },
      { 
        symbol: 'HDFCBANK.NS', 
        name: 'HDFC Bank Ltd.', 
        quantity: 100, 
        buyPrice: 1500, 
        currentPrice: 1678.25,
        value: 167825,
        profit: 17825,
        profitPercentage: 11.88,
        allocation: 13.43,
        sector: 'Financial Services'
      },
      { 
        symbol: 'INFY.NS', 
        name: 'Infosys Ltd.', 
        quantity: 80, 
        buyPrice: 1300, 
        currentPrice: 1456.30,
        value: 116504,
        profit: 12504,
        profitPercentage: 12.02,
        allocation: 9.32,
        sector: 'Technology'
      },
      { 
        symbol: 'SUNPHARMA.NS', 
        name: 'Sun Pharmaceutical Industries Ltd.', 
        quantity: 60, 
        buyPrice: 900, 
        currentPrice: 1023.45,
        value: 61407,
        profit: 7407,
        profitPercentage: 13.72,
        allocation: 4.91,
        sector: 'Healthcare'
      }
    ]
  };
  
  // Mock sector allocation data for pie chart
  const sectorAllocationData = [
    { name: 'Financial Services', value: 35 },
    { name: 'Technology', value: 25 },
    { name: 'Energy', value: 15 },
    { name: 'Healthcare', value: 12 },
    { name: 'Consumer Goods', value: 8 },
    { name: 'Others', value: 5 }
  ];
  
  // Mock performance data for line chart
  const performanceData = [
    { date: 'Jan', value: 1000000 },
    { date: 'Feb', value: 1020000 },
    { date: 'Mar', value: 1050000 },
    { date: 'Apr', value: 1080000 },
    { date: 'May', value: 1100000 },
    { date: 'Jun', value: 1150000 },
    { date: 'Jul', value: 1200000 },
    { date: 'Aug', value: 1250000 }
  ];
  
  // Mock risk metrics
  const riskMetrics = [
    { name: 'Beta', value: 1.2, description: 'Portfolio is more volatile than the market' },
    { name: 'Alpha', value: 3.5, description: 'Portfolio outperforms the market by 3.5%' },
    { name: 'Sharpe Ratio', value: 1.8, description: 'Good risk-adjusted returns' },
    { name: 'Standard Deviation', value: 15.2, description: 'Moderate volatility' },
    { name: 'Max Drawdown', value: -12.5, description: 'Maximum loss from peak to trough' }
  ];
  
  // Mock recommendations
  const recommendations = [
    { 
      type: 'alert', 
      message: 'Your portfolio is overweight in the Technology sector (25% vs. benchmark 18%)',
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />
    },
    { 
      type: 'suggestion', 
      message: 'Consider adding more defensive stocks to reduce portfolio volatility',
      icon: <TrendingDown className="h-5 w-5 text-blue-500" />
    },
    { 
      type: 'positive', 
      message: 'Your diversification across large-cap stocks is good',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />
    }
  ];
  
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      
      {/* Prototype Banner */}
      <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>
              <strong>Prototype Version:</strong> This is a non-functional prototype. You are being redirected to the actual portfolio tool{redirecting ? '...' : ''}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/tools/portfolio')}
          >
            Go to Portfolio Tool Now
          </Button>
        </div>
      </div>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Portfolio Analyzer</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Analyze your investment portfolio performance, risk, and allocation
          </p>
          
          {/* Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Import Your Portfolio</CardTitle>
              <CardDescription>
                Upload your portfolio data or manually add your investments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    isDragging ? 'border-fin-primary bg-fin-primary/5' : 'border-slate-200 dark:border-slate-700'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-slate-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Drag & Drop CSV File</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">
                      or click to browse your files
                    </p>
                    <Input 
                      type="file" 
                      accept=".csv" 
                      className="hidden" 
                      id="portfolio-file" 
                      onChange={handleFileChange}
                    />
                    <Label htmlFor="portfolio-file" asChild>
                      <Button variant="outline">Select CSV File</Button>
                    </Label>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Template & Instructions</h3>
                  <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                      Download our CSV template and fill it with your portfolio data. The template includes:
                    </p>
                    <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 space-y-1">
                      <li>Stock symbol (e.g., RELIANCE.NS)</li>
                      <li>Quantity of shares</li>
                      <li>Purchase price per share</li>
                      <li>Purchase date (optional)</li>
                    </ul>
                    <Button variant="outline" className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Stocks Manually
              </Button>
              <Button>Analyze Portfolio</Button>
            </CardFooter>
          </Card>
          
          {/* Portfolio Analysis Tabs */}
          <Tabs defaultValue="overview" onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="allocation">Allocation</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">₹{(portfolioData.totalValue / 100000).toFixed(2)} L</div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Invested: ₹{(portfolioData.invested / 100000).toFixed(2)} L
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Returns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">₹{(portfolioData.returns / 100000).toFixed(2)} L</div>
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>{portfolioData.returnsPercentage.toFixed(2)}%</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Holdings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{portfolioData.stocks.length}</div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Across {new Set(portfolioData.stocks.map(stock => stock.sector)).size} sectors
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Portfolio Holdings</CardTitle>
                      <CardDescription>Your current stock investments</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Stock</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Avg. Buy Price</TableHead>
                          <TableHead>Current Price</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Profit/Loss</TableHead>
                          <TableHead>Allocation</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portfolioData.stocks.map((stock) => (
                          <TableRow key={stock.symbol}>
                            <TableCell className="font-medium">
                              <div>
                                <div className="font-semibold">{stock.symbol}</div>
                                <div className="text-sm text-slate-500">{stock.name}</div>
                              </div>
                            </TableCell>
                            <TableCell>{stock.quantity}</TableCell>
                            <TableCell>₹{stock.buyPrice.toFixed(2)}</TableCell>
                            <TableCell>₹{stock.currentPrice.toFixed(2)}</TableCell>
                            <TableCell>₹{(stock.value / 1000).toFixed(2)}K</TableCell>
                            <TableCell>
                              <div className={`flex items-center ${stock.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stock.profit >= 0 ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                                {stock.profit >= 0 ? '+' : ''}₹{(stock.profit / 1000).toFixed(2)}K
                                <span className="ml-1">({stock.profitPercentage.toFixed(2)}%)</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 mr-2">
                                  <div 
                                    className="h-2 rounded-full bg-fin-primary" 
                                    style={{ width: `${stock.allocation}%` }}
                                  ></div>
                                </div>
                                {stock.allocation.toFixed(1)}%
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Allocation Tab */}
            <TabsContent value="allocation" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Sector Allocation</CardTitle>
                    <CardDescription>Distribution of your investments across sectors</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <PieChart 
                      data={sectorAllocationData}
                      colors={['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316']}
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
                          {sectorAllocationData.map((sector, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'][index % 6] }}
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
                          {recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                              <div className="mr-3 mt-0.5">{rec.icon}</div>
                              <p className="text-sm">{rec.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Performance Tab */}
            <TabsContent value="performance" className="mt-6">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Portfolio Performance</CardTitle>
                  <CardDescription>Historical performance of your portfolio</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <LineChart 
                    data={performanceData}
                    xKey="date"
                    yKey="value"
                    color="#0ea5e9"
                  />
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
                      {portfolioData.stocks
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
                      {portfolioData.stocks
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
            </TabsContent>
            
            {/* Risk Analysis Tab */}
            <TabsContent value="risk" className="mt-6">
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
                          <span className="text-2xl font-bold">Moderate</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">
                          Your portfolio has a moderate risk level based on its composition and market exposure.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Low Risk</span>
                            <span className="text-sm">High Risk</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full">
                            <div className="h-2 bg-amber-500 rounded-full" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                        
                        <Button className="w-full">Get Risk Reduction Tips</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
