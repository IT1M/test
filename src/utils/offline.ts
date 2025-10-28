// Offline support utilities for Saudi Mais Inventory System

interface OfflineAction {
  id: string;
  type: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface OfflineData {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
}

interface SyncResult {
  success: boolean;
  syncedActions: number;
  failedActions: number;
  errors: Array<{ actionId: string; error: string }>;
}

// IndexedDB wrapper for offline storage
class OfflineDB {
  private dbName = 'SaudiMaisOfflineDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('actions')) {
          const actionsStore = db.createObjectStore('actions', { keyPath: 'id' });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
          actionsStore.createIndex('priority', 'priority', { unique: false });
          actionsStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('data')) {
          const dataStore = db.createObjectStore('data', { keyPath: 'id' });
          dataStore.createIndex('type', 'type', { unique: false });
          dataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_log')) {
          const syncStore = db.createObjectStore('sync_log', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async addAction(action: OfflineAction): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const request = store.add(action);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getActions(): Promise<OfflineAction[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeAction(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateAction(action: OfflineAction): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const request = store.put(action);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async storeData(data: OfflineData): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readwrite');
      const store = transaction.objectStore('data');
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getData(type?: string): Promise<OfflineData[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['data'], 'readonly');
      const store = transaction.objectStore('data');
      
      let request: IDBRequest;
      if (type) {
        const index = store.index('type');
        request = index.getAll(type);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const results = request.result.filter((item: OfflineData) => {
          // Filter out expired data
          return !item.expiresAt || item.expiresAt > Date.now();
        });
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async logSync(result: SyncResult): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync_log'], 'readwrite');
      const store = transaction.objectStore('sync_log');
      const request = store.add({
        ...result,
        timestamp: Date.now(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpiredData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();
    const transaction = this.db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    const request = store.getAll();

    request.onsuccess = () => {
      const results = request.result;
      results.forEach((item: OfflineData) => {
        if (item.expiresAt && item.expiresAt < now) {
          store.delete(item.id);
        }
      });
    };
  }
}

// Offline manager class
export class OfflineManager {
  private db: OfflineDB;
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    this.db = new OfflineDB();
    this.init();
  }

  private async init(): Promise<void> {
    await this.db.init();
    
    // Set up network listeners
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      
      // Periodic sync when online
      setInterval(() => {
        if (this.isOnline && !this.syncInProgress) {
          this.syncPendingActions();
        }
      }, 30000); // Every 30 seconds
      
      // Cleanup expired data periodically
      setInterval(() => {
        this.db.clearExpiredData();
      }, 5 * 60 * 1000); // Every 5 minutes
    }
  }

  private handleOnline = () => {
    console.log('[Offline] Connection restored');
    this.isOnline = true;
    this.notifyListeners(true);
    this.syncPendingActions();
  };

  private handleOffline = () => {
    console.log('[Offline] Connection lost');
    this.isOnline = false;
    this.notifyListeners(false);
  };

  // Add network status listener
  addNetworkListener(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(online: boolean): void {
    this.listeners.forEach(callback => callback(online));
  }

  // Queue action for offline execution
  async queueAction(
    type: string,
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> {
    const action: OfflineAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      url,
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: priority === 'critical' ? 10 : priority === 'high' ? 5 : 3,
      priority,
    };

    await this.db.addAction(action);
    console.log(`[Offline] Queued action: ${type} (${action.id})`);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingActions();
    }

    return action.id;
  }

  // Store data for offline access
  async storeOfflineData(
    type: string,
    data: any,
    ttl?: number // Time to live in milliseconds
  ): Promise<void> {
    const offlineData: OfflineData = {
      id: `${type}-${Date.now()}`,
      type,
      data,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
    };

    await this.db.storeData(offlineData);
    console.log(`[Offline] Stored data: ${type}`);
  }

  // Get offline data
  async getOfflineData(type?: string): Promise<any[]> {
    const data = await this.db.getData(type);
    return data.map(item => item.data);
  }

  // Sync pending actions
  async syncPendingActions(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline) {
      return {
        success: false,
        syncedActions: 0,
        failedActions: 0,
        errors: [],
      };
    }

    this.syncInProgress = true;
    console.log('[Offline] Starting sync...');

    try {
      const actions = await this.db.getActions();
      
      // Sort by priority and timestamp
      const sortedActions = actions.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });

      let syncedActions = 0;
      let failedActions = 0;
      const errors: Array<{ actionId: string; error: string }> = [];

      for (const action of sortedActions) {
        try {
          const response = await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body,
          });

          if (response.ok) {
            await this.db.removeAction(action.id);
            syncedActions++;
            console.log(`[Offline] Synced action: ${action.type} (${action.id})`);
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          action.retryCount++;
          
          if (action.retryCount >= action.maxRetries) {
            await this.db.removeAction(action.id);
            failedActions++;
            errors.push({ actionId: action.id, error: errorMessage });
            console.error(`[Offline] Failed to sync action after ${action.maxRetries} retries: ${action.type} (${action.id})`);
          } else {
            await this.db.updateAction(action);
            console.warn(`[Offline] Retry ${action.retryCount}/${action.maxRetries} for action: ${action.type} (${action.id})`);
          }
        }
      }

      const result: SyncResult = {
        success: errors.length === 0,
        syncedActions,
        failedActions,
        errors,
      };

      await this.db.logSync(result);
      console.log(`[Offline] Sync completed: ${syncedActions} synced, ${failedActions} failed`);

      return result;
    } catch (error) {
      console.error('[Offline] Sync error:', error);
      return {
        success: false,
        syncedActions: 0,
        failedActions: 0,
        errors: [{ actionId: 'sync', error: error instanceof Error ? error.message : 'Unknown error' }],
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    pendingActions: number;
    lastSync?: number;
    syncInProgress: boolean;
    isOnline: boolean;
  }> {
    const actions = await this.db.getActions();
    
    return {
      pendingActions: actions.length,
      syncInProgress: this.syncInProgress,
      isOnline: this.isOnline,
    };
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    // This would require implementing a clear method in OfflineDB
    console.log('[Offline] Clearing offline data...');
  }

  // Check if online
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Destroy and cleanup
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.listeners.clear();
  }
}

// Global offline manager instance
let globalOfflineManager: OfflineManager | null = null;

export function getOfflineManager(): OfflineManager {
  if (!globalOfflineManager) {
    globalOfflineManager = new OfflineManager();
  }
  return globalOfflineManager;
}

// Offline-aware fetch wrapper
export async function offlineFetch(
  url: string,
  options: RequestInit & {
    offlineAction?: {
      type: string;
      priority?: 'low' | 'medium' | 'high' | 'critical';
    };
  } = {}
): Promise<Response> {
  const offlineManager = getOfflineManager();
  
  if (offlineManager.isOnlineStatus()) {
    try {
      return await fetch(url, options);
    } catch (error) {
      // Network error, queue for offline sync if configured
      if (options.offlineAction && options.method !== 'GET') {
        await offlineManager.queueAction(
          options.offlineAction.type,
          url,
          options.method || 'GET',
          (options.headers as Record<string, string>) || {},
          options.body,
          options.offlineAction.priority
        );
      }
      throw error;
    }
  } else {
    // Offline mode
    if (options.method === 'GET') {
      // Try to get from offline storage
      const offlineData = await offlineManager.getOfflineData(url);
      if (offlineData.length > 0) {
        return new Response(JSON.stringify(offlineData[0]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else if (options.offlineAction) {
      // Queue non-GET requests for later sync
      await offlineManager.queueAction(
        options.offlineAction.type,
        url,
        options.method || 'POST',
        (options.headers as Record<string, string>) || {},
        options.body,
        options.offlineAction.priority
      );
      
      // Return a success response for queued actions
      return new Response(JSON.stringify({ queued: true }), {
        status: 202, // Accepted
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    throw new Error('Network unavailable and no offline data available');
  }
}

// Offline data types for the inventory system
export const OfflineDataTypes = {
  INVENTORY_ITEMS: 'inventory_items',
  USER_SETTINGS: 'user_settings',
  CATEGORIES: 'categories',
  RECENT_SEARCHES: 'recent_searches',
  DRAFT_ENTRIES: 'draft_entries',
} as const;

// Offline action types
export const OfflineActionTypes = {
  CREATE_INVENTORY_ITEM: 'create_inventory_item',
  UPDATE_INVENTORY_ITEM: 'update_inventory_item',
  DELETE_INVENTORY_ITEM: 'delete_inventory_item',
  BULK_IMPORT: 'bulk_import',
  UPDATE_SETTINGS: 'update_settings',
  GENERATE_REPORT: 'generate_report',
} as const;

export default OfflineManager;