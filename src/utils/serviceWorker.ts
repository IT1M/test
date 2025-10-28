// Service Worker Registration and Management Utilities

interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

// Check if service workers are supported
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

// Register service worker with enhanced error handling
export async function registerServiceWorker(config: ServiceWorkerConfig = {}): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn('[SW] Service workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // Always check for updates
    });

    console.log('[SW] Service worker registered successfully:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      console.log('[SW] New service worker found, installing...');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            console.log('[SW] New content is available; please refresh.');
            config.onUpdate?.(registration);
          } else {
            // Content is cached for the first time
            console.log('[SW] Content is cached for offline use.');
            config.onSuccess?.(registration);
          }
        }
      });
    });

    // Check for existing service worker
    if (registration.active) {
      config.onSuccess?.(registration);
    }

    return registration;
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error);
    config.onError?.(error as Error);
    return null;
  }
}

// Unregister service worker
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      console.log('[SW] Service worker unregistered:', result);
      return result;
    }
    return false;
  } catch (error) {
    console.error('[SW] Service worker unregistration failed:', error);
    return false;
  }
}

// Update service worker
export async function updateServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      console.log('[SW] Service worker update triggered');
      return registration;
    }
    return null;
  } catch (error) {
    console.error('[SW] Service worker update failed:', error);
    return null;
  }
}

// Skip waiting and activate new service worker immediately
export async function skipWaitingAndActivate(): Promise<void> {
  if (!isServiceWorkerSupported()) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.waiting) {
    // Send message to waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Listen for controlling change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] New service worker activated, reloading page...');
      window.location.reload();
    });
  }
}

// Cache management utilities
export class CacheManager {
  static async clearAllCaches(): Promise<void> {
    if (!('caches' in window)) {
      console.warn('[Cache] Cache API not supported');
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('[Cache] All caches cleared');
    } catch (error) {
      console.error('[Cache] Failed to clear caches:', error);
    }
  }

  static async getCacheSize(): Promise<number> {
    if (!('caches' in window) || !('storage' in navigator) || !('estimate' in navigator.storage)) {
      return 0;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    } catch (error) {
      console.error('[Cache] Failed to get cache size:', error);
      return 0;
    }
  }

  static async clearSpecificCache(cacheName: string): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const result = await caches.delete(cacheName);
      console.log(`[Cache] Cache "${cacheName}" cleared:`, result);
      return result;
    } catch (error) {
      console.error(`[Cache] Failed to clear cache "${cacheName}":`, error);
      return false;
    }
  }

  static async preloadCriticalResources(urls: string[]): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cache = await caches.open('saudi-mais-critical-v1');
      await Promise.all(
        urls.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              console.log(`[Cache] Preloaded: ${url}`);
            }
          } catch (error) {
            console.warn(`[Cache] Failed to preload: ${url}`, error);
          }
        })
      );
    } catch (error) {
      console.error('[Cache] Failed to preload critical resources:', error);
    }
  }
}

// Offline storage utilities
export class OfflineStorage {
  private static readonly DB_NAME = 'SaudiMaisOfflineDB';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'pendingActions';

  static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  static async addPendingAction(action: {
    type: string;
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    timestamp: number;
  }): Promise<number> {
    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.add(action);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  static async getPendingActions(): Promise<any[]> {
    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readonly');
    const store = transaction.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async removePendingAction(id: number): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  static async clearAllPendingActions(): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(this.STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Network status utilities
export class NetworkManager {
  private static listeners: Set<(online: boolean) => void> = new Set();

  static isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  static addListener(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    
    // Add event listeners if this is the first listener
    if (this.listeners.size === 1) {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }

    // Return cleanup function
    return () => {
      this.listeners.delete(callback);
      
      // Remove event listeners if no more listeners
      if (this.listeners.size === 0) {
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
      }
    };
  }

  private static handleOnline = () => {
    console.log('[Network] Connection restored');
    this.listeners.forEach(callback => callback(true));
    
    // Trigger background sync when back online
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return registration.sync.register('inventory-sync');
      }).catch(error => {
        console.error('[Network] Background sync registration failed:', error);
      });
    }
  };

  private static handleOffline = () => {
    console.log('[Network] Connection lost');
    this.listeners.forEach(callback => callback(false));
  };
}

// Performance monitoring utilities
export class PerformanceMonitor {
  static measurePageLoad(): void {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return;
    }

    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        const metrics = {
          dns: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcp: perfData.connectEnd - perfData.connectStart,
          request: perfData.responseStart - perfData.requestStart,
          response: perfData.responseEnd - perfData.responseStart,
          dom: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          load: perfData.loadEventEnd - perfData.loadEventStart,
          total: perfData.loadEventEnd - perfData.navigationStart,
        };

        console.log('[Performance] Page load metrics:', metrics);
        
        // Send metrics to analytics if needed
        // analytics.track('page_load_performance', metrics);
      }, 0);
    });
  }

  static measureResourceLoading(): void {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          
          // Log slow resources
          if (resource.duration > 1000) {
            console.warn('[Performance] Slow resource detected:', {
              name: resource.name,
              duration: resource.duration,
              size: resource.transferSize,
            });
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }
}

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  updateServiceWorker,
  skipWaitingAndActivate,
  CacheManager,
  OfflineStorage,
  NetworkManager,
  PerformanceMonitor,
};