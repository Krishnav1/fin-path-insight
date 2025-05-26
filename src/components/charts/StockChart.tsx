import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ChartDataPoint } from '@/lib/api-service';
import { getChartData, calculateMovingAverage } from '@/lib/chart-utils';

interface StockChartProps {
  symbol: string;
  title?: string;
  showTechnicals?: boolean;
}

const StockChart: React.FC<StockChartProps> = ({ 
  symbol, 
  title = 'Price Chart', 
  showTechnicals = false 
}) => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<string>('5m');
  const [rawData, setRawData] = useState<ChartDataPoint[] | null>(null);

  // Available intervals
  const intervals = [
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1h', value: '1h' },
    { label: '4h', value: '4h' }
  ];

  // Fetch chart data when symbol or interval changes
  useEffect(() => {
    async function fetchData() {
      if (!symbol) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get chart data using the new utility
        const chartData = await getChartData(symbol, interval, '1d');
        if (!chartData || !chartData.labels || chartData.labels.length === 0) {
          setError('No data available for this symbol');
          setLoading(false);
          return;
        }
        setChartData(chartData);
        // Optionally set rawData if needed for technicals (not used in this refactor)
        // setRawData(data); // data is not available directly here
        
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [symbol, interval, showTechnicals]);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">
          {title} {symbol && `(${symbol})`}
        </CardTitle>
        <div className="flex space-x-1">
          {intervals.map((int) => (
            <Button 
              key={int.value}
              variant={interval === int.value ? "default" : "outline"}
              size="sm"
              onClick={() => setInterval(int.value)}
              className="h-7 text-xs px-2"
            >
              {int.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="h-[300px] w-full flex items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : chartData ? (
          <div className="h-[300px] w-full">
            <Line 
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index',
                  intersect: false,
                },
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      boxWidth: 10,
                      font: {
                        size: 10
                      }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
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
                    position: 'right',
                    ticks: {
                      callback: function(value) {
                        return '$' + value;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center">
            <p>No data available</p>
          </div>
        )}
        
        {!loading && !error && rawData && (
          <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
              <div className="text-slate-500">Open</div>
              <div className="font-medium">${rawData[0]?.open.toFixed(2)}</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
              <div className="text-slate-500">High</div>
              <div className="font-medium">${Math.max(...rawData.map(d => d.high)).toFixed(2)}</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
              <div className="text-slate-500">Low</div>
              <div className="font-medium">${Math.min(...rawData.map(d => d.low)).toFixed(2)}</div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded">
              <div className="text-slate-500">Close</div>
              <div className="font-medium">${rawData[rawData.length-1]?.close.toFixed(2)}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockChart;
