// Notification Store - Real-time notifications with priority queue
// Requirements: 4.10

import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  duration?: number; // Auto-dismiss duration in milliseconds (null = no auto-dismiss)
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface NotificationState {
  notifications: Notification[];
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  getNotificationsByPriority: (priority: NotificationPriority) => Notification[];
  getNotificationsByType: (type: NotificationType) => Notification[];
  getUnreadCount: () => number;
}

// Default durations by type (in milliseconds)
const DEFAULT_DURATIONS: Record<NotificationType, number> = {
  success: 3000,
  info: 5000,
  warning: 7000,
  error: 10000,
};

// Priority order for sorting (higher number = higher priority)
const PRIORITY_ORDER: Record<NotificationPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration !== undefined 
        ? notification.duration 
        : DEFAULT_DURATIONS[notification.type],
      dismissible: notification.dismissible !== undefined ? notification.dismissible : true,
    };

    // Add notification to the queue, sorted by priority
    set((state) => {
      const updatedNotifications = [...state.notifications, newNotification].sort(
        (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]
      );
      return { notifications: updatedNotifications };
    });

    // Auto-dismiss if duration is set
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  getNotificationsByPriority: (priority) => {
    return get().notifications.filter((n) => n.priority === priority);
  },

  getNotificationsByType: (type) => {
    return get().notifications.filter((n) => n.type === type);
  },

  getUnreadCount: () => {
    return get().notifications.length;
  },
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Show a success notification
 */
export const showSuccess = (
  title: string,
  message: string,
  options?: Partial<Omit<Notification, 'id' | 'timestamp' | 'type'>>
) => {
  return useNotificationStore.getState().addNotification({
    type: 'success',
    priority: options?.priority || 'low',
    title,
    message,
    ...options,
  });
};

/**
 * Show an error notification
 */
export const showError = (
  title: string,
  message: string,
  options?: Partial<Omit<Notification, 'id' | 'timestamp' | 'type'>>
) => {
  return useNotificationStore.getState().addNotification({
    type: 'error',
    priority: options?.priority || 'high',
    title,
    message,
    ...options,
  });
};

/**
 * Show a warning notification
 */
export const showWarning = (
  title: string,
  message: string,
  options?: Partial<Omit<Notification, 'id' | 'timestamp' | 'type'>>
) => {
  return useNotificationStore.getState().addNotification({
    type: 'warning',
    priority: options?.priority || 'medium',
    title,
    message,
    ...options,
  });
};

/**
 * Show an info notification
 */
export const showInfo = (
  title: string,
  message: string,
  options?: Partial<Omit<Notification, 'id' | 'timestamp' | 'type'>>
) => {
  return useNotificationStore.getState().addNotification({
    type: 'info',
    priority: options?.priority || 'low',
    title,
    message,
    ...options,
  });
};

/**
 * Show a critical alert (high priority, no auto-dismiss)
 */
export const showCriticalAlert = (
  title: string,
  message: string,
  action?: { label: string; onClick: () => void }
) => {
  return useNotificationStore.getState().addNotification({
    type: 'error',
    priority: 'critical',
    title,
    message,
    duration: 0, // No auto-dismiss
    action,
    dismissible: true,
  });
};

/**
 * Show a business alert (for order notifications, low stock, etc.)
 */
export const showBusinessAlert = (
  type: NotificationType,
  title: string,
  message: string,
  priority: NotificationPriority = 'medium',
  action?: { label: string; onClick: () => void }
) => {
  return useNotificationStore.getState().addNotification({
    type,
    priority,
    title,
    message,
    action,
  });
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = () => {
  useNotificationStore.getState().clearAll();
};

/**
 * Remove a specific notification
 */
export const dismissNotification = (id: string) => {
  useNotificationStore.getState().removeNotification(id);
};

// ============================================================================
// BUSINESS-SPECIFIC NOTIFICATION HELPERS
// ============================================================================

/**
 * Show new order notification
 */
export const notifyNewOrder = (orderId: string, customerName: string, amount: number) => {
  return showBusinessAlert(
    'info',
    'New Order Received',
    `Order ${orderId} from ${customerName} - $${amount.toFixed(2)}`,
    'medium',
    {
      label: 'View Order',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.location.href = `/orders/${orderId}`;
        }
      },
    }
  );
};

/**
 * Show low stock alert
 */
export const notifyLowStock = (productName: string, quantity: number, productId: string) => {
  return showBusinessAlert(
    'warning',
    'Low Stock Alert',
    `${productName} is running low (${quantity} units remaining)`,
    'high',
    {
      label: 'Restock',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.location.href = `/inventory?product=${productId}`;
        }
      },
    }
  );
};

/**
 * Show product expiry alert
 */
export const notifyProductExpiry = (productName: string, expiryDate: Date, productId: string) => {
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  return showBusinessAlert(
    'warning',
    'Product Expiring Soon',
    `${productName} expires in ${daysUntilExpiry} days`,
    daysUntilExpiry <= 30 ? 'high' : 'medium',
    {
      label: 'View Product',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.location.href = `/products/${productId}`;
        }
      },
    }
  );
};

/**
 * Show payment received notification
 */
export const notifyPaymentReceived = (
  invoiceId: string,
  customerName: string,
  amount: number
) => {
  return showBusinessAlert(
    'success',
    'Payment Received',
    `Payment of $${amount.toFixed(2)} received from ${customerName}`,
    'low',
    {
      label: 'View Invoice',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.location.href = `/sales/invoices/${invoiceId}`;
        }
      },
    }
  );
};

/**
 * Show overdue payment alert
 */
export const notifyOverduePayment = (
  invoiceId: string,
  customerName: string,
  amount: number,
  daysOverdue: number
) => {
  return showBusinessAlert(
    'error',
    'Overdue Payment',
    `Invoice from ${customerName} is ${daysOverdue} days overdue - $${amount.toFixed(2)}`,
    'high',
    {
      label: 'Send Reminder',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.location.href = `/sales/invoices/${invoiceId}`;
        }
      },
    }
  );
};

/**
 * Show order status change notification
 */
export const notifyOrderStatusChange = (
  orderId: string,
  newStatus: string,
  customerName: string
) => {
  return showBusinessAlert(
    'info',
    'Order Status Updated',
    `Order ${orderId} for ${customerName} is now ${newStatus}`,
    'low',
    {
      label: 'View Order',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.location.href = `/orders/${orderId}`;
        }
      },
    }
  );
};

/**
 * Show system error notification
 */
export const notifySystemError = (errorMessage: string, details?: string) => {
  return showCriticalAlert(
    'System Error',
    details || errorMessage,
    {
      label: 'View Logs',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/logs';
        }
      },
    }
  );
};

/**
 * Show data sync notification
 */
export const notifyDataSync = (status: 'syncing' | 'synced' | 'failed', details?: string) => {
  const messages = {
    syncing: { type: 'info' as NotificationType, title: 'Syncing Data', message: 'Synchronizing data...' },
    synced: { type: 'success' as NotificationType, title: 'Data Synced', message: 'All data synchronized successfully' },
    failed: { type: 'error' as NotificationType, title: 'Sync Failed', message: details || 'Failed to synchronize data' },
  };

  const config = messages[status];
  return showBusinessAlert(config.type, config.title, config.message, status === 'failed' ? 'high' : 'low');
};
