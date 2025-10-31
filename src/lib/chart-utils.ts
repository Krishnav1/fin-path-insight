/**
 * Chart Utilities - UPDATED FOR INDIAN API
 * Processes chart data for display
 */

import type { ChartDataPoint } from './api-service';
import { getStockHistory } from '@/services/indianMarketService';

/**
 * Process historical data for chart display
 */
export async function processIntradayData(
  symbol: string,
  interval: string = '5min',
  range: string = '1d'
) {
  try {
    // Get historical data from Indian API
    const data = await getStockHistory(symbol, range);
    
    if (!data || data.length === 0) {
      console.error('No historical data returned for', symbol);
      return [];
    }

    // Transform to chart format
    return data.map(item => ({
      timestamp: new Date(item.date).getTime(),
      date: item.date,
      close: item.close,
      open: item.open,
      high: item.high,
      low: item.low,
      volume: item.volume
    }));
  } catch (error) {
    console.error('Error processing historical data:', error);
    return [];
  }
}

/**
 * Format chart data for display with indicators
 */
export async function formatChartData(
  symbol: string,
  interval: string = '1d',
  range: string = '1M',
  indicators: string[] = []
) {
  try {
    const data = await getStockHistory(symbol, range);
    
    if (!data || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    const labels = data.map(item => item.date);
    const prices = data.map(item => item.close);

    const datasets: any[] = [
      {
        label: 'Price',
        data: prices,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.1
      }
    ];

    // Add volume if requested
    if (indicators.includes('volume')) {
      datasets.push({
        label: 'Volume',
        data: data.map(item => item.volume),
        type: 'bar',
        backgroundColor: 'rgba(148, 163, 184, 0.5)',
        yAxisID: 'volume'
      });
    }

    return { labels, datasets };
  } catch (error) {
    console.error('Error formatting chart data:', error);
    return { labels: [], datasets: [] };
  }
}

/**
 * Calculate simple moving average
 */
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

/**
 * Calculate exponential moving average
 */
export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // First EMA is SMA
  const firstSMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema.push(firstSMA);
  
  // Calculate rest of EMAs
  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(currentEMA);
  }
  
  return ema;
}

/**
 * Get enhanced chart data with indicators
 */
export async function getEnhancedChartData(
  symbol: string,
  period: string = '1M'
) {
  try {
    const data = await getStockHistory(symbol, period);
    
    if (!data || data.length === 0) {
      return null;
    }

    const prices = data.map(d => d.close);
    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);
    const ema12 = calculateEMA(prices, 12);

    return {
      dates: data.map(d => d.date),
      prices,
      sma20,
      sma50,
      ema12,
      volume: data.map(d => d.volume),
      high: data.map(d => d.high),
      low: data.map(d => d.low)
    };
  } catch (error) {
    console.error('Error getting enhanced chart data:', error);
    return null;
  }
}
