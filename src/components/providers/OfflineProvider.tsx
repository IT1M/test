"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getOfflineManager, OfflineManager, OfflineDataTypes, OfflineActionTypes } from '@/utils/offline';

interface OfflineContextType {
  isOnline: boolean;
  syncStatus: {
    pendingActions: number;
    syncInProgress: boolean;
    lastSync?: number;
  };
  actions: {
    queueAction: (
      type: string,
      url: string,
      method: string,
      headers: Record<string, string>,
      body?: any,
      priority?: 'low' | 'medium' | 'high' | 'critical'
    ) => Promise<string>;
    storeOfflineData: (type: string, data: any, ttl?: number) => Promise<void>;
    getOfflineData: (type?: string) => Promise<any[]>;
    syncNow: () => Promise<void>;
    clearOfflineData: () => Promise<void>;
  };
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [offlineManager] = useState(() => getOfflineManager());
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState({
    pendingActions: 0,
    syncInProgress: false,
    lastSync: undefined as number | undefined,
  });

  // Initialize offline manager and set up listeners
  useEffect(() => {
    // Set initial online status
    setIsOnline(offlineManager.isOnlineStatus());

    // Listen for network status changes
    const removeNetworkListener = offlineManager.addNetworkListener((online) => {
      setIsOnline(online);
      
      if (online) {
        // When back online, update sync status
        updateSyncStatus();
      }
    });

    // Update sync status periodically
    const updateSyncStatus = async () => {
      try {
        const status = await offlineManager.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('[OfflineProvider] Failed to get sync status:', error);
      }
    };

    // Initial sync status
    updateSyncStatus();

    // Update sync status every 10 seconds
    const statusInterval = setInterval(updateSyncStatus, 10000);

    return () => {
      removeNetworkListener();
      clearInterval(statusInterval);
    };
  }, [offlineManager]);

