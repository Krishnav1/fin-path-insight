/**
 * Portfolio Rebalancing Service
 * Provides target allocation suggestions, buy/sell recommendations, and tax implications
 */

import { supabase } from '@/lib/supabase';

export interface PortfolioHolding {
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  value: number;
  allocation: number; // percentage
}

export interface TargetAllocation {
  [symbol: string]: number; // percentage
}

export interface RebalanceRecommendation {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  quantity: number;
  amount: number;
  currentAllocation: number;
  targetAllocation: number;
  difference: number;
}

export interface TaxImplication {
  symbol: string;
  capitalGains: number;
  holdingPeriod: number; // days
  taxType: 'short_term' | 'long_term';
  estimatedTax: number;
}

export interface RebalancingPlan {
  id?: string;
  user_id?: string;
  portfolio_id?: string;
  current_allocation: Record<string, number>;
  target_allocation: Record<string, number>;
  recommendations: RebalanceRecommendation[];
  tax_implications?: TaxImplication[];
  total_tax_liability?: number;
  created_at?: string;
  status?: 'pending' | 'applied' | 'rejected';
}

class PortfolioRebalancingService {
  // Tax rates (India)
  private readonly SHORT_TERM_TAX_RATE = 0.15; // 15% for equity held < 1 year
  private readonly LONG_TERM_TAX_RATE = 0.10; // 10% for equity held > 1 year (above 1L)
  private readonly LONG_TERM_EXEMPTION = 100000; // ₹1 lakh exemption

  /**
   * Calculate current portfolio allocation
   */
  calculateCurrentAllocation(holdings: PortfolioHolding[]): Record<string, number> {
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const allocation: Record<string, number> = {};

    holdings.forEach(holding => {
      allocation[holding.symbol] = (holding.value / totalValue) * 100;
    });

    return allocation;
  }

  /**
   * Generate target allocation based on strategy
   */
  generateTargetAllocation(
    holdings: PortfolioHolding[],
    strategy: 'equal' | 'market_cap' | 'risk_parity' | 'custom',
    customAllocation?: Record<string, number>
  ): Record<string, number> {
    const target: Record<string, number> = {};

    switch (strategy) {
      case 'equal':
        // Equal weight for all holdings
        const equalWeight = 100 / holdings.length;
        holdings.forEach(h => {
          target[h.symbol] = equalWeight;
        });
        break;

      case 'market_cap':
        // Weight by current market value
        const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
        holdings.forEach(h => {
          target[h.symbol] = (h.value / totalValue) * 100;
        });
        break;

      case 'risk_parity':
        // Simplified risk parity (inverse volatility weighting)
        // In production, calculate actual volatility
        const equalRisk = 100 / holdings.length;
        holdings.forEach(h => {
          target[h.symbol] = equalRisk;
        });
        break;

      case 'custom':
        if (customAllocation) {
          return customAllocation;
        }
        break;
    }

    return target;
  }

  /**
   * Calculate rebalancing recommendations
   */
  calculateRecommendations(
    holdings: PortfolioHolding[],
    targetAllocation: Record<string, number>,
    threshold: number = 5 // Rebalance if difference > 5%
  ): RebalanceRecommendation[] {
    const recommendations: RebalanceRecommendation[] = [];
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const currentAllocation = this.calculateCurrentAllocation(holdings);

    holdings.forEach(holding => {
      const current = currentAllocation[holding.symbol] || 0;
      const target = targetAllocation[holding.symbol] || 0;
      const difference = target - current;

      // Only recommend if difference exceeds threshold
      if (Math.abs(difference) > threshold) {
        const targetValue = (target / 100) * totalValue;
        const currentValue = holding.value;
        const amountDifference = targetValue - currentValue;
        const quantity = Math.abs(Math.round(amountDifference / holding.currentPrice));

        recommendations.push({
          symbol: holding.symbol,
          action: amountDifference > 0 ? 'buy' : 'sell',
          quantity,
          amount: Math.abs(amountDifference),
          currentAllocation: current,
          targetAllocation: target,
          difference
        });
      } else {
        recommendations.push({
          symbol: holding.symbol,
          action: 'hold',
          quantity: 0,
          amount: 0,
          currentAllocation: current,
          targetAllocation: target,
          difference
        });
      }
    });

    return recommendations;
  }

