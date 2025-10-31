/**
 * Chart Utils
 * Utility functions for working with chart data
 */

import type { ChartDataPoint } from './api-service';
import { getIntradayPricesEODHD } from './eodhd-service';

/**
 * Process intraday data for chart display
 * @param symbol Stock symbol
 * @param interval Time interval (e.g., '5m', '15m', '1h', '1d')
 * @param range Data range (e.g., '1d', '5d', '1m')
 * @returns Processed chart data
 */
export async function getChartData(
  symbol: string,
  interval: string = '5m',
  range: string = '1d'
) {
  try {
    // Get intraday data from EODHD API
    const data = await getIntradayPricesEODHD(symbol, interval, range);
    
    if (!data || data.length === 0) {
      console.error('No intraday data returned for', symbol);
      return { labels: [], datasets: [] };
    }
    
    // Process data for chart display
    const chartData = {
      labels: data.map(item => new Date(item.date).toLocaleTimeString()),
      datasets: [
        {
          label: 'Price',
          data: data.map(item => item.close),
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.3,
          fill: true
        },
        {
          label: 'Volume',
          data: data.map(item => item.volume),
          type: 'bar',
          backgroundColor: 'rgba(156, 163, 175, 0.5)',
          yAxisID: 'y-axis-volume',
          hidden: true
        }
      ]
    };
    
    return chartData;
  } catch (error) {
    console.error('Error getting chart data:', error);
    return { labels: [], datasets: [] };
  }
}

/**
 * Get moving average from chart data
 * @param data Array of price data points
 * @param period Moving average period
 * @returns Moving average data
 */
export function calculateMovingAverage(data: ChartDataPoint[], period: number) {
  if (!data || data.length === 0 || period <= 0) return [];
  
  const result: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      // Not enough data for MA calculation yet
      result.push(NaN);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    
    result.push(sum / period);
  }
  
  return result;
}

/**
 * Format chart data with technical indicators
 * @param symbol Stock symbol
 * @param indicators Array of indicators to add (e.g., 'sma20', 'sma50')
 */
export async function getEnhancedChartData(
  symbol: string,
  interval: string = '5m',
  range: string = '1d',
  indicators: string[] = []
) {
  try {
    const data = await getIntradayPricesEODHD(symbol, interval, range);
    
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }
    
    // Base chart data
    const chartData: any = {
      labels: data.map(item => new Date(item.date).toLocaleTimeString()),
      datasets: [
        {
          label: 'Price',
          data: data.map(item => item.close),
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    };
    
    // Add technical indicators
    if (indicators.includes('sma20')) {
      const sma20 = calculateMovingAverage(data, 20);
      chartData.datasets.push({
        label: 'SMA 20',
        data: sma20,
        borderColor: '#EF4444',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.1,
        fill: false
      });
    }
    
    if (indicators.includes('sma50')) {
      const sma50 = calculateMovingAverage(data, 50);
      chartData.datasets.push({
        label: 'SMA 50',
        data: sma50,
        borderColor: '#10B981',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.1,
        fill: false
      });
    }
    
    return chartData;
  } catch (error) {
    console.error('Error getting enhanced chart data:', error);
    return { labels: [], datasets: [] };
  }
}
