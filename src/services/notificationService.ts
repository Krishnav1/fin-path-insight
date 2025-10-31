/**
 * Notification Service
 * Manages user notifications and alerts
 */

import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
}

export interface NotificationInput {
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

class NotificationService {
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private realtimeChannel: any = null;

  /**
   * Create a new notification
   */
  async createNotification(input: NotificationInput): Promise<Notification | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: input.type,
          title: input.title,
          message: input.message,
          data: input.data || {},
          priority: input.priority || 'normal',
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      // Notify listeners
      this.notifyListeners();

      return data;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return null;
    }
  }

  /**
   * Get all notifications for current user
   */
  async getNotifications(limit: number = 50): Promise<Notification[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return [];
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return 0;
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all as read:', error);
        return false;
      }

      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return false;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return false;
    }
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting all notifications:', error);
        return false;
      }

      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error in deleteAllNotifications:', error);
      return false;
    }
  }

  /**
   * Subscribe to real-time notification updates
   */
  async subscribeToNotifications(callback: (notifications: Notification[]) => void): Promise<void> {
    this.listeners.add(callback);

    // Set up real-time subscription if not already done
    if (!this.realtimeChannel) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      this.realtimeChannel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            this.notifyListeners();
          }
        )
        .subscribe();
    }

    // Send initial notifications
    const notifications = await this.getNotifications();
    callback(notifications);
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications(callback: (notifications: Notification[]) => void): void {
    this.listeners.delete(callback);

    // Clean up real-time subscription if no listeners
    if (this.listeners.size === 0 && this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  /**
   * Notify all listeners
   */
  private async notifyListeners(): Promise<void> {
    const notifications = await this.getNotifications();
    this.listeners.forEach(listener => listener(notifications));
  }

  /**
   * Create portfolio alert notification
   */
  async createPortfolioAlert(title: string, message: string, data?: any): Promise<void> {
    await this.createNotification({
      type: 'portfolio_alert',
      title,
      message,
      data,
      priority: 'high'
    });
  }

  /**
   * Create price alert notification
   */
  async createPriceAlert(symbol: string, targetPrice: number, currentPrice: number): Promise<void> {
    await this.createNotification({
      type: 'price_alert',
      title: `Price Alert: ${symbol}`,
      message: `${symbol} has reached your target price of ₹${targetPrice.toFixed(2)}. Current price: ₹${currentPrice.toFixed(2)}`,
      data: { symbol, targetPrice, currentPrice },
      priority: 'high'
    });
  }

  /**
   * Create earnings alert notification
   */
  async createEarningsAlert(symbol: string, earningsDate: string): Promise<void> {
    await this.createNotification({
      type: 'earnings_alert',
      title: `Earnings Alert: ${symbol}`,
      message: `${symbol} earnings report is scheduled for ${earningsDate}`,
      data: { symbol, earningsDate },
      priority: 'normal'
    });
  }
}

export const notificationService = new NotificationService();