  /**
   * Calculate tax implications for selling
   */
  calculateTaxImplications(
    holdings: PortfolioHolding[],
    recommendations: RebalanceRecommendation[]
  ): TaxImplication[] {
    const implications: TaxImplication[] = [];

    recommendations.forEach(rec => {
      if (rec.action === 'sell') {
        const holding = holdings.find(h => h.symbol === rec.symbol);
        if (!holding) return;

        const capitalGains = (holding.currentPrice - holding.buyPrice) * rec.quantity;
        
        // Assume holding period (in production, get from database)
        const holdingPeriod = 365; // days
        const isLongTerm = holdingPeriod > 365;

        let estimatedTax = 0;
        if (isLongTerm) {
          // Long-term: 10% on gains above 1L
          const taxableGains = Math.max(0, capitalGains - this.LONG_TERM_EXEMPTION);
          estimatedTax = taxableGains * this.LONG_TERM_TAX_RATE;
        } else {
          // Short-term: 15% on all gains
          estimatedTax = capitalGains * this.SHORT_TERM_TAX_RATE;
        }

        implications.push({
          symbol: rec.symbol,
          capitalGains,
          holdingPeriod,
          taxType: isLongTerm ? 'long_term' : 'short_term',
          estimatedTax: Math.max(0, estimatedTax)
        });
      }
    });

    return implications;
  }

  /**
   * Create a rebalancing plan
   */
  async createRebalancingPlan(
    holdings: PortfolioHolding[],
    targetAllocation: Record<string, number>,
    portfolioId?: string
  ): Promise<RebalancingPlan | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const currentAllocation = this.calculateCurrentAllocation(holdings);
      const recommendations = this.calculateRecommendations(holdings, targetAllocation);
      const taxImplications = this.calculateTaxImplications(holdings, recommendations);
      const totalTaxLiability = taxImplications.reduce((sum, t) => sum + t.estimatedTax, 0);

      const plan: RebalancingPlan = {
        current_allocation: currentAllocation,
        target_allocation: targetAllocation,
        recommendations,
        tax_implications: taxImplications,
        total_tax_liability: totalTaxLiability
      };

      // Save to database
      const { data, error } = await supabase
        .from('portfolio_rebalancing')
        .insert({
          user_id: user.id,
          portfolio_id: portfolioId,
          current_allocation: currentAllocation,
          target_allocation: targetAllocation,
          recommendations,
          tax_implications: taxImplications,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating rebalancing plan:', error);
        return plan; // Return plan even if save fails
      }

      return { ...plan, ...data };
    } catch (error) {
      console.error('Error in createRebalancingPlan:', error);
      return null;
    }
  }

  /**
   * Get rebalancing plans
   */
  async getRebalancingPlans(limit: number = 10): Promise<RebalancingPlan[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('portfolio_rebalancing')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching rebalancing plans:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRebalancingPlans:', error);
      return [];
    }
  }

  /**
   * Update plan status
   */
  async updatePlanStatus(
    planId: string,
    status: 'applied' | 'rejected'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('portfolio_rebalancing')
        .update({
          status,
          applied_at: status === 'applied' ? new Date().toISOString() : null
        })
        .eq('id', planId);

      if (error) {
        console.error('Error updating plan status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePlanStatus:', error);
      return false;
    }
  }

  /**
   * Get rebalancing insights
   */
  generateInsights(plan: RebalancingPlan): string[] {
    const insights: string[] = [];

    // Tax efficiency insight
    if (plan.total_tax_liability && plan.total_tax_liability > 0) {
      insights.push(
        `⚠️ Rebalancing will incur ₹${plan.total_tax_liability.toFixed(0)} in capital gains tax`
      );
    }

    // Large rebalancing warning
    const largeChanges = plan.recommendations.filter(r => Math.abs(r.difference) > 10);
    if (largeChanges.length > 0) {
      insights.push(
        `📊 ${largeChanges.length} holdings require significant rebalancing (>10% change)`
      );
    }

    // Buy/sell summary
    const buys = plan.recommendations.filter(r => r.action === 'buy');
    const sells = plan.recommendations.filter(r => r.action === 'sell');
    
    if (buys.length > 0) {
      const totalBuyAmount = buys.reduce((sum, r) => sum + r.amount, 0);
      insights.push(`💰 Buy ${buys.length} stocks worth ₹${totalBuyAmount.toFixed(0)}`);
    }

    if (sells.length > 0) {
      const totalSellAmount = sells.reduce((sum, r) => sum + r.amount, 0);
      insights.push(`💸 Sell ${sells.length} stocks worth ₹${totalSellAmount.toFixed(0)}`);
    }

    return insights;
  }
}

export const portfolioRebalancingService = new PortfolioRebalancingService();
