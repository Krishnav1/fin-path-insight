/**
 * Technical Indicators Service
 * Calculate RSI, MACD, SMA, EMA, Bollinger Bands and generate trading signals
 */

import { supabase } from '@/lib/supabase';
import { RSI, MACD, SMA, EMA, BollingerBands } from 'technicalindicators';

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RSIIndicator {
  value: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  overbought: boolean;
  oversold: boolean;
}

export interface MACDIndicator {
  macd: number;
  signal: number;
  histogram: number;
  crossover: 'bullish' | 'bearish' | 'none';
  trend: 'BUY' | 'SELL' | 'HOLD';
}

export interface SMAIndicator {
  value: number;
  priceAboveSMA: boolean;
  signal: 'BUY' | 'SELL' | 'HOLD';
}

export interface BollingerBandsIndicator {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  position: 'above_upper' | 'above_middle' | 'below_middle' | 'below_lower';
}

export interface TechnicalIndicators {
  symbol: string;
  timeframe: string;
  rsi?: RSIIndicator;
  macd?: MACDIndicator;
  sma?: SMAIndicator;
  ema?: SMAIndicator;
  bollingerBands?: BollingerBandsIndicator;
  overallSignal: 'BUY' | 'SELL' | 'HOLD';
  calculated_at: string;
}

