/**
 * Price Alert Management Service
 * Create, edit, delete, and track price alerts
 */

import { supabase } from '@/lib/supabase';
import { notificationService } from './notificationService';

export interface PriceAlert {
  id: string;
  user_id: string;
  symbol: string;
  target_price: number;
  condition: 'above' | 'below';
  is_active: boolean;
  triggered: boolean;
  created_at: string;
  triggered_at?: string;
}

export interface PriceAlertHistory {
  id: string;
  alert_id: string;
  user_id: string;
  symbol: string;
  triggered_price: number;
  target_price: number;
  triggered_at: string;
  notification_sent: boolean;
}

export interface CreateAlertInput {
  symbol: string;
  target_price: number;
  condition: 'above' | 'below';
}

class PriceAlertService {
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Create a new price alert
   */
  async createAlert(input: CreateAlertInput): Promise<PriceAlert | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('price_alerts')
        .insert({
          user_id: user.id,
          symbol: input.symbol.toUpperCase(),
          target_price: input.target_price,
          condition: input.condition,
          is_active: true,
          triggered: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating alert:', error);
        return null;
      }

      // Start monitoring if not already running
      this.startMonitoring();

      return data;
    } catch (error) {
      console.error('Error in createAlert:', error);
      return null;
    }
  }

  /**
   * Get all alerts for current user
   */
  async getAlerts(activeOnly: boolean = false): Promise<PriceAlert[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true).eq('triggered', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching alerts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAlerts:', error);
      return [];
    }
  }

  /**
   * Update an existing alert
   */
  async updateAlert(
    alertId: string,
    updates: Partial<CreateAlertInput & { is_active: boolean }>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .update(updates)
        .eq('id', alertId);

      if (error) {
        console.error('Error updating alert:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateAlert:', error);
      return false;
    }
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId);

      if (error) {
        console.error('Error deleting alert:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteAlert:', error);
      return false;
    }
  }

  /**
   * Toggle alert active status
   */
  async toggleAlert(alertId: string, isActive: boolean): Promise<boolean> {
    return this.updateAlert(alertId, { is_active: isActive });
  }

  /**
   * Get alert history
   */
  async getAlertHistory(limit: number = 50): Promise<PriceAlertHistory[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('price_alert_history')
        .select('*')
        .eq('user_id', user.id)
        .order('triggered_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching alert history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAlertHistory:', error);
      return [];
    }
  }

  /**
   * Check if price alert should trigger
   */
  private shouldTrigger(alert: PriceAlert, currentPrice: number): boolean {
    if (!alert.is_active || alert.triggered) return false;

    if (alert.condition === 'above') {
      return currentPrice >= alert.target_price;
    } else {
      return currentPrice <= alert.target_price;
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(alert: PriceAlert, currentPrice: number): Promise<void> {
    try {
      // Update alert as triggered
      await supabase
        .from('price_alerts')
        .update({
          triggered: true,
          triggered_at: new Date().toISOString()
        })
        .eq('id', alert.id);

      // Add to history
      await supabase
        .from('price_alert_history')
        .insert({
          alert_id: alert.id,
          user_id: alert.user_id,
          symbol: alert.symbol,
          triggered_price: currentPrice,
          target_price: alert.target_price,
          notification_sent: true
        });

      // Send notification
      await notificationService.createPriceAlert(
        alert.symbol,
        alert.target_price,
        currentPrice
      );
    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  /**
   * Check all active alerts
   */
  async checkAlerts(): Promise<void> {
    try {
      const alerts = await this.getAlerts(true);
      if (alerts.length === 0) return;

      // Get unique symbols
      const symbols = [...new Set(alerts.map(a => a.symbol))];

      // Fetch current prices (using your existing price service)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/indian-market-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            action: 'getBulkPrices',
            symbols: symbols
          })
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      const prices = data.prices || {};

      // Check each alert
      for (const alert of alerts) {
        const priceData = prices[alert.symbol];
        if (!priceData) continue;

        const currentPrice = priceData.price || priceData.ltp;
        if (!currentPrice) continue;

        if (this.shouldTrigger(alert, currentPrice)) {
          await this.triggerAlert(alert, currentPrice);
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  /**
   * Start monitoring alerts
   */
  startMonitoring(): void {
    if (this.checkInterval) return;

    // Check every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkAlerts();
    }, 30000);

    // Initial check
    this.checkAlerts();
  }

  /**
   * Stop monitoring alerts
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(): Promise<{
    total: number;
    active: number;
    triggered: number;
    successRate: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total: 0, active: 0, triggered: 0, successRate: 0 };

      const { data: allAlerts } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', user.id);

      const total = allAlerts?.length || 0;
      const active = allAlerts?.filter(a => a.is_active && !a.triggered).length || 0;
      const triggered = allAlerts?.filter(a => a.triggered).length || 0;
      const successRate = total > 0 ? (triggered / total) * 100 : 0;

      return { total, active, triggered, successRate };
    } catch (error) {
      console.error('Error getting alert stats:', error);
      return { total: 0, active: 0, triggered: 0, successRate: 0 };
    }
  }
}

export const priceAlertService = new PriceAlertService();
