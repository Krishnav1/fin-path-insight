import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Star, StarOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '@/services/userPreferencesService';

// Define types for better type safety
interface StockData {
  symbol: string;
  companyName: string;
  lastPrice: number;
  change: number;
  pChange: number;
  marketCap: number;
  sector: string;
}

interface SectorViewProps {
  stocks: StockData[];
  onWatchlistChange?: () => void;
}

const SectorView: React.FC<SectorViewProps> = ({ stocks, onWatchlistChange }) => {
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
  const [sectors, setSectors] = useState<Record<string, StockData[]>>({});
  const [watchlistStatus, setWatchlistStatus] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  // Group stocks by sector
  useEffect(() => {
    if (!stocks || stocks.length === 0) return;

    const groupedBySector: Record<string, StockData[]> = {};
    const watchlist: Record<string, boolean> = {};
    
    // Group by sector
    stocks.forEach(stock => {
      const sector = stock.sector || 'Unknown';
      
      if (!groupedBySector[sector]) {
        groupedBySector[sector] = [];
      }
      
      groupedBySector[sector].push(stock);
      
      // Check if in watchlist
      watchlist[stock.symbol] = isInWatchlist(stock.symbol);
    });
    
    // Sort sectors by market cap
    Object.keys(groupedBySector).forEach(sector => {
      groupedBySector[sector].sort((a, b) => b.marketCap - a.marketCap);
    });
    
    setSectors(groupedBySector);
    setWatchlistStatus(watchlist);
    
    // Expand the sector with the highest total market cap by default
    const sectorsByMarketCap = Object.entries(groupedBySector)
      .map(([sector, stocks]) => ({
        sector,
        totalMarketCap: stocks.reduce((sum, stock) => sum + stock.marketCap, 0)
      }))
      .sort((a, b) => b.totalMarketCap - a.totalMarketCap);
      
    if (sectorsByMarketCap.length > 0) {
      setExpandedSector(sectorsByMarketCap[0].sector);
    }
  }, [stocks]);

  // Handle sector click to expand/collapse
  const handleSectorClick = (sector: string) => {
    setExpandedSector(prev => prev === sector ? null : sector);
  };

  // Handle stock click to navigate to company analysis
  const handleStockClick = (symbol: string) => {
    navigate(`/company-analysis/${symbol}`);
  };

  // Handle watchlist toggle
  const handleWatchlistToggle = (symbol: string, sector: string) => {
    const isCurrentlyInWatchlist = watchlistStatus[symbol];
    
    if (isCurrentlyInWatchlist) {
      removeFromWatchlist(symbol);
    } else {
      addToWatchlist(symbol, sector);
    }
    
    // Update local state
    setWatchlistStatus(prev => ({
      ...prev,
      [symbol]: !isCurrentlyInWatchlist
    }));
    
    // Notify parent if needed
    if (onWatchlistChange) {
      onWatchlistChange();
    }
  };

  // Calculate sector statistics
  const getSectorStats = (sectorStocks: StockData[]) => {
    const totalMarketCap = sectorStocks.reduce((sum, stock) => sum + stock.marketCap, 0);
    
    let averageChange = 0;
    if (sectorStocks.length > 0) {
      averageChange = sectorStocks.reduce((sum, stock) => sum + stock.pChange, 0) / sectorStocks.length;
    }
    
    return {
      totalMarketCap,
      averageChange,
      stockCount: sectorStocks.length
    };
  };

  // Format market cap in crores
  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 100000) {
      return `${(marketCap / 100000).toFixed(2)} Lakh Cr`;
    }
    return `${Math.round(marketCap).toLocaleString('en-IN')} Cr`;
  };

  return (
    <Card className="bg-white dark:bg-slate-800">
      <CardHeader>
        <CardTitle>Sector Breakdown</CardTitle>
        <CardDescription>Discover stocks by sector</CardDescription>
      </CardHeader>
      <CardContent>
        {Object.keys(sectors).length === 0 ? (
          <div className="py-4 text-center text-slate-500">No sector data available</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(sectors)
              .sort(([, stocksA], [, stocksB]) => {
                const totalMarketCapA = stocksA.reduce((sum, stock) => sum + stock.marketCap, 0);
                const totalMarketCapB = stocksB.reduce((sum, stock) => sum + stock.marketCap, 0);
                return totalMarketCapB - totalMarketCapA;
              })
              .map(([sector, sectorStocks]) => {
                const stats = getSectorStats(sectorStocks);
                const isExpanded = expandedSector === sector;
                
                return (
                  <div key={sector} className="border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden">
                    {/* Sector Header */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      onClick={() => handleSectorClick(sector)}
                    >
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-slate-50">
                          {sector}
                        </h3>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {stats.stockCount} stocks · {formatMarketCap(stats.totalMarketCap)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-medium ${stats.averageChange >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                          {stats.averageChange >= 0 ? '+' : ''}{stats.averageChange.toFixed(2)}%
                        </span>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                    
                    {/* Expanded Section with Stocks */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-slate-700">
                        <table className="w-full">
                          <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Company</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Price (₹)</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Change</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Market Cap</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {sectorStocks.map((stock, index) => (
                              <tr 
                                key={index} 
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/20"
                              >
                                <td 
                                  className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-50 cursor-pointer"
                                  onClick={() => handleStockClick(stock.symbol)}
                                >
                                  {stock.symbol}
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {stock.companyName !== stock.symbol ? stock.companyName : ''}
                                  </div>
                                </td>
                                <td 
                                  className="px-4 py-2 text-sm text-right text-slate-900 dark:text-slate-50 cursor-pointer"
                                  onClick={() => handleStockClick(stock.symbol)}
                                >
                                  {stock.lastPrice.toLocaleString('en-IN')}
                                </td>
                                <td 
                                  className={`px-4 py-2 text-sm text-right cursor-pointer ${stock.change >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}
                                  onClick={() => handleStockClick(stock.symbol)}
                                >
                                  {stock.change.toFixed(2)} ({stock.pChange.toFixed(2)}%)
                                </td>
                                <td 
                                  className="px-4 py-2 text-sm text-right text-slate-500 dark:text-slate-400 cursor-pointer"
                                  onClick={() => handleStockClick(stock.symbol)}
                                >
                                  {formatMarketCap(stock.marketCap)}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleWatchlistToggle(stock.symbol, stock.sector)}
                                    title={watchlistStatus[stock.symbol] ? "Remove from watchlist" : "Add to watchlist"}
                                  >
                                    {watchlistStatus[stock.symbol] ? (
                                      <Star className="h-4 w-4 text-yellow-500" />
                                    ) : (
                                      <StarOff className="h-4 w-4 text-slate-400 hover:text-yellow-500" />
                                    )}
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SectorView;
