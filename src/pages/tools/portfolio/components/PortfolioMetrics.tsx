import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, LineChart } from '@/components/ui/charts';
import { Portfolio } from '@/types/portfolio';
import { mockPerformanceData } from '../data/mockData';
import { Info, TrendingUp, TrendingDown, AlertTriangle, BarChart2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GeminiAnalysis } from '@/services/portfolio-service';

interface PortfolioMetricsProps {
  portfolioData: Portfolio;
  analysisData: GeminiAnalysis | null;
}

export default function PortfolioMetrics({ portfolioData, analysisData }: PortfolioMetricsProps) {
  // Mock risk metrics for now
  const riskMetrics = [
    { name: 'Beta', value: 1.1, description: 'Measures volatility relative to the market (>1 means more volatile than market)', status: 'medium' },
    { name: 'Alpha', value: 3.5, description: 'Excess return compared to benchmark (%)', status: 'good' },
    { name: 'Sharpe Ratio', value: 1.8, description: 'Risk-adjusted return (higher is better)', status: 'good' },
    { name: 'Volatility', value: 15.2, description: 'Standard deviation of returns (%)', status: 'medium' },
    { name: 'Max Drawdown', value: -12.5, description: 'Largest drop from peak to trough (%)', status: 'medium' },
    { name: 'CAGR', value: 12.5, description: 'Compound Annual Growth Rate (%)', status: 'good' }
  ];

  // Mock monthly returns data
  const monthlyReturnsData = [
    { month: 'Jan', return: 2.3 },
    { month: 'Feb', return: 1.8 },
    { month: 'Mar', return: -0.7 },
    { month: 'Apr', return: 3.2 },
    { month: 'May', return: 1.5 },
    { month: 'Jun', return: 4.1 },
    { month: 'Jul', return: 2.9 },
    { month: 'Aug', return: -1.2 },
    { month: 'Sep', return: 0.8 },
    { month: 'Oct', return: 2.1 },
    { month: 'Nov', return: 3.5 },
    { month: 'Dec', return: 1.9 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'bad':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Risk & Return Metrics
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 ml-2 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Key metrics to understand your portfolio's risk and return characteristics</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Understand how your portfolio performs against risk factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {riskMetrics.map((metric, index) => (
              <div key={index} className="p-4 border rounded-lg dark:border-slate-700">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium">{metric.name}</div>
                  <Badge variant="outline" className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {metric.value > 0 && metric.name !== 'Max Drawdown' ? '+' : ''}
                  {metric.value}
                  {metric.name === 'Beta' ? '' : '%'}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {metric.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Returns */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Returns (%)</CardTitle>
          <CardDescription>Performance breakdown by month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <BarChart
              data={monthlyReturnsData}
              bars={[{ dataKey: "return", fill: "#0ea5e9", name: "Monthly Return" }]}
              xAxisDataKey="month"
            />
          </div>
        </CardContent>
      </Card>

      {/* Return Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Return Distribution</CardTitle>
          <CardDescription>Frequency of different return ranges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Return ranges */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { range: '< -5%', count: 2, color: 'bg-red-500' },
                { range: '-5% to 0%', count: 4, color: 'bg-red-300' },
                { range: '0% to 5%', count: 15, color: 'bg-green-300' },
                { range: '5% to 10%', count: 8, color: 'bg-green-500' },
                { range: '> 10%', count: 3, color: 'bg-green-700' }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-full h-32 flex items-end">
                    <div 
                      className={`w-full ${item.color} rounded-t-sm`} 
                      style={{ height: `${(item.count / 15) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs mt-1 text-center">{item.range}</div>
                  <div className="text-xs text-slate-500">{item.count} days</div>
                </div>
              ))}
            </div>
            
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
              Distribution of daily returns over the past year
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison to Benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle>Benchmark Comparison</CardTitle>
          <CardDescription>Performance relative to market indices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Your Portfolio', return: 25.0, color: 'bg-fin-primary' },
              { name: 'NIFTY 50', return: 18.5, color: 'bg-slate-500' },
              { name: 'SENSEX', return: 19.2, color: 'bg-slate-700' }
            ].map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span className={item.name === 'Your Portfolio' ? 'font-medium text-fin-primary' : ''}>
                    {item.return > 0 ? '+' : ''}{item.return}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color}`} 
                    style={{ width: `${(item.return / 30) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
              1-year return comparison
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
