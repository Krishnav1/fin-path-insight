import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Portfolio } from '@/types/portfolio';
import { LineChart } from '@/components/ui/charts';
import { mockPerformanceData } from '../data/mockData';

interface PortfolioOverviewProps {
  portfolioData: Portfolio;
}

export default function PortfolioOverview({ portfolioData }: PortfolioOverviewProps) {
  const { totalValue, totalInvested, totalReturn, totalReturnPercentage } = portfolioData;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Portfolio Value */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Portfolio Value</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {formatCurrency(totalValue || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
              <DollarSign className="mr-1 h-4 w-4" />
              <span>Current market value</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Invested */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Invested</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {formatCurrency(totalInvested || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
              <Calendar className="mr-1 h-4 w-4" />
              <span>Cost basis</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Total Return (₹) */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Return (₹)</CardDescription>
            <CardTitle className="text-2xl font-bold">
              {formatCurrency(totalReturn || 0)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              {(totalReturn || 0) >= 0 ? (
                <>
                  <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                  <span className="text-green-500">Profit</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                  <span className="text-red-500">Loss</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Total Return (%) */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Return (%)</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center">
              {(totalReturnPercentage || 0) >= 0 ? (
                <>
                  <span className="text-green-500">+{totalReturnPercentage}%</span>
                  <ArrowUpRight className="ml-1 h-5 w-5 text-green-500" />
                </>
              ) : (
                <>
                  <span className="text-red-500">{totalReturnPercentage}%</span>
                  <ArrowDownRight className="ml-1 h-5 w-5 text-red-500" />
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
              <TrendingUp className="mr-1 h-4 w-4" />
              <span>Overall performance</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Portfolio Performance Chart */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Portfolio Performance</CardTitle>
          <CardDescription>Historical performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <LineChart 
              data={mockPerformanceData}
              lines={[{ dataKey: "value", stroke: "#0ea5e9", name: "Portfolio Value" }]}
              xAxisDataKey="date"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Stocks with highest returns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolioData.holdings
                .sort((a, b) => (b.profitPercentage || 0) - (a.profitPercentage || 0))
                .slice(0, 3)
                .map((holding, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{holding.symbol}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{holding.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-green-500">
                        <ArrowUpRight className="mr-1 h-4 w-4" />
                        <span>+{holding.profitPercentage?.toFixed(2)}%</span>
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {formatCurrency(holding.profit || 0)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Sector Allocation Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Sector Allocation</CardTitle>
            <CardDescription>Distribution across sectors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Group holdings by sector and calculate allocation */}
              {Object.entries(
                portfolioData.holdings.reduce((acc, holding) => {
                  const sector = holding.sector || 'Other';
                  if (!acc[sector]) {
                    acc[sector] = 0;
                  }
                  acc[sector] += (holding.value || 0);
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([sector, value], index) => {
                  const percentage = (value / (portfolioData.totalValue || 1)) * 100;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 bg-fin-${index % 5 === 0 ? 'primary' : index % 5 === 1 ? 'teal' : index % 5 === 2 ? 'amber' : index % 5 === 3 ? 'indigo' : 'rose'}`}></div>
                        <span>{sector}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{percentage.toFixed(1)}%</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {formatCurrency(value)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {Object.keys(
                portfolioData.holdings.reduce((acc, holding) => {
                  const sector = holding.sector || 'Other';
                  if (!acc[sector]) {
                    acc[sector] = 0;
                  }
                  acc[sector] += (holding.value || 0);
                  return acc;
                }, {} as Record<string, number>)
              ).length > 4 && (
                <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2">
                  + {Object.keys(
                    portfolioData.holdings.reduce((acc, holding) => {
                      const sector = holding.sector || 'Other';
                      if (!acc[sector]) {
                        acc[sector] = 0;
                      }
                      acc[sector] += (holding.value || 0);
                      return acc;
                    }, {} as Record<string, number>)
                  ).length - 4} more sectors
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
