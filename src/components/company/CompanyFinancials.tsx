/**
 * CompanyFinancials Component - UPDATED FOR INDIAN API
 * Displays financial metrics and charts using data from companyData prop
 */

import { CompanyData } from "@/pages/CompanyAnalysis";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/hooks/use-theme";
import { useState, useEffect } from "react";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface CompanyFinancialsProps {
  companyData: CompanyData;
  currencySymbol: string;
}

function formatLargeNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return 'N/A';
  
  const absNum = Math.abs(num);
  if (absNum >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (absNum >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (absNum >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (absNum >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toFixed(2);
}

export default function CompanyFinancials({ companyData, currencySymbol }: CompanyFinancialsProps) {
  const { theme } = useTheme();
  const [chartTheme, setChartTheme] = useState({
    textColor: '#64748b',
    gridColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    primaryColor: '#6366f1',
    secondaryColor: '#14b8a6',
    tertiaryColor: '#f59e0b'
  });

  // Update chart theme based on app theme
  useEffect(() => {
    if (theme === 'dark') {
      setChartTheme({
        textColor: '#94a3b8',
        gridColor: '#334155',
        backgroundColor: '#0f172a',
        primaryColor: '#818cf8',
        secondaryColor: '#2dd4bf',
        tertiaryColor: '#fbbf24'
      });
    } else {
      setChartTheme({
        textColor: '#64748b',
        gridColor: '#e2e8f0',
        backgroundColor: '#ffffff',
        primaryColor: '#6366f1',
        secondaryColor: '#14b8a6',
        tertiaryColor: '#f59e0b'
      });
    }
  }, [theme]);

  // Key financial metrics
  const metrics = [
    {
      name: "Market Cap",
      value: `${currencySymbol}${formatLargeNumber(companyData?.marketCap)}`,
      description: "Total market value"
    },
    {
      name: "P/E Ratio",
      value: companyData?.peRatio?.toFixed(2) || 'N/A',
      description: "Price to Earnings"
    },
    {
      name: "EPS",
      value: `${currencySymbol}${companyData?.eps?.toFixed(2) || 'N/A'}`,
      description: "Earnings Per Share"
    },
    {
      name: "ROE",
      value: `${companyData?.roe?.toFixed(2) || 'N/A'}%`,
      description: "Return on Equity"
    },
    {
      name: "Debt/Equity",
      value: companyData?.debtToEquity?.toFixed(2) || 'N/A',
      description: "Debt to Equity Ratio"
    },
    {
      name: "Dividend Yield",
      value: `${companyData?.dividendYield?.toFixed(2) || 'N/A'}%`,
      description: "Annual dividend yield"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">{metric.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Charts Tabs */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="profit">Profit</TabsTrigger>
          <TabsTrigger value="eps">EPS</TabsTrigger>
          <TabsTrigger value="ratios">Ratios</TabsTrigger>
        </TabsList>

        {/* Revenue Chart */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Yearly revenue performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={companyData?.yearlyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                  <XAxis dataKey="year" stroke={chartTheme.textColor} />
                  <YAxis stroke={chartTheme.textColor} tickFormatter={(value) => formatLargeNumber(value)} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: chartTheme.backgroundColor, border: `1px solid ${chartTheme.gridColor}` }}
                    formatter={(value: any) => [`${currencySymbol}${formatLargeNumber(value)}`, 'Revenue']}
                  />
                  <Bar dataKey="value" fill={chartTheme.primaryColor} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit Chart */}
        <TabsContent value="profit">
          <Card>
            <CardHeader>
              <CardTitle>Profit Trend</CardTitle>
              <CardDescription>Yearly profit performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={companyData?.yearlyProfit || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                  <XAxis dataKey="year" stroke={chartTheme.textColor} />
                  <YAxis stroke={chartTheme.textColor} tickFormatter={(value) => formatLargeNumber(value)} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: chartTheme.backgroundColor, border: `1px solid ${chartTheme.gridColor}` }}
                    formatter={(value: any) => [`${currencySymbol}${formatLargeNumber(value)}`, 'Profit']}
                  />
                  <Bar dataKey="value" fill={chartTheme.secondaryColor} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EPS Chart */}
        <TabsContent value="eps">
          <Card>
            <CardHeader>
              <CardTitle>EPS Trend</CardTitle>
              <CardDescription>Earnings per share over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={companyData?.yearlyEps || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                  <XAxis dataKey="year" stroke={chartTheme.textColor} />
                  <YAxis stroke={chartTheme.textColor} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: chartTheme.backgroundColor, border: `1px solid ${chartTheme.gridColor}` }}
                    formatter={(value: any) => [`${currencySymbol}${value.toFixed(2)}`, 'EPS']}
                  />
                  <Line type="monotone" dataKey="value" stroke={chartTheme.primaryColor} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ratios Chart */}
        <TabsContent value="ratios">
          <Card>
            <CardHeader>
              <CardTitle>Financial Ratios</CardTitle>
              <CardDescription>Key financial ratios over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={companyData?.yearlyRoe || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                  <XAxis dataKey="year" stroke={chartTheme.textColor} />
                  <YAxis stroke={chartTheme.textColor} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: chartTheme.backgroundColor, border: `1px solid ${chartTheme.gridColor}` }}
                    formatter={(value: any) => [`${value.toFixed(2)}%`, 'ROE']}
                  />
                  <Line type="monotone" dataKey="value" stroke={chartTheme.tertiaryColor} strokeWidth={2} name="ROE" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Financial Info */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Growth Metrics</h4>
              <p className="text-sm text-muted-foreground">
                Revenue Growth: <span className="font-medium">{companyData?.revenueGrowth?.toFixed(2)}%</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Profit Margin: <span className="font-medium">{companyData?.profitMargin?.toFixed(2)}%</span>
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Valuation</h4>
              <p className="text-sm text-muted-foreground">
                Status: <span className={`font-medium ${
                  companyData?.valuation === 'Undervalued' ? 'text-green-600' :
                  companyData?.valuation === 'Overvalued' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>{companyData?.valuation}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Market Share: <span className="font-medium">{companyData?.marketShare?.toFixed(1)}%</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
