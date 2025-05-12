import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getStocks, 
  getCryptos, 
  getStaticStocksList, 
  getStaticCryptosList, 
  StockSummary, 
  CryptoSummary 
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatPercent } from '@/lib/utils';
import SearchBar from './SearchBar';

const MarketList = () => {
  const [stocks, setStocks] = useState<StockSummary[]>([]);
  const [cryptos, setCryptos] = useState<CryptoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stocks');

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      
      try {
        // Fetch data for active tab
        if (activeTab === 'stocks') {
          // Try fetching from static data first (for high traffic)
          const staticStocks = await getStaticStocksList();
          
          if (staticStocks && staticStocks.length > 0) {
            setStocks(staticStocks);
          } else {
            // Fall back to API
            const data = await getStocks();
            setStocks(data);
          }
        } else {
          // Try fetching from static data first (for high traffic)
          const staticCryptos = await getStaticCryptosList();
          
          if (staticCryptos && staticCryptos.length > 0) {
            setCryptos(staticCryptos);
          } else {
            // Fall back to API
            const data = await getCryptos() as CryptoSummary[];
            setCryptos(data);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${activeTab} data:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [activeTab]);

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-center justify-between py-3 border-b">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderStockList = () => (
    <div className="space-y-1">
      {stocks.map((stock) => {
        const priceChangeColor = stock.change >= 0 ? 'text-green-600' : 'text-red-600';
        
        return (
          <Link 
            key={stock.symbol} 
            to={`/stocks/${stock.symbol}`}
            className="flex items-center justify-between py-3 px-2 border-b hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <div>
              <div className="font-medium">{stock.displaySymbol || stock.symbol.split('.')[0]}</div>
              <div className="text-sm text-gray-500">{stock.name}</div>
            </div>
            <div className="text-right">
              <div>{formatCurrency(stock.price)}</div>
              <div className={priceChangeColor}>
                {stock.change >= 0 ? '+' : ''}{formatPercent(stock.changePercent)}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );

  const renderCryptoList = () => (
    <div className="space-y-1">
      {cryptos.map((crypto) => {
        const priceChangeColor = crypto.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600';
        
        return (
          <Link 
            key={crypto.coinId} 
            to={`/crypto/${crypto.coinId}`}
            className="flex items-center justify-between py-3 px-2 border-b hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <div>
              <div className="font-medium">{crypto.symbol}</div>
              <div className="text-sm text-gray-500">{crypto.name}</div>
            </div>
            <div className="text-right">
              <div>{formatCurrency(crypto.price)}</div>
              <div className={priceChangeColor}>
                {crypto.changePercent24h >= 0 ? '+' : ''}{formatPercent(crypto.changePercent24h)}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Financial Markets</h1>
        <SearchBar />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="stocks" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="stocks">Indian Stocks</TabsTrigger>
              <TabsTrigger value="cryptos">Cryptocurrencies</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stocks">
              {loading ? renderSkeleton() : renderStockList()}
            </TabsContent>
            
            <TabsContent value="cryptos">
              {loading ? renderSkeleton() : renderCryptoList()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketList; 