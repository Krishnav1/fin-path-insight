/**
 * Backtesting Service
 * Test trading strategies on historical data with risk metrics
 */

import { supabase } from '@/lib/supabase';

export interface BacktestStrategy {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  strategy_config: StrategyConfig;
  symbols: string[];
  start_date: string;
  end_date: string;
  initial_capital: number;
  created_at?: string;
}

export interface StrategyConfig {
  type: 'sma_crossover' | 'rsi' | 'macd' | 'bollinger_bands' | 'custom';
  parameters: Record<string, any>;
  stop_loss?: number; // percentage
  take_profit?: number; // percentage
  position_size?: number; // percentage of capital per trade
}

export interface Trade {
  symbol: string;
  entry_date: string;
  exit_date?: string;
  entry_price: number;
  exit_price?: number;
  quantity: number;
  type: 'buy' | 'sell';
  profit_loss?: number;
  profit_loss_percent?: number;
  status: 'open' | 'closed';
}

export interface BacktestResult {
  id?: string;
  strategy_id?: string;
  user_id?: string;
  total_return: number;
  annualized_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  win_rate: number;
  total_trades: number;
  profitable_trades: number;
  trades: Trade[];
  equity_curve: { date: string; value: number }[];
  risk_metrics: RiskMetrics;
  created_at?: string;
}

export interface RiskMetrics {
  volatility: number;
  sortino_ratio: number;
  calmar_ratio: number;
  max_consecutive_losses: number;
  max_consecutive_wins: number;
  average_win: number;
  average_loss: number;
  profit_factor: number;
}

class BacktestingService {
  /**
   * Run backtest for a strategy
   */
  async runBacktest(strategy: BacktestStrategy): Promise<BacktestResult | null> {
    try {
      // Fetch historical data
      const historicalData = await this.fetchHistoricalData(
        strategy.symbols,
        strategy.start_date,
        strategy.end_date
      );

      if (!historicalData || historicalData.length === 0) {
        throw new Error('No historical data available');
      }

      // Execute strategy
      const trades = await this.executeStrategy(strategy, historicalData);

      // Calculate metrics
      const result = this.calculateMetrics(strategy, trades, historicalData);

      // Save to database
      const savedResult = await this.saveBacktestResult(strategy, result);

      return savedResult;
    } catch (error) {
      console.error('Error running backtest:', error);
      return null;
    }
  }

  /**
   * Fetch historical price data
   */
  private async fetchHistoricalData(
    symbols: string[],
    startDate: string,
    endDate: string
  ): Promise<Record<string, any[]>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const historicalData: Record<string, any[]> = {};

