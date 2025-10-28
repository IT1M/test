"use client";

import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Notification {
  id: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notifications?limit=10");
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.meta.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Fetch notifications on mount and when panel opens
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showPanel) {
      fetchNotifications();
    }
  }, [showPanel]);

  // Get notification type styling
  const getTypeStyles = (type: Notification["type"]) => {
    switch (type) {
      case "SUCCESS":
        return "bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400";
      case "WARNING":
        return "bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400";
      case "ERROR":
        return "bg-danger-100 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400";
      default:
        return "bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400";
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: locale === "ar" ? ar : enUS,
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-secondary-700 dark:text-secondary-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700"
                >
                  <X className="h-4 w-4 text-secondary-500" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-secondary-500">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-secondary-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors cursor-pointer ${
                        !notification.isRead ? "bg-primary-50/50 dark:bg-primary-900/10" : ""
                      }`}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                            !notification.isRead ? "bg-primary-600" : "bg-transparent"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                              {notification.title}
                            </h4>
                            <span
                              className={`flex-shrink-0 text-xs px-2 py-0.5 rounded ${getTypeStyles(
                                notification.type
                              )}`}
                            >
                              {notification.type}
                            </span>
                          </div>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-secondary-500">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                              >
                                <Check className="h-3 w-3" />
                                Mark read
                              </button>
                            )}
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
              <div className="p-3 border-t border-secondary-200 dark:border-secondary-700 text-center">
                <button
                  onClick={() => {
                    setShowPanel(false);
                    // Navigate to notifications page if it exists
                  }}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
