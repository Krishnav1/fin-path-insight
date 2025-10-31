/**
 * Portfolio Analytics Service
 * Calculates and caches portfolio analytics
 */

import { supabase } from '@/lib/supabase';

export interface PortfolioAnalytics {
  id?: string;
  user_id?: string;
  portfolio_id?: string;
  total_value: number;
  total_invested: number;
  total_profit: number;
  profit_percentage: number;
  day_change?: number;
  day_change_percentage?: number;
  sector_allocation: Record<string, number>;
  top_performers: Array<{
    symbol: string;
    name: string;
    profit_percentage: number;
  }>;
  worst_performers: Array<{
    symbol: string;
    name: string;
    profit_percentage: number;
  }>;
  risk_score?: number;
  created_at?: string;
  updated_at?: string;
}

export interface HoldingData {
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  sector?: string;
}

class PortfolioAnalyticsService {
  /**
   * Calculate portfolio analytics from holdings
   */
  calculateAnalytics(holdings: HoldingData[]): PortfolioAnalytics {
    let totalValue = 0;
    let totalInvested = 0;
    const sectorAllocation: Record<string, number> = {};
    const performers: Array<{
      symbol: string;
      name: string;
      profit_percentage: number;
    }> = [];

    holdings.forEach(holding => {
      const value = holding.quantity * holding.currentPrice;
      const invested = holding.quantity * holding.buyPrice;
      const profit = value - invested;
      const profitPercentage = (profit / invested) * 100;

      totalValue += value;
      totalInvested += invested;

      // Sector allocation
      const sector = holding.sector || 'Unknown';
      sectorAllocation[sector] = (sectorAllocation[sector] || 0) + value;

      // Track performers
      performers.push({
        symbol: holding.symbol,
        name: holding.name,
        profit_percentage: profitPercentage
      });
    });

    // Sort performers
    performers.sort((a, b) => b.profit_percentage - a.profit_percentage);

    // Convert sector allocation to percentages
    const sectorPercentages: Record<string, number> = {};
    Object.entries(sectorAllocation).forEach(([sector, value]) => {
      sectorPercentages[sector] = (value / totalValue) * 100;
    });

    // Calculate risk score (0-100)
    const riskScore = this.calculateRiskScore(holdings, sectorPercentages);

    return {
      total_value: totalValue,
      total_invested: totalInvested,
      total_profit: totalValue - totalInvested,
      profit_percentage: ((totalValue - totalInvested) / totalInvested) * 100,
      sector_allocation: sectorPercentages,
      top_performers: performers.slice(0, 5),
      worst_performers: performers.slice(-5).reverse(),
      risk_score: riskScore
    };
  }

  /**
   * Calculate portfolio risk score
   */
  private calculateRiskScore(
    holdings: HoldingData[],
    sectorAllocation: Record<string, number>
  ): number {
    let riskScore = 50; // Base score

    // Factor 1: Diversification (0-30 points)
    const numHoldings = holdings.length;
    if (numHoldings >= 15) riskScore -= 15;
    else if (numHoldings >= 10) riskScore -= 10;
    else if (numHoldings >= 5) riskScore -= 5;
    else riskScore += 10;

    // Factor 2: Sector concentration (0-30 points)
    const maxSectorAllocation = Math.max(...Object.values(sectorAllocation));
    if (maxSectorAllocation > 50) riskScore += 15;
    else if (maxSectorAllocation > 40) riskScore += 10;
    else if (maxSectorAllocation > 30) riskScore += 5;
    else riskScore -= 10;

    // Factor 3: Volatility (0-20 points) - based on profit variance
    const profitPercentages = holdings.map(h => 
      ((h.currentPrice - h.buyPrice) / h.buyPrice) * 100
    );
    const avgProfit = profitPercentages.reduce((a, b) => a + b, 0) / profitPercentages.length;
    const variance = profitPercentages.reduce((sum, p) => sum + Math.pow(p - avgProfit, 2), 0) / profitPercentages.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev > 30) riskScore += 10;
    else if (stdDev > 20) riskScore += 5;
    else riskScore -= 5;

    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, riskScore));
  }

  /**
   * Save analytics to Supabase
   */
  async saveAnalytics(analytics: PortfolioAnalytics, portfolioId?: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('portfolio_analytics')
        .insert({
          user_id: user.id,
          portfolio_id: portfolioId,
          ...analytics
        });

      if (error) {
        console.error('Error saving analytics:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveAnalytics:', error);
      return false;
    }
  }

  /**
   * Get latest analytics from Supabase
   */
  async getLatestAnalytics(portfolioId?: string): Promise<PortfolioAnalytics | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      let query = supabase
        .from('portfolio_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (portfolioId) {
        query = query.eq('portfolio_id', portfolioId);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error('Error fetching analytics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getLatestAnalytics:', error);
      return null;
    }
  }

  /**
   * Get analytics history
   */
  async getAnalyticsHistory(days: number = 30): Promise<PortfolioAnalytics[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('portfolio_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching analytics history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAnalyticsHistory:', error);
      return [];
    }
  }

  /**
   * Generate portfolio insights
   */
  generateInsights(analytics: PortfolioAnalytics): string[] {
    const insights: string[] = [];

    // Profit/Loss insights
    if (analytics.profit_percentage > 20) {
      insights.push(`🎉 Excellent performance! Your portfolio is up ${analytics.profit_percentage.toFixed(2)}%`);
    } else if (analytics.profit_percentage > 10) {
      insights.push(`📈 Good returns! Your portfolio gained ${analytics.profit_percentage.toFixed(2)}%`);
    } else if (analytics.profit_percentage < -10) {
      insights.push(`⚠️ Portfolio down ${Math.abs(analytics.profit_percentage).toFixed(2)}%. Consider reviewing your holdings.`);
    }

    // Risk insights
    if (analytics.risk_score && analytics.risk_score > 70) {
      insights.push(`⚠️ High risk detected (${analytics.risk_score}/100). Consider diversifying your portfolio.`);
    } else if (analytics.risk_score && analytics.risk_score < 30) {
      insights.push(`✅ Well-diversified portfolio with low risk (${analytics.risk_score}/100)`);
    }

    // Sector concentration insights
    const maxSector = Object.entries(analytics.sector_allocation)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (maxSector && maxSector[1] > 40) {
      insights.push(`⚠️ ${maxSector[1].toFixed(1)}% concentrated in ${maxSector[0]}. Consider diversifying across sectors.`);
    }

    // Top performer insight
    if (analytics.top_performers.length > 0) {
      const topStock = analytics.top_performers[0];
      insights.push(`🌟 Top performer: ${topStock.symbol} (+${topStock.profit_percentage.toFixed(2)}%)`);
    }

    return insights;
  }
}

export const portfolioAnalyticsService = new PortfolioAnalyticsService();