  // Preload critical data for offline use
  useEffect(() => {
    const preloadOfflineData = async () => {
      if (!isOnline) return;

      try {
        // Preload user settings
        const settingsResponse = await fetch('/api/settings');
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          await offlineManager.storeOfflineData(
            OfflineDataTypes.USER_SETTINGS,
            settings,
            24 * 60 * 60 * 1000 // 24 hours TTL
          );
        }

        // Preload categories
        const categoriesResponse = await fetch('/api/inventory/categories');
        if (categoriesResponse.ok) {
          const categories = await categoriesResponse.json();
          await offlineManager.storeOfflineData(
            OfflineDataTypes.CATEGORIES,
            categories,
            12 * 60 * 60 * 1000 // 12 hours TTL
          );
        }

        // Preload recent inventory items
        const inventoryResponse = await fetch('/api/inventory?limit=50&recent=true');
        if (inventoryResponse.ok) {
          const inventory = await inventoryResponse.json();
          await offlineManager.storeOfflineData(
            OfflineDataTypes.INVENTORY_ITEMS,
            inventory,
            2 * 60 * 60 * 1000 // 2 hours TTL
          );
        }

        console.log('[OfflineProvider] Critical data preloaded for offline use');
      } catch (error) {
        console.error('[OfflineProvider] Failed to preload offline data:', error);
      }
    };

    // Preload data when online
    if (isOnline) {
      preloadOfflineData();
    }
  }, [isOnline, offlineManager]);

  const queueAction = async (
    type: string,
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> => {
    const actionId = await offlineManager.queueAction(type, url, method, headers, body, priority);
    
    // Update sync status after queuing
    const status = await offlineManager.getSyncStatus();
    setSyncStatus(status);
    
    return actionId;
  };

  const storeOfflineData = async (type: string, data: any, ttl?: number): Promise<void> => {
    await offlineManager.storeOfflineData(type, data, ttl);
  };

  const getOfflineData = async (type?: string): Promise<any[]> => {
    return offlineManager.getOfflineData(type);
  };

  const syncNow = async (): Promise<void> => {
    try {
      setSyncStatus(prev => ({ ...prev, syncInProgress: true }));
      
      const result = await offlineManager.syncPendingActions();
      
      // Update sync status
      const status = await offlineManager.getSyncStatus();
      setSyncStatus({
        ...status,
        lastSync: Date.now(),
      });

      if (!result.success) {
        console.warn('[OfflineProvider] Sync completed with errors:', result.errors);
      }
    } catch (error) {
      console.error('[OfflineProvider] Sync failed:', error);
    }
  };

  const clearOfflineData = async (): Promise<void> => {
    await offlineManager.clearOfflineData();
    
    // Update sync status
    const status = await offlineManager.getSyncStatus();
    setSyncStatus(status);
  };

  const contextValue: OfflineContextType = {
    isOnline,
    syncStatus,
    actions: {
      queueAction,
      storeOfflineData,
      getOfflineData,
      syncNow,
      clearOfflineData,
    },
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
}

// Hook for offline-aware API calls
export function useOfflineAPI() {
  const { isOnline, actions } = useOffline();

  const offlinePost = async (
    url: string,
    data: any,
    options: {
      actionType: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      headers?: Record<string, string>;
    }
  ) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (isOnline) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        // Queue for offline sync
        await actions.queueAction(
          options.actionType,
          url,
          'POST',
          headers,
          data,
          options.priority
        );
        throw error;
      }
    } else {
      // Queue for offline sync
      const actionId = await actions.queueAction(
        options.actionType,
        url,
        'POST',
        headers,
        data,
        options.priority
      );

      return { queued: true, actionId };
    }
  };

  const offlinePut = async (
    url: string,
    data: any,
    options: {
      actionType: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      headers?: Record<string, string>;
    }
  ) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (isOnline) {
      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        // Queue for offline sync
        await actions.queueAction(
          options.actionType,
          url,
          'PUT',
          headers,
          data,
          options.priority
        );
        throw error;
      }
    } else {
      // Queue for offline sync
      const actionId = await actions.queueAction(
        options.actionType,
        url,
        'PUT',
        headers,
        data,
        options.priority
      );

      return { queued: true, actionId };
    }
  };

  const offlineDelete = async (
    url: string,
    options: {
      actionType: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      headers?: Record<string, string>;
    }
  ) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (isOnline) {
      try {
        const response = await fetch(url, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.status === 204 ? {} : await response.json();
      } catch (error) {
        // Queue for offline sync
        await actions.queueAction(
          options.actionType,
          url,
          'DELETE',
          headers,
          undefined,
          options.priority
        );
        throw error;
      }
    } else {
      // Queue for offline sync
      const actionId = await actions.queueAction(
        options.actionType,
        url,
        'DELETE',
        headers,
        undefined,
        options.priority
      );

      return { queued: true, actionId };
    }
  };

  const offlineGet = async (url: string, fallbackType?: string) => {
    if (isOnline) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        // Fallback to offline data if available
        if (fallbackType) {
          const offlineData = await actions.getOfflineData(fallbackType);
          if (offlineData.length > 0) {
            return offlineData[0];
          }
        }
        throw error;
      }
    } else {
      // Get from offline storage
      if (fallbackType) {
        const offlineData = await actions.getOfflineData(fallbackType);
        if (offlineData.length > 0) {
          return offlineData[0];
        }
      }
      throw new Error('No offline data available');
    }
  };

  return {
    offlinePost,
    offlinePut,
    offlineDelete,
    offlineGet,
    isOnline,
  };
}

// Hook for draft management (offline form data)
export function useDraftManager(formType: string) {
  const { actions } = useOffline();

  const saveDraft = async (data: any) => {
    const draftId = `draft_${formType}_${Date.now()}`;
    await actions.storeOfflineData(
      OfflineDataTypes.DRAFT_ENTRIES,
      { id: draftId, type: formType, data, timestamp: Date.now() },
      7 * 24 * 60 * 60 * 1000 // 7 days TTL
    );
    return draftId;
  };

  const getDrafts = async () => {
    const drafts = await actions.getOfflineData(OfflineDataTypes.DRAFT_ENTRIES);
    return drafts.filter(draft => draft.type === formType);
  };

  const deleteDraft = async (draftId: string) => {
    // This would require implementing a delete by ID method
    // For now, we'll just log it
    console.log(`[DraftManager] Delete draft: ${draftId}`);
  };

  return {
    saveDraft,
    getDrafts,
    deleteDraft,
  };
}

export default OfflineProvider;