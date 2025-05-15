import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, TrendingUp, TrendingDown, ArrowUpDown, Download, Share2, Bookmark, Eye } from 'lucide-react';

export default function StockScreenerPage() {
  const [activeTab, setActiveTab] = useState('predefined');
  const [loading, setLoading] = useState(false);
  const [peRatio, setPeRatio] = useState([0, 50]);
  const [marketCap, setMarketCap] = useState([0, 100]);
  const [dividend, setDividend] = useState([0, 10]);
  
  // Mock data for predefined screens
  const predefinedScreens = [
    { id: 'value', name: 'Value Stocks', description: 'Stocks with low P/E ratio and high dividend yield' },
    { id: 'growth', name: 'Growth Stocks', description: 'Stocks with high earnings growth and revenue growth' },
    { id: 'dividend', name: 'Dividend Stocks', description: 'Stocks with consistent dividend payments and high yield' },
    { id: 'momentum', name: 'Momentum Stocks', description: 'Stocks showing strong price momentum and volume' },
    { id: 'largecap', name: 'Large Cap Stocks', description: 'Stocks with market capitalization above ₹20,000 crore' },
    { id: 'smallcap', name: 'Small Cap Stocks', description: 'Stocks with market capitalization below ₹5,000 crore' }
  ];
  
  // Mock data for screened stocks
  const screenedStocks = [
    { 
      symbol: 'RELIANCE.NS', 
      name: 'Reliance Industries Ltd.', 
      price: 2876.45, 
      change: 1.25, 
      peRatio: 22.5, 
      marketCap: 1950000, 
      dividend: 0.35, 
      sector: 'Energy'
    },
    { 
      symbol: 'TCS.NS', 
      name: 'Tata Consultancy Services Ltd.', 
      price: 3456.80, 
      change: -0.75, 
      peRatio: 29.8, 
      marketCap: 1275000, 
      dividend: 3.82, 
      sector: 'Technology'
    },
    { 
      symbol: 'HDFCBANK.NS', 
      name: 'HDFC Bank Ltd.', 
      price: 1678.25, 
      change: 0.45, 
      peRatio: 19.2, 
      marketCap: 930000, 
      dividend: 1.15, 
      sector: 'Financial Services'
    },
    { 
      symbol: 'INFY.NS', 
      name: 'Infosys Ltd.', 
      price: 1456.30, 
      change: -1.20, 
      peRatio: 25.6, 
      marketCap: 610000, 
      dividend: 2.76, 
      sector: 'Technology'
    },
    { 
      symbol: 'SUNPHARMA.NS', 
      name: 'Sun Pharmaceutical Industries Ltd.', 
      price: 1023.45, 
      change: 2.15, 
      peRatio: 31.2, 
      marketCap: 245000, 
      dividend: 0.85, 
      sector: 'Healthcare'
    }
  ];
  
  // Format market cap in crores
  const formatMarketCap = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} Lakh Cr`;
    } else {
      return `₹${(value / 1000).toFixed(2)} K Cr`;
    }
  };
  
  const handleSearch = () => {
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
          <h1 className="text-3xl font-bold mb-2">Stock Screener</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Find investment opportunities that match your criteria in the Indian stock market
          </p>
          
          <Tabs defaultValue="predefined" onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="predefined">Predefined Screens</TabsTrigger>
              <TabsTrigger value="custom">Custom Screener</TabsTrigger>
            </TabsList>
            
            <TabsContent value="predefined" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {predefinedScreens.map((screen) => (
                  <Card key={screen.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle>{screen.name}</CardTitle>
                      <CardDescription>{screen.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button className="w-full">View Stocks</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Stock Screener</CardTitle>
                  <CardDescription>Set your own criteria to find stocks that match your investment strategy</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sector">Sector</Label>
                        <Select>
                          <SelectTrigger id="sector">
                            <SelectValue placeholder="All Sectors" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sectors</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="financial">Financial Services</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="consumer">Consumer Goods</SelectItem>
                            <SelectItem value="energy">Energy</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="exchange">Exchange</Label>
                        <Select>
                          <SelectTrigger id="exchange">
                            <SelectValue placeholder="NSE" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nse">NSE</SelectItem>
                            <SelectItem value="bse">BSE</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="index">Index</Label>
                        <Select>
                          <SelectTrigger id="index">
                            <SelectValue placeholder="All Stocks" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Stocks</SelectItem>
                            <SelectItem value="nifty50">NIFTY 50</SelectItem>
                            <SelectItem value="nifty100">NIFTY 100</SelectItem>
                            <SelectItem value="nifty500">NIFTY 500</SelectItem>
                            <SelectItem value="sensex">SENSEX</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>P/E Ratio</Label>
                          <span className="text-sm text-slate-500">{peRatio[0]} - {peRatio[1]}</span>
                        </div>
                        <Slider 
                          defaultValue={[0, 50]} 
                          max={100} 
                          step={1} 
                          value={peRatio}
                          onValueChange={setPeRatio}
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>Market Cap (₹K Cr)</Label>
                          <span className="text-sm text-slate-500">{marketCap[0]} - {marketCap[1]}</span>
                        </div>
                        <Slider 
                          defaultValue={[0, 100]} 
                          max={100} 
                          step={1}
                          value={marketCap}
                          onValueChange={setMarketCap}
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label>Dividend Yield (%)</Label>
                          <span className="text-sm text-slate-500">{dividend[0]} - {dividend[1]}</span>
                        </div>
                        <Slider 
                          defaultValue={[0, 10]} 
                          max={20} 
                          step={0.1}
                          value={dividend}
                          onValueChange={setDividend}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="price-change">Price Change</Label>
                        <Select>
                          <SelectTrigger id="price-change">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any</SelectItem>
                            <SelectItem value="positive">Positive</SelectItem>
                            <SelectItem value="negative">Negative</SelectItem>
                            <SelectItem value="up5">Up 5%+</SelectItem>
                            <SelectItem value="down5">Down 5%+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch id="profitable" />
                        <Label htmlFor="profitable">Profitable Companies Only</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch id="dividend-payers" />
                        <Label htmlFor="dividend-payers">Dividend Paying Stocks</Label>
                      </div>
                      
                      <div className="pt-4">
                        <Button onClick={handleSearch} className="w-full">
                          {loading ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Searching...
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <Search className="mr-2 h-4 w-4" />
                              Search Stocks
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Results Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Screened Stocks</CardTitle>
                  <CardDescription>Showing {screenedStocks.length} results</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Symbol</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Change
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          P/E Ratio
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Market Cap
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          Div Yield
                          <ArrowUpDown className="ml-1 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {screenedStocks.map((stock) => (
                      <TableRow key={stock.symbol}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{stock.symbol}</div>
                            <div className="text-sm text-slate-500">{stock.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>₹{stock.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className={`flex items-center ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stock.change >= 0 ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
                            {stock.change >= 0 ? '+' : ''}{stock.change}%
                          </div>
                        </TableCell>
                        <TableCell>{stock.peRatio.toFixed(1)}</TableCell>
                        <TableCell>{formatMarketCap(stock.marketCap)}</TableCell>
                        <TableCell>{stock.dividend.toFixed(2)}%</TableCell>
                        <TableCell>
                          <Badge variant="outline">{stock.sector}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Bookmark className="h-4 w-4" />
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
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
