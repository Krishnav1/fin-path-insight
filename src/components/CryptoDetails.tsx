import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  getCryptoDetails, 
  getStaticCryptoData, 
  CryptoDetails as CryptoDetailsType 
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

const CryptoDetails = () => {
  const { coinId } = useParams<{ coinId: string }>();
  const [cryptoData, setCryptoData] = useState<CryptoDetailsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCryptoData = async () => {
      if (!coinId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Try fetching from static data first (for high traffic)
        const staticData = await getStaticCryptoData(coinId);
        
        if (staticData) {
          setCryptoData(staticData);
        } else {
          // Fall back to API
          const data = await getCryptoDetails(coinId);
          setCryptoData(data);
        }
      } catch (err) {
        console.error('Error fetching crypto data:', err);
        setError('Failed to load cryptocurrency data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoData();
  }, [coinId]);

  // Format chart data
  const chartData = cryptoData?.marketData?.map(point => ({
    date: new Date(point.date).toLocaleDateString(),
    price: point.price,
  })) || [];

  // Calculate price change color
  const priceChangeColor = cryptoData?.change24h && cryptoData.change24h >= 0 ? 'text-green-600' : 'text-red-600';

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

  if (error || !cryptoData) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error || 'Failed to load cryptocurrency data'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header with basic info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">{cryptoData.symbol}</h1>
          <p className="text-gray-600">{cryptoData.name}</p>
        </div>
        <div className="flex flex-col items-end mt-2 sm:mt-0">
          <div className="flex items-center">
            <span className="text-3xl font-bold mr-2">{formatCurrency(cryptoData.price)}</span>
            <span className={`${priceChangeColor} text-lg font-semibold`}>
              {cryptoData.change24h >= 0 ? '+' : ''}{formatCurrency(cryptoData.change24h)} ({formatPercent(cryptoData.changePercent24h)})
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Last updated: {new Date(cryptoData.lastUpdated).toLocaleString()}
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
            <p className="text-2xl font-bold">{formatLargeNumber(cryptoData.marketCap)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">24h Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatLargeNumber(cryptoData.totalVolume)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Circulating Supply</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatLargeNumber(cryptoData.circulatingSupply)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">All Time High</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(cryptoData.ath)}</p>
            <p className="text-xs text-gray-500">
              {new Date(cryptoData.athDate).toLocaleDateString()}
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
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
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
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Details Section */}
      <Card>
        <CardHeader>
          <CardTitle>Cryptocurrency Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Coin ID</span>
                <span>{cryptoData.coinId}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Symbol</span>
                <span>{cryptoData.symbol}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Name</span>
                <span>{cryptoData.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Current Price</span>
                <span>{formatCurrency(cryptoData.price)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">24h Change</span>
                <span className={priceChangeColor}>
                  {cryptoData.change24h >= 0 ? '+' : ''}{formatCurrency(cryptoData.change24h)} ({formatPercent(cryptoData.changePercent24h)})
                </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Market Cap</span>
                <span>{formatLargeNumber(cryptoData.marketCap)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Total Volume (24h)</span>
                <span>{formatLargeNumber(cryptoData.totalVolume)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Circulating Supply</span>
                <span>{formatLargeNumber(cryptoData.circulatingSupply)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Max Supply</span>
                <span>{cryptoData.maxSupply ? formatLargeNumber(cryptoData.maxSupply) : 'Unlimited'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">All Time High</span>
                <span>
                  {formatCurrency(cryptoData.ath)} 
                  <span className="text-xs text-gray-500 ml-1">
                    ({new Date(cryptoData.athDate).toLocaleDateString()})
                  </span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CryptoDetails; 