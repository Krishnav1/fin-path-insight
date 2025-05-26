import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyData } from "@/pages/CompanyAnalysis";
import { Button } from "@/components/ui/button";
import { BarChart4, LineChart } from "lucide-react";
import { getHistoricalPrices } from "@/lib/api-service";
import { getEnhancedChartData } from "@/lib/chart-utils";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

// Register Chart.js components
Chart.register(...registerables);

interface CompanyChartsProps {
  companyData: CompanyData;
  currencySymbol: string;
}

type TimeFrame = "1D" | "1W" | "1M" | "6M" | "1Y" | "5Y" | "Max";

// Map timeframe to API parameters
const timeFrameMap = {
  "1D": { interval: "5m", range: "1d" },
  "1W": { interval: "30m", range: "5d" },
  "1M": { interval: "1h", range: "1m" },
  "6M": { interval: "1d", range: "6m" },
  "1Y": { interval: "1d", range: "1y" },
  "5Y": { interval: "1wk", range: "5y" },
  "Max": { interval: "1mo", range: "max" }
};

export default function CompanyCharts({ companyData, currencySymbol }: CompanyChartsProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1M");
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const timeFrames: TimeFrame[] = ["1D", "1W", "1M", "6M", "1Y", "5Y", "Max"];
  
  // Fetch chart data based on the selected timeframe
  useEffect(() => {
    async function fetchChartData() {
      if (!companyData?.ticker) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const symbol = companyData.ticker;
        const { interval, range } = timeFrameMap[timeFrame];
        
        // For recent data (1D, 1W), use intraday prices
        if (["1D", "1W"].includes(timeFrame)) {
          const data = await getEnhancedChartData(symbol, interval, range, ["sma20"]);
          setChartData(data);
        } else {
          // For longer timeframes, use historical EOD data
          const today = new Date();
          let fromDate = new Date();
          
          // Calculate from date based on timeframe
          switch (timeFrame) {
            case "1M": fromDate.setMonth(today.getMonth() - 1); break;
            case "6M": fromDate.setMonth(today.getMonth() - 6); break;
            case "1Y": fromDate.setFullYear(today.getFullYear() - 1); break;
            case "5Y": fromDate.setFullYear(today.getFullYear() - 5); break;
            case "Max": fromDate.setFullYear(today.getFullYear() - 20); break;
          }
          
          const fromDateStr = fromDate.toISOString().split('T')[0];
          const toDateStr = today.toISOString().split('T')[0];
          
          const historicalData = await getHistoricalPrices(symbol, fromDateStr, toDateStr);
          
          if (historicalData && Array.isArray(historicalData)) {
            const chartData = {
              labels: historicalData.map(item => new Date(item.date).toLocaleDateString()),
              datasets: [{
                label: 'Price',
                data: historicalData.map(item => item.close),
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.3,
                fill: true
              }]
            };
            setChartData(chartData);
          } else {
            setError("Failed to fetch historical data");
          }
        }
      } catch (err) {
        console.error("Error fetching chart data:", err);
        setError("Failed to load chart data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchChartData();
  }, [timeFrame, companyData?.ticker]);
  
  // Add safety check to prevent accessing undefined properties
  if (!companyData) {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Price Chart</CardTitle>
            <CardDescription>Loading company data...</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="h-[400px] w-full rounded-md border p-6 bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
              {loading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="h-full w-full flex items-center justify-center flex-col">
                  <LineChart size={48} className="text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-red-500">{error}</p>
                </div>
              ) : chartData ? (
                <Line 
                  data={chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.dataset.label}: ${currencySymbol}${context.parsed.y.toFixed(2)}`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          display: false
                        }
                      },
                      y: {
                        ticks: {
                          callback: function(value) {
                            return currencySymbol + value;
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <LineChart size={64} className="text-slate-300 dark:text-slate-600" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Price Chart</CardTitle>
              <CardDescription>{companyData.name || 'Company'} ({companyData.ticker || 'Symbol'})</CardDescription>
            </div>
            
            <div className="flex gap-1">
              {timeFrames.map(tf => (
                <Button
                  key={tf}
                  variant={timeFrame === tf ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFrame(tf)}
                  className="h-8 px-3"
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="h-[400px] w-full rounded-md border border-dashed p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
            <LineChart size={64} className="text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-slate-500 dark:text-slate-400">Interactive stock price chart would be displayed here</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {timeFrame} price movement for {companyData.ticker || 'Symbol'}
            </p>
          </div>
          
          <div className="mt-6 h-[100px] rounded-md border border-dashed p-2 flex items-center justify-center bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
            <BarChart4 size={32} className="text-slate-300 dark:text-slate-600" />
            <p className="ml-2 text-sm text-slate-400 dark:text-slate-500">Volume chart would appear here</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Performance</CardTitle>
            <CardDescription>Revenue & profit growth trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full rounded-md border border-dashed p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
              <LineChart size={48} className="text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-slate-500 dark:text-slate-400">Financial metrics chart would be displayed here</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Annual financial performance indicators
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Technical Indicators</CardTitle>
            <CardDescription>Moving averages & key indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full rounded-md border border-dashed p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 dark:border-slate-700">
              <LineChart size={48} className="text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-slate-500 dark:text-slate-400">Technical analysis chart would be displayed here</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Key technical indicators for trend analysis
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 