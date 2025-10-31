/**
 * Notification Bell Component
 * Displays notifications with real-time updates
 */

import React, { useEffect, useState } from 'react';
import { Bell, X, Check, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { notificationService, Notification } from '@/services/notificationService';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to notifications
    notificationService.subscribeToNotifications((newNotifications) => {
      setNotifications(newNotifications);
      const unread = newNotifications.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    });

    return () => {
      notificationService.unsubscribeFromNotifications(() => {});
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    setIsLoading(true);
    await notificationService.markAllAsRead();
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    await notificationService.deleteNotification(id);
  };

  const handleClearAll = async () => {
    setIsLoading(true);
    await notificationService.deleteAllNotifications();
    setIsLoading(false);
    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_alert':
        return <TrendingUp size={18} className="text-blue-600" />;
      case 'portfolio_alert':
        return <AlertCircle size={18} className="text-orange-600" />;
      case 'earnings_alert':
        return <Calendar size={18} className="text-purple-600" />;
      default:
        return <Bell size={18} className="text-slate-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500';
      case 'high':
        return 'border-l-4 border-orange-500';
      case 'normal':
        return 'border-l-4 border-blue-500';
      default:
        return 'border-l-4 border-slate-300';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={isLoading}
                    className="text-xs text-fin-teal hover:text-fin-teal-dark disabled:opacity-50"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <Bell size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      } ${getPriorityColor(notification.priority)}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-fin-teal hover:text-fin-teal-dark"
                                title="Mark as read"
                              >
                                <Check size={16} />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-500 dark:text-slate-500">
                              {formatTime(notification.created_at)}
                            </span>
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="text-xs text-red-600 hover:text-red-700 dark:hover:text-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={handleClearAll}
                  disabled={isLoading}
                  className="w-full text-sm text-red-600 hover:text-red-700 dark:hover:text-red-500 disabled:opacity-50"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
