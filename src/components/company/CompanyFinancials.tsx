import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { CompanyData } from "@/pages/CompanyAnalysis";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/hooks/use-theme";
import { useState, useEffect } from "react";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { getCompanyFinancials, getCompanyBalanceSheet, getCompanyIncomeStatement, getCompanyCashFlow } from "@/lib/eodhd-service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface CompanyFinancialsProps {
  companyData: CompanyData;
  currencySymbol: string;
}

function formatLargeNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return 'N/A';
  
  if (num >= 1e12) {
    return `${(num / 1e12).toFixed(2)}T`;
  } else if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  } else {
    return num.toLocaleString();
  }
}

export default function CompanyFinancials({ companyData, currencySymbol }: CompanyFinancialsProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialsData, setFinancialsData] = useState<any>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<any>(null);
  const [incomeStatementData, setIncomeStatementData] = useState<any>(null);
  const [cashFlowData, setCashFlowData] = useState<any>(null);
  
  const [chartTheme, setChartTheme] = useState({
    textColor: '#64748b', // slate-500
    gridColor: '#e2e8f0', // slate-200
    backgroundColor: '#ffffff',
    primaryColor: '#6366f1', // indigo-500
    secondaryColor: '#14b8a6', // teal-500
    tertiaryColor: '#f59e0b' // amber-500
  });
  
  // Fetch financial data from EODHD API
  useEffect(() => {
    if (!companyData?.ticker) return;
    
    const fetchFinancialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch all financial data in parallel
        const [financials, balanceSheet, incomeStatement, cashFlow] = await Promise.all([
          getCompanyFinancials(companyData.ticker),
          getCompanyBalanceSheet(companyData.ticker),
          getCompanyIncomeStatement(companyData.ticker),
          getCompanyCashFlow(companyData.ticker)
        ]);
        
        setFinancialsData(financials);
        setBalanceSheetData(balanceSheet);
        setIncomeStatementData(incomeStatement);
        setCashFlowData(cashFlow);
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError('Failed to load financial data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFinancialData();
  }, [companyData?.ticker]);
  
  // Function to handle refresh of financial data
  const handleRefresh = async () => {
    if (!companyData?.ticker) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all financial data in parallel
      const [financials, balanceSheet, incomeStatement, cashFlow] = await Promise.all([
        getCompanyFinancials(companyData.ticker),
        getCompanyBalanceSheet(companyData.ticker),
        getCompanyIncomeStatement(companyData.ticker),
        getCompanyCashFlow(companyData.ticker)
      ]);
      
      setFinancialsData(financials);
      setBalanceSheetData(balanceSheet);
      setIncomeStatementData(incomeStatement);
      setCashFlowData(cashFlow);
    } catch (err) {
      console.error('Error fetching financial data:', err);
      setError('Failed to load financial data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Update chart colors based on theme
  useEffect(() => {
    if (theme === 'dark') {
      setChartTheme({
        textColor: '#94a3b8', // slate-400
        gridColor: '#334155', // slate-700
        backgroundColor: '#020617', // slate-950
        primaryColor: '#818cf8', // indigo-400
        secondaryColor: '#2dd4bf', // teal-400
        tertiaryColor: '#fbbf24' // amber-400
      });
    } else {
      setChartTheme({
        textColor: '#64748b', // slate-500
        gridColor: '#e2e8f0', // slate-200
        backgroundColor: '#ffffff',
        primaryColor: '#6366f1', // indigo-500
        secondaryColor: '#14b8a6', // teal-500
        tertiaryColor: '#f59e0b' // amber-500
      });
    }
  }, [theme]);
  
  // Get financial metrics from EODHD API if available, otherwise use the original data
  const getMetricValue = (key: string, defaultValue: any) => {
    if (financialsData && financialsData.Highlights) {
      const highlights = financialsData.Highlights;
      switch (key) {
        case 'marketCap':
          return highlights.MarketCapitalization || defaultValue;
        case 'peRatio':
          return highlights.PERatio || defaultValue;
        case 'eps':
          return highlights.EPS || defaultValue;
        case 'beta':
          return highlights.Beta || defaultValue;
        case 'dividendYield':
          return highlights.DividendYield ? highlights.DividendYield * 100 : defaultValue; // Convert to percentage
        case 'roe':
          return highlights.ROE || defaultValue;
        case 'profitMargin':
          return highlights.ProfitMargin ? highlights.ProfitMargin * 100 : defaultValue; // Convert to percentage
        default:
          return defaultValue;
      }
    }
    return defaultValue;
  };

  // Use EODHD data if available, otherwise fall back to original data
  const metrics = [
    {
      name: "Market Cap",
      value: `${currencySymbol}${formatLargeNumber(getMetricValue('marketCap', companyData.marketCap))}`,
      tooltip: "The total value of all of a company's shares of stock. It's calculated by multiplying the price of a single share by the total number of outstanding shares."
    },
    {
      name: "P/E Ratio",
      value: (() => {
        const peRatio = getMetricValue('peRatio', companyData.peRatio);
        return peRatio !== null && peRatio !== undefined ? Number(peRatio).toFixed(2) : 'N/A';
      })(),
      tooltip: "Price-to-Earnings Ratio. A valuation ratio of a company's current share price compared to its per-share earnings. A high P/E suggests that investors are expecting higher earnings growth in the future."
    },
    {
      name: "EPS",
      value: (() => {
        const eps = getMetricValue('eps', companyData.eps);
        return eps !== null && eps !== undefined ? `${currencySymbol}${Number(eps).toFixed(2)}` : 'N/A';
      })(),
      tooltip: "Earnings Per Share. The portion of a company's profit allocated to each outstanding share of common stock. It's an indicator of a company's profitability."
    },
    {
      name: "Beta",
      value: (() => {
        const beta = getMetricValue('beta', companyData.beta);
        return beta !== null && beta !== undefined ? Number(beta).toFixed(2) : 'N/A';
      })(),
      tooltip: "A measure of a stock's volatility in relation to the overall market. A beta greater than 1 indicates the stock is more volatile than the market, while a beta less than 1 indicates it's less volatile."
    },
    {
      name: "Dividend Yield",
      value: (() => {
        const dividendYield = getMetricValue('dividendYield', companyData.dividendYield);
        return dividendYield !== null && dividendYield !== undefined ? `${Number(dividendYield).toFixed(2)}%` : 'N/A';
      })(),
      tooltip: "The annual dividend payment divided by the stock price, expressed as a percentage. It's a way to measure the cash flow you're getting for each dollar invested in a stock."
    },
    {
      name: "ROE",
      value: (() => {
        const roe = getMetricValue('roe', companyData.roe);
        return roe !== null && roe !== undefined ? `${(roe * 100).toFixed(2)}%` : 'N/A';
      })(),
      tooltip: "Return on Equity. A measure of financial performance calculated by dividing net income by shareholders' equity. It measures a corporation's profitability by revealing how much profit a company generates with the money shareholders have invested."
    },
    {
      name: "Profit Margin",
      value: (() => {
        const profitMargin = getMetricValue('profitMargin', companyData.profitMargin);
        return profitMargin !== null && profitMargin !== undefined ? `${Number(profitMargin).toFixed(2)}%` : 'N/A';
      })(),
      tooltip: "The percentage of revenue that exceeds costs. It's a good indicator of how efficiently a company is managing its costs."
    },
    {
      name: "Revenue Growth",
      value: companyData.revenueGrowth !== null && companyData.revenueGrowth !== undefined ? `${Number(companyData.revenueGrowth).toFixed(2)}%` : 'N/A',
      tooltip: "The year-over-year percentage increase in a company's revenue."
    },
    {
      name: "ROCE",
      value: companyData.roce !== null && companyData.roce !== undefined ? `${Number(companyData.roce).toFixed(2)}%` : 'N/A',
      tooltip: "Return on Capital Employed shows a company's efficiency and profitability of its capital investments."
    },
    {
      name: "Debt/Equity",
      value: companyData.debtToEquity !== null && companyData.debtToEquity !== undefined ? `${Number(companyData.debtToEquity).toFixed(2)}` : 'N/A',
      tooltip: "The Debt-to-Equity ratio indicates the relative proportion of shareholder's equity and debt used to finance a company's assets."
    }
  ];

  // Prepare data for charts
  const prepareChartData = () => {
    if (!companyData.yearlyRevenue || !companyData.yearlyRevenue.length) {
      return [];
    }
    
    return companyData.yearlyRevenue.map((item, index) => ({
      year: item.year,
      revenue: item.value,
      profit: companyData.yearlyProfit?.[index]?.value || 0,
      eps: companyData.yearlyEps?.[index]?.value || 0,
      roe: companyData.yearlyRoe?.[index]?.value || 0,
      roce: companyData.yearlyRoce?.[index]?.value || 0,
      debtToEquity: companyData.yearlyDebtToEquity?.[index]?.value || 0,
      dividendYield: companyData.yearlyDividendYield?.[index]?.value || 0
    }));
  };
  
  const chartData = prepareChartData();
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-2 shadow-lg rounded-md border border-slate-200 dark:border-slate-700">
          <p className="font-medium">{`Year: ${label}`}</p>
          <ul className="list-disc pl-6">
            {payload.map((entry: any, index: number) => (
              <li key={index} className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">{entry.name || 'Metric'}</span>
                <span className="font-medium">
                  {`${entry.name || 'Value'}: ${entry.value !== undefined && entry.name && (entry.name.includes('Revenue') || entry.name.includes('Profit'))
                    ? currencySymbol + formatLargeNumber(entry.value)
                    : (entry.value !== undefined ? entry.value.toFixed(2) : '0.00') + (entry.name && (entry.name.includes('Yield') || entry.name.includes('ROE') || entry.name.includes('ROCE')) ? '%' : '')}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Key Financial Metrics</CardTitle>
          <CardDescription>Important financial indicators for {companyData.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {metrics.map((metric, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.name}</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{metric.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{metric.value}</div>
              </div>
            ))}  
          </div>
        </CardContent>
        
        <CardContent className="pt-6">
          <Tabs defaultValue="revenue">
          <TabsContent value="revenue" className="mt-0">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                  <XAxis dataKey="year" stroke={chartTheme.textColor} />
                  <YAxis stroke={chartTheme.textColor} tickFormatter={(value) => currencySymbol + formatLargeNumber(value)} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar name="Revenue" dataKey="revenue" fill={chartTheme.primaryColor} />
                  <Bar name="Profit" dataKey="profit" fill={chartTheme.secondaryColor} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                Annual Revenue and Profit Growth
              </p>
            </div>
          </TabsContent>
            
          
          <TabsContent value="eps" className="mt-0">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                  <XAxis dataKey="year" stroke={chartTheme.textColor} />
                  <YAxis stroke={chartTheme.textColor} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    name="EPS"
                    type="monotone"
                    dataKey="eps"
                    stroke={chartTheme.primaryColor}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                Earnings Per Share (EPS) Trend
              </p>
              <div className="mt-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2">What is EPS?</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Earnings per share (EPS) is the portion of a company's profit allocated to each outstanding share of common stock. It serves as an indicator of a company's profitability. A higher EPS indicates greater value because investors will pay more for a company's shares if they think the company has higher profits relative to its share price.
                </p>
              </div>
            </div>
          </TabsContent>
            
          <TabsContent value="revenue" className="mt-0">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                    <XAxis dataKey="year" stroke={chartTheme.textColor} />
                    <YAxis stroke={chartTheme.textColor} tickFormatter={(value) => currencySymbol + formatLargeNumber(value)} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar name="Revenue" dataKey="revenue" fill={chartTheme.primaryColor} />
                    <Bar name="Profit" dataKey="profit" fill={chartTheme.secondaryColor} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                  Annual Revenue and Profit Growth
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="eps" className="mt-0">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                    <XAxis dataKey="year" stroke={chartTheme.textColor} />
                    <YAxis stroke={chartTheme.textColor} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      name="EPS"
                      type="monotone"
                      dataKey="eps"
                      stroke={chartTheme.primaryColor}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                  Earnings Per Share (EPS) Trend
                </p>
                <div className="mt-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                  <h4 className="text-sm font-medium mb-2">What is EPS?</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Earnings per share (EPS) is the portion of a company's profit allocated to each outstanding share of common stock. It serves as an indicator of a company's profitability. A higher EPS indicates greater value because investors will pay more for a company's shares if they think the company has higher profits relative to its share price.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="roe" className="mt-0">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                    <XAxis dataKey="year" stroke={chartTheme.textColor} />
                    <YAxis stroke={chartTheme.textColor} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      name="ROE (%)"
                      type="monotone"
                      dataKey="roe"
                      stroke={chartTheme.secondaryColor}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                  Return on Equity (ROE) Trend
                </p>
                <div className="mt-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                  <h4 className="text-sm font-medium mb-2">What is ROE?</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Return on Equity (ROE) measures a corporation's profitability by revealing how much profit a company generates with the money shareholders have invested. A higher ROE indicates more efficient use of equity capital.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="roce" className="mt-0">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                    <XAxis dataKey="year" stroke={chartTheme.textColor} />
                    <YAxis stroke={chartTheme.textColor} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      name="ROCE (%)"
                      type="monotone"
                      dataKey="roce"
                      stroke={chartTheme.tertiaryColor}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                  Return on Capital Employed (ROCE) Trend
                </p>
                <div className="mt-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                  <h4 className="text-sm font-medium mb-2">What is ROCE?</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Return on Capital Employed (ROCE) is a financial ratio that measures a company's profitability and the efficiency with which its capital is used. It is calculated as EBIT divided by capital employed. A higher ROCE indicates more efficient use of capital.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="debt" className="mt-0">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                    <XAxis dataKey="year" stroke={chartTheme.textColor} />
                    <YAxis stroke={chartTheme.textColor} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      name="Debt/Equity Ratio"
                      type="monotone"
                      dataKey="debtToEquity"
                      stroke={chartTheme.primaryColor}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                  Debt to Equity Ratio Trend
                </p>
                <div className="mt-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                  <h4 className="text-sm font-medium mb-2">What is Debt/Equity Ratio?</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    The Debt-to-Equity (D/E) ratio is calculated by dividing a company's total liabilities by its shareholder equity. It indicates the proportion of equity and debt used to finance a company's assets. A lower D/E ratio usually implies a more financially stable business.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="dividend" className="mt-0">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridColor} />
                    <XAxis dataKey="year" stroke={chartTheme.textColor} />
                    <YAxis stroke={chartTheme.textColor} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      name="Dividend Yield (%)"
                      type="monotone"
                      dataKey="dividendYield"
                      stroke={chartTheme.secondaryColor}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                  Dividend Yield Trend
                </p>
                <div className="mt-4 bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                  <h4 className="text-sm font-medium mb-2">What is Dividend Yield?</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Dividend Yield is a financial ratio that shows how much a company pays out in dividends each year relative to its stock price. It is calculated by dividing the annual dividend per share by the stock price per share and is typically expressed as a percentage.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