class TechnicalIndicatorsService {
  /**
   * Calculate RSI (Relative Strength Index)
   */
  calculateRSI(prices: number[], period: number = 14): RSIIndicator | null {
    try {
      const rsiValues = RSI.calculate({ values: prices, period });
      if (rsiValues.length === 0) return null;

      const currentRSI = rsiValues[rsiValues.length - 1];
      const oversold = currentRSI < 30;
      const overbought = currentRSI > 70;

      let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      if (oversold) signal = 'BUY';
      else if (overbought) signal = 'SELL';

      return {
        value: currentRSI,
        signal,
        overbought,
        oversold
      };
    } catch (error) {
      console.error('Error calculating RSI:', error);
      return null;
    }
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(
    prices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): MACDIndicator | null {
    try {
      const macdValues = MACD.calculate({
        values: prices,
        fastPeriod,
        slowPeriod,
        signalPeriod,
        SimpleMAOscillator: false,
        SimpleMASignal: false
      });

      if (macdValues.length < 2) return null;

      const current = macdValues[macdValues.length - 1];
      const previous = macdValues[macdValues.length - 2];

      // Detect crossover
      let crossover: 'bullish' | 'bearish' | 'none' = 'none';
      if (previous.MACD && current.MACD && previous.signal && current.signal) {
        if (previous.MACD <= previous.signal && current.MACD > current.signal) {
          crossover = 'bullish';
        } else if (previous.MACD >= previous.signal && current.MACD < current.signal) {
          crossover = 'bearish';
        }
      }

      let trend: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      if (crossover === 'bullish') trend = 'BUY';
      else if (crossover === 'bearish') trend = 'SELL';
      else if (current.MACD && current.signal) {
        trend = current.MACD > current.signal ? 'BUY' : 'SELL';
      }

      return {
        macd: current.MACD || 0,
        signal: current.signal || 0,
        histogram: current.histogram || 0,
        crossover,
        trend
      };
    } catch (error) {
      console.error('Error calculating MACD:', error);
      return null;
    }
  }

  /**
   * Calculate SMA (Simple Moving Average)
   */
  calculateSMA(prices: number[], period: number = 20): SMAIndicator | null {
    try {
      const smaValues = SMA.calculate({ values: prices, period });
      if (smaValues.length === 0) return null;

      const currentSMA = smaValues[smaValues.length - 1];
      const currentPrice = prices[prices.length - 1];
      const priceAboveSMA = currentPrice > currentSMA;

      const signal: 'BUY' | 'SELL' | 'HOLD' = priceAboveSMA ? 'BUY' : 'SELL';

      return {
        value: currentSMA,
        priceAboveSMA,
        signal
      };
    } catch (error) {
      console.error('Error calculating SMA:', error);
      return null;
    }
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  calculateEMA(prices: number[], period: number = 20): SMAIndicator | null {
    try {
      const emaValues = EMA.calculate({ values: prices, period });
      if (emaValues.length === 0) return null;

      const currentEMA = emaValues[emaValues.length - 1];
      const currentPrice = prices[prices.length - 1];
      const priceAboveSMA = currentPrice > currentEMA;

      const signal: 'BUY' | 'SELL' | 'HOLD' = priceAboveSMA ? 'BUY' : 'SELL';

      return {
        value: currentEMA,
        priceAboveSMA,
        signal
      };
    } catch (error) {
      console.error('Error calculating EMA:', error);
      return null;
    }
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(
    prices: number[],
    period: number = 20,
    stdDev: number = 2
  ): BollingerBandsIndicator | null {
    try {
      const bbValues = BollingerBands.calculate({
        values: prices,
        period,
        stdDev
      });

      if (bbValues.length === 0) return null;

      const current = bbValues[bbValues.length - 1];
      const currentPrice = prices[prices.length - 1];

      const bandwidth = ((current.upper - current.lower) / current.middle) * 100;

      let position: 'above_upper' | 'above_middle' | 'below_middle' | 'below_lower';
      let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';

      if (currentPrice > current.upper) {
        position = 'above_upper';
        signal = 'SELL'; // Overbought
      } else if (currentPrice < current.lower) {
        position = 'below_lower';
        signal = 'BUY'; // Oversold
      } else if (currentPrice > current.middle) {
        position = 'above_middle';
      } else {
        position = 'below_middle';
      }

      return {
        upper: current.upper,
        middle: current.middle,
        lower: current.lower,
        bandwidth,
        signal,
        position
      };
    } catch (error) {
      console.error('Error calculating Bollinger Bands:', error);
      return null;
    }
  }

  /**
   * Calculate all indicators for a symbol
   */
  async calculateAllIndicators(
    symbol: string,
    priceData: PriceData[],
    timeframe: string = '1D'
  ): Promise<TechnicalIndicators | null> {
    try {
      const closePrices = priceData.map(p => p.close);

      const rsi = this.calculateRSI(closePrices);
      const macd = this.calculateMACD(closePrices);
      const sma = this.calculateSMA(closePrices);
      const ema = this.calculateEMA(closePrices);
      const bollingerBands = this.calculateBollingerBands(closePrices);

      // Calculate overall signal
      const signals: ('BUY' | 'SELL' | 'HOLD')[] = [];
      if (rsi) signals.push(rsi.signal);
      if (macd) signals.push(macd.trend);
      if (sma) signals.push(sma.signal);
      if (bollingerBands) signals.push(bollingerBands.signal);

      const buyCount = signals.filter(s => s === 'BUY').length;
      const sellCount = signals.filter(s => s === 'SELL').length;

      let overallSignal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      if (buyCount > sellCount) overallSignal = 'BUY';
      else if (sellCount > buyCount) overallSignal = 'SELL';

      const indicators: TechnicalIndicators = {
        symbol,
        timeframe,
        rsi: rsi || undefined,
        macd: macd || undefined,
        sma: sma || undefined,
        ema: ema || undefined,
        bollingerBands: bollingerBands || undefined,
        overallSignal,
        calculated_at: new Date().toISOString()
      };

      // Save to database
      await this.saveIndicators(indicators);

      return indicators;
    } catch (error) {
      console.error('Error calculating all indicators:', error);
      return null;
    }
  }

  /**
   * Save indicators to database
   */
  private async saveIndicators(indicators: TechnicalIndicators): Promise<void> {
    try {
      await supabase.from('technical_indicators').insert({
        symbol: indicators.symbol,
        indicator_type: 'ALL',
        timeframe: indicators.timeframe,
        value: {
          rsi: indicators.rsi,
          macd: indicators.macd,
          sma: indicators.sma,
          ema: indicators.ema,
          bollingerBands: indicators.bollingerBands
        },
        signal: indicators.overallSignal
      });
    } catch (error) {
      console.error('Error saving indicators:', error);
    }
  }

  /**
   * Get cached indicators from database
   */
  async getIndicators(
    symbol: string,
    timeframe: string = '1D'
  ): Promise<TechnicalIndicators | null> {
    try {
      const { data, error } = await supabase
        .from('technical_indicators')
        .select('*')
        .eq('symbol', symbol)
        .eq('timeframe', timeframe)
        .eq('indicator_type', 'ALL')
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      return {
        symbol: data.symbol,
        timeframe: data.timeframe,
        rsi: data.value.rsi,
        macd: data.value.macd,
        sma: data.value.sma,
        ema: data.value.ema,
        bollingerBands: data.value.bollingerBands,
        overallSignal: data.signal,
        calculated_at: data.calculated_at
      };
    } catch (error) {
      console.error('Error getting indicators:', error);
      return null;
    }
  }

  /**
   * Generate trading insights
   */
  generateInsights(indicators: TechnicalIndicators): string[] {
    const insights: string[] = [];

    // RSI insights
    if (indicators.rsi) {
      if (indicators.rsi.oversold) {
        insights.push(`📉 RSI at ${indicators.rsi.value.toFixed(2)} - Oversold condition, potential buy opportunity`);
      } else if (indicators.rsi.overbought) {
        insights.push(`📈 RSI at ${indicators.rsi.value.toFixed(2)} - Overbought condition, consider taking profits`);
      }
    }

    // MACD insights
    if (indicators.macd) {
      if (indicators.macd.crossover === 'bullish') {
        insights.push(`🔄 MACD bullish crossover detected - Strong buy signal`);
      } else if (indicators.macd.crossover === 'bearish') {
        insights.push(`🔄 MACD bearish crossover detected - Consider selling`);
      }
    }

    // Bollinger Bands insights
    if (indicators.bollingerBands) {
      if (indicators.bollingerBands.position === 'below_lower') {
        insights.push(`📊 Price below lower Bollinger Band - Potential bounce expected`);
      } else if (indicators.bollingerBands.position === 'above_upper') {
        insights.push(`📊 Price above upper Bollinger Band - Possible pullback ahead`);
      }
    }

    // Overall signal
    insights.push(`🎯 Overall Signal: ${indicators.overallSignal}`);

    return insights;
  }
}

export const technicalIndicatorsService = new TechnicalIndicatorsService();
