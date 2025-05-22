import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart } from '@/components/ui/charts';
import { Portfolio } from '@/types/portfolio';
import { mockPortfolioMetrics } from '../data/mockData';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GeminiAnalysis } from '@/services/portfolio-service';

interface PortfolioAllocationProps {
  portfolioData: Portfolio;
  analysisData: GeminiAnalysis | null;
}

export default function PortfolioAllocation({ portfolioData, analysisData }: PortfolioAllocationProps) {
  const { holdings } = portfolioData;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Calculate sector allocation
  const sectorAllocation = Object.entries(
    holdings.reduce((acc, holding) => {
      const sector = holding.sector || 'Other';
      if (!acc[sector]) {
        acc[sector] = 0;
      }
      acc[sector] += (holding.value || 0);
      return acc;
    }, {} as Record<string, number>)
  ).map(([sector, value]) => ({
    name: sector,
    value: Number(((value / (portfolioData.totalValue || 1)) * 100).toFixed(1))
  }));
  
  // Sector colors
  const sectorColors = [
    '#0ea5e9', // fin-primary
    '#14b8a6', // fin-teal
    '#f59e0b', // amber
    '#6366f1', // indigo
    '#f43f5e', // rose
    '#8b5cf6', // violet
    '#10b981', // emerald
    '#ef4444', // red
    '#3b82f6', // blue
    '#a3a3a3', // gray
  ];
  
  // Stock allocation (top 10)
  const stockAllocation = holdings
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 10)
    .map(holding => ({
      name: holding.symbol,
      value: Number((((holding.value || 0) / (portfolioData.totalValue || 1)) * 100).toFixed(1))
    }));
  
  // Benchmark sector allocation (for comparison)
  const benchmarkAllocation = [
    { sector: 'Financial Services', benchmark: 28, actual: sectorAllocation.find(s => s.name === 'Financial Services')?.value || 0 },
    { sector: 'Technology', benchmark: 18, actual: sectorAllocation.find(s => s.name === 'Technology')?.value || 0 },
    { sector: 'Energy', benchmark: 12, actual: sectorAllocation.find(s => s.name === 'Energy')?.value || 0 },
    { sector: 'Healthcare', benchmark: 15, actual: sectorAllocation.find(s => s.name === 'Healthcare')?.value || 0 },
    { sector: 'Consumer Goods', benchmark: 10, actual: sectorAllocation.find(s => s.name === 'Consumer Goods')?.value || 0 },
    { sector: 'Others', benchmark: 17, actual: sectorAllocation.find(s => s.name === 'Others')?.value || 0 }
  ];
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="sector">
        <TabsList className="mb-6">
          <TabsTrigger value="sector">Sector Allocation</TabsTrigger>
          <TabsTrigger value="stock">Stock Allocation</TabsTrigger>
          <TabsTrigger value="comparison">Benchmark Comparison</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sector">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sector Allocation Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sector Allocation</CardTitle>
                <CardDescription>Distribution of your portfolio across sectors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <PieChart
                    data={sectorAllocation}
                    dataKey="value"
                    nameKey="name"
                    colors={sectorColors}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Sector Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Sector Breakdown</CardTitle>
                <CardDescription>Detailed view of sector allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sectorAllocation
                    .sort((a, b) => b.value - a.value)
                    .map((sector, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: sectorColors[index % sectorColors.length] }}
                          ></div>
                          <span>{sector.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{sector.value || 0}%</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            {formatCurrency((sector.value / 100) * (portfolioData.totalValue || 0))}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                
                {sectorAllocation.find(s => s.name === 'Technology' && s.value > 20) && (
                  <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2 dark:bg-amber-950 dark:border-amber-900">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">High Sector Concentration</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">Your portfolio has a high concentration in Technology. Consider diversifying to reduce sector-specific risk.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="stock">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Allocation Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Allocation</CardTitle>
                <CardDescription>Top 10 holdings by value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <PieChart
                    data={stockAllocation}
                    dataKey="value"
                    nameKey="name"
                    colors={sectorColors}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Stock Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Holdings Breakdown</CardTitle>
                <CardDescription>Detailed view of your top holdings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {holdings
                    .sort((a, b) => (b.value || 0) - (a.value || 0))
                    .slice(0, 10)
                    .map((holding, index) => {
                      const allocationPercentage = ((holding.value || 0) / (portfolioData.totalValue || 1)) * 100;
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: sectorColors[index % sectorColors.length] }}
                            ></div>
                            <div>
                              <div>{holding.symbol}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{holding.sector}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{allocationPercentage?.toFixed(1) || '0.0'}%</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {formatCurrency(holding.value || 0)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                {holdings.some(h => ((h.value || 0) / (portfolioData.totalValue || 1)) * 100 > 15) && (
                  <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2 dark:bg-amber-950 dark:border-amber-900">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">High Stock Concentration</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">Some individual stocks represent over 15% of your portfolio. Consider rebalancing to reduce single-stock risk.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Benchmark Comparison
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-2 text-slate-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Comparison with market index sector weights</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>How your allocation compares to market indices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {benchmarkAllocation.map((item, index) => {
                  const difference = item.actual - item.benchmark;
                  const isOverweight = difference > 5;
                  const isUnderweight = difference < -5;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: sectorColors[index % sectorColors.length] }}
                          ></div>
                          <span>{item.sector}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverweight && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                              Overweight
                            </Badge>
                          )}
                          {isUnderweight && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              Underweight
                            </Badge>
                          )}
                          <span className={`text-sm ${difference > 0 ? 'text-amber-600 dark:text-amber-400' : difference < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {difference > 0 ? '+' : ''}{difference.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex h-2 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                        <div 
                          className="h-full bg-slate-300 dark:bg-slate-600" 
                          style={{ width: `${item.benchmark}%` }}
                        ></div>
                        <div 
                          className={`h-full ${difference > 0 ? 'bg-amber-500' : 'bg-blue-500'}`} 
                          style={{ width: `${Math.abs(difference)}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Your allocation: {item.actual}%</span>
                        <span>Benchmark: {item.benchmark}%</span>
                      </div>
                    </div>
                  );
                })}
                
                <div className="p-4 bg-slate-50 rounded-md dark:bg-slate-800">
                  <h4 className="font-medium mb-2">Diversification Analysis</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Your portfolio shows some deviation from benchmark allocations:
                  </p>
                  <ul className="text-sm space-y-2">
                    {benchmarkAllocation.some(item => item.actual - item.benchmark > 5) && (
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></div>
                        <span>Overweight in {benchmarkAllocation.filter(item => item.actual - item.benchmark > 5).map(item => item.sector).join(', ')}</span>
                      </li>
                    )}
                    {benchmarkAllocation.some(item => item.benchmark - item.actual > 5) && (
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                        <span>Underweight in {benchmarkAllocation.filter(item => item.benchmark - item.actual > 5).map(item => item.sector).join(', ')}</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1.5"></div>
                      <span>Consider rebalancing to align more closely with market weights for better diversification</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