      for (const symbol of symbols) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-data`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              action: 'getHistoricalData',
              symbol,
              from: startDate,
              to: endDate
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          historicalData[symbol] = data.prices || [];
        }
      }

      return historicalData;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return {};
    }
  }

  /**
   * Execute trading strategy
   */
  private async executeStrategy(
    strategy: BacktestStrategy,
    historicalData: Record<string, any[]>
  ): Promise<Trade[]> {
    const trades: Trade[] = [];
    let capital = strategy.initial_capital;
    const positionSize = strategy.strategy_config.position_size || 100;

    // Simple SMA Crossover strategy example
    if (strategy.strategy_config.type === 'sma_crossover') {
      const { fast_period = 10, slow_period = 20 } = strategy.strategy_config.parameters;

      for (const symbol of strategy.symbols) {
        const prices: any[] = historicalData[symbol] || [];
        if (prices.length < slow_period) continue;

        let position: Trade | null = null;

        for (let i = slow_period; i < prices.length; i++) {
          const recentPrices = prices.slice(i - slow_period, i).map((p: any) => p.close);
          
          // Calculate SMAs
          const fastSMA = this.calculateSMA(recentPrices.slice(-fast_period));
          const slowSMA = this.calculateSMA(recentPrices);
          const prevFastSMA = this.calculateSMA(
            prices.slice(i - slow_period - 1, i - 1).map((p: any) => p.close).slice(-fast_period)
          );
          const prevSlowSMA = this.calculateSMA(
            prices.slice(i - slow_period - 1, i - 1).map((p: any) => p.close)
          );

          const currentPrice = prices[i].close;
          const currentDate = prices[i].date;

          // Buy signal: fast crosses above slow
          if (!position && prevFastSMA <= prevSlowSMA && fastSMA > slowSMA) {
            const quantity = Math.floor((capital * positionSize / 100) / currentPrice);
            if (quantity > 0) {
              position = {
                symbol,
                entry_date: currentDate,
                entry_price: currentPrice,
                quantity,
                type: 'buy',
                status: 'open'
              };
              capital -= quantity * currentPrice;
            }
          }

          // Sell signal: fast crosses below slow
          if (position && prevFastSMA >= prevSlowSMA && fastSMA < slowSMA) {
            const exitValue = position.quantity * currentPrice;
            const entryValue = position.quantity * position.entry_price;
            const profitLoss = exitValue - entryValue;

            trades.push({
              ...position,
              exit_date: currentDate,
              exit_price: currentPrice,
              profit_loss: profitLoss,
              profit_loss_percent: (profitLoss / entryValue) * 100,
              status: 'closed'
            });

            capital += exitValue;
            position = null;
          }

          // Stop loss check
          if (position && strategy.strategy_config.stop_loss) {
            const loss = ((currentPrice - position.entry_price) / position.entry_price) * 100;
            if (loss <= -strategy.strategy_config.stop_loss) {
              const exitValue = position.quantity * currentPrice;
              const entryValue = position.quantity * position.entry_price;
              
              trades.push({
                ...position,
                exit_date: currentDate,
                exit_price: currentPrice,
                profit_loss: exitValue - entryValue,
                profit_loss_percent: loss,
                status: 'closed'
              });

              capital += exitValue;
              position = null;
            }
          }

          // Take profit check
          if (position && strategy.strategy_config.take_profit) {
            const gain = ((currentPrice - position.entry_price) / position.entry_price) * 100;
            if (gain >= strategy.strategy_config.take_profit) {
              const exitValue = position.quantity * currentPrice;
              const entryValue = position.quantity * position.entry_price;
              
              trades.push({
                ...position,
                exit_date: currentDate,
                exit_price: currentPrice,
                profit_loss: exitValue - entryValue,
                profit_loss_percent: gain,
                status: 'closed'
              });

              capital += exitValue;
              position = null;
            }
          }
        }

        // Close any open position at the end
        if (position) {
          const lastPrice = prices[prices.length - 1];
          const exitValue = position.quantity * lastPrice.close;
          const entryValue = position.quantity * position.entry_price;

          trades.push({
            ...position,
            exit_date: lastPrice.date,
            exit_price: lastPrice.close,
            profit_loss: exitValue - entryValue,
            profit_loss_percent: ((exitValue - entryValue) / entryValue) * 100,
            status: 'closed'
          });
        }
      }
    }

    return trades;
  }

  /**
   * Calculate Simple Moving Average
   */
  private calculateSMA(prices: number[]): number {
    return prices.reduce((sum, price) => sum + price, 0) / prices.length;
  }

  /**
   * Calculate backtest metrics
   */
  private calculateMetrics(
    strategy: BacktestStrategy,
    trades: Trade[],
    historicalData: Record<string, any[]>
  ): BacktestResult {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const profitableTrades = closedTrades.filter(t => (t.profit_loss || 0) > 0);
    
    const totalReturn = closedTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const finalCapital = strategy.initial_capital + totalReturn;
    const returnPercent = (totalReturn / strategy.initial_capital) * 100;

    // Calculate annualized return
    const startDate = new Date(strategy.start_date);
    const endDate = new Date(strategy.end_date);
    const years = (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const annualizedReturn = (Math.pow(finalCapital / strategy.initial_capital, 1 / years) - 1) * 100;

    // Calculate equity curve
    const equityCurve: { date: string; value: number }[] = [];
    let runningCapital = strategy.initial_capital;
    
    closedTrades.forEach(trade => {
      runningCapital += trade.profit_loss || 0;
      equityCurve.push({
        date: trade.exit_date || '',
        value: runningCapital
      });
    });

    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = strategy.initial_capital;
    
    equityCurve.forEach(point => {
      if (point.value > peak) peak = point.value;
      const drawdown = ((peak - point.value) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Calculate Sharpe Ratio (simplified)
    const returns = closedTrades.map(t => (t.profit_loss_percent || 0) / 100);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    // Risk metrics
    const wins = closedTrades.filter(t => (t.profit_loss || 0) > 0);
    const losses = closedTrades.filter(t => (t.profit_loss || 0) < 0);
    
    const avgWin = wins.length > 0 
      ? wins.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / wins.length 
      : 0;
    const avgLoss = losses.length > 0 
      ? Math.abs(losses.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / losses.length)
      : 0;
    
    const profitFactor = avgLoss > 0 ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;

    const riskMetrics: RiskMetrics = {
      volatility: stdDev * 100,
      sortino_ratio: sharpeRatio, // Simplified
      calmar_ratio: maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0,
      max_consecutive_losses: this.calculateMaxConsecutive(closedTrades, false),
      max_consecutive_wins: this.calculateMaxConsecutive(closedTrades, true),
      average_win: avgWin,
      average_loss: avgLoss,
      profit_factor: profitFactor
    };

    return {
      total_return: returnPercent,
      annualized_return: annualizedReturn,
      sharpe_ratio: sharpeRatio,
      max_drawdown: maxDrawdown,
      win_rate: closedTrades.length > 0 ? (profitableTrades.length / closedTrades.length) * 100 : 0,
      total_trades: closedTrades.length,
      profitable_trades: profitableTrades.length,
      trades: closedTrades,
      equity_curve: equityCurve,
      risk_metrics: riskMetrics
    };
  }

  /**
   * Calculate max consecutive wins/losses
   */
  private calculateMaxConsecutive(trades: Trade[], wins: boolean): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    trades.forEach(trade => {
      const isWin = (trade.profit_loss || 0) > 0;
      if (isWin === wins) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    });

    return maxConsecutive;
  }

  /**
   * Save backtest result to database
   */
  private async saveBacktestResult(
    strategy: BacktestStrategy,
    result: BacktestResult
  ): Promise<BacktestResult | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return result;

      // Save strategy first
      const { data: savedStrategy, error: strategyError } = await supabase
        .from('backtesting_strategies')
        .insert({
          user_id: user.id,
          name: strategy.name,
          description: strategy.description,
          strategy_config: strategy.strategy_config,
          symbols: strategy.symbols,
          start_date: strategy.start_date,
          end_date: strategy.end_date,
          initial_capital: strategy.initial_capital
        })
        .select()
        .single();

      if (strategyError || !savedStrategy) {
        console.error('Error saving strategy:', strategyError);
        return result;
      }

      // Save result
      const { data: savedResult, error: resultError } = await supabase
        .from('backtesting_results')
        .insert({
          strategy_id: savedStrategy.id,
          user_id: user.id,
          total_return: result.total_return,
          annualized_return: result.annualized_return,
          sharpe_ratio: result.sharpe_ratio,
          max_drawdown: result.max_drawdown,
          win_rate: result.win_rate,
          total_trades: result.total_trades,
          profitable_trades: result.profitable_trades,
          trades: result.trades,
          equity_curve: result.equity_curve,
          risk_metrics: result.risk_metrics
        })
        .select()
        .single();

      if (resultError) {
        console.error('Error saving result:', resultError);
        return result;
      }

      return { ...result, ...savedResult, strategy_id: savedStrategy.id };
    } catch (error) {
      console.error('Error in saveBacktestResult:', error);
      return result;
    }
  }

  /**
   * Get backtest results
   */
  async getBacktestResults(limit: number = 10): Promise<BacktestResult[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('backtesting_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching backtest results:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getBacktestResults:', error);
      return [];
    }
  }

  /**
   * Get strategies
   */
  async getStrategies(): Promise<BacktestStrategy[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('backtesting_strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching strategies:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStrategies:', error);
      return [];
    }
  }
}

export const backtestingService = new BacktestingService();
