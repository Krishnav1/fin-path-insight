import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  getStockDetails, 
  getStaticStockData, 
  StockDetails as StockDetailsType 
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { formatCurrency, formatPercent, formatLargeNumber } from '@/lib/utils';

const StockDetails = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [stockData, setStockData] = useState<StockDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      if (!symbol) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Try fetching from static data first (for high traffic)
        const staticData = await getStaticStockData(symbol);
        
        if (staticData) {
          setStockData(staticData);
        } else {
          // Fall back to API
          const data = await getStockDetails(symbol);
          setStockData(data);
        }
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to load stock data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol]);

  // Format chart data
  const chartData = stockData?.chartData?.map(point => ({
    date: new Date(point.date).toLocaleDateString(),
    price: point.close,
  })) || [];

  // Calculate price change color
  const priceChangeColor = stockData?.change && stockData.change >= 0 ? 'text-green-600' : 'text-red-600';

  // Format financial data for table
  const financialData = stockData?.financialData || [];
  const hasFinancialData = financialData.length > 0;

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !stockData) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error || 'Failed to load stock data'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header with basic info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">{stockData.displaySymbol}</h1>
          <p className="text-gray-600">{stockData.name}</p>
        </div>
        <div className="flex flex-col items-end mt-2 sm:mt-0">
          <div className="flex items-center">
            <span className="text-3xl font-bold mr-2">{formatCurrency(stockData.price)}</span>
            <span className={`${priceChangeColor} text-lg font-semibold`}>
              {stockData.change >= 0 ? '+' : ''}{formatCurrency(stockData.change)} ({formatPercent(stockData.changePercent)})
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Last updated: {new Date(stockData.lastUpdated).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Key metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Market Cap</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatLargeNumber(stockData.marketCap)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">P/E Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stockData.peRatio?.toFixed(2) || 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">EPS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stockData.eps?.toFixed(2) || 'N/A'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">ROE</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stockData.roe ? formatPercent(stockData.roe) : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Price History (1 Year)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleString('default', { month: 'short' });
                  }}
                  minTickGap={30}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value as number), 'Price']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#0ea5e9" 
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for additional data */}
      <Tabs defaultValue="financials">
        <TabsList className="mb-4">
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="financials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Data (Last 3 Years)</CardTitle>
            </CardHeader>
            <CardContent>
              {hasFinancialData ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Year</th>
                        <th className="text-right py-2 px-4">Revenue</th>
                        <th className="text-right py-2 px-4">Net Income</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialData.map((data, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{data.year}</td>
                          <td className="text-right py-2 px-4">{formatLargeNumber(data.revenue)}</td>
                          <td className="text-right py-2 px-4">{formatLargeNumber(data.netIncome)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No financial data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Symbol</span>
                    <span>{stockData.symbol}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Company</span>
                    <span>{stockData.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Current Price</span>
                    <span>{formatCurrency(stockData.price)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Day Change</span>
                    <span className={priceChangeColor}>
                      {stockData.change >= 0 ? '+' : ''}{formatCurrency(stockData.change)} ({formatPercent(stockData.changePercent)})
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Market Cap</span>
                    <span>{formatLargeNumber(stockData.marketCap)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">P/E Ratio</span>
                    <span>{stockData.peRatio?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">EPS</span>
                    <span>{stockData.eps?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Volume</span>
                    <span>{formatLargeNumber(stockData.volume)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockDetails; 