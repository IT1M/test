"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  registerServiceWorker, 
  CacheManager, 
  NetworkManager, 
  PerformanceMonitor,
  useComponentPreloading 
} from '@/utils/serviceWorker';

interface PerformanceContextType {
  isOnline: boolean;
  cacheSize: number;
  serviceWorkerStatus: 'loading' | 'registered' | 'error' | 'unsupported';
  performanceMetrics: {
    pageLoadTime?: number;
    resourceCount?: number;
    cacheHitRate?: number;
  };
  actions: {
    clearCache: () => Promise<void>;
    updateServiceWorker: () => Promise<void>;
    preloadComponents: (type: 'dashboard' | 'data' | 'admin' | 'reports') => void;
  };
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

interface PerformanceProviderProps {
  children: ReactNode;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [cacheSize, setCacheSize] = useState(0);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<'loading' | 'registered' | 'error' | 'unsupported'>('loading');
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    pageLoadTime?: number;
    resourceCount?: number;
    cacheHitRate?: number;
  }>({});

  const {
    preloadDashboardComponents,
    preloadDataComponents,
    preloadAdminComponents,
    preloadReportComponents,
  } = useComponentPreloading();

  // Initialize performance monitoring and service worker
  useEffect(() => {
    // Start performance monitoring
    PerformanceMonitor.measurePageLoad();
    PerformanceMonitor.measureResourceLoading();

    // Register service worker
    registerServiceWorker({
      onSuccess: (registration) => {
        console.log('[Performance] Service worker registered successfully');
        setServiceWorkerStatus('registered');
      },
      onError: (error) => {
        console.error('[Performance] Service worker registration failed:', error);
        setServiceWorkerStatus('error');
      },
      onUpdate: (registration) => {
        console.log('[Performance] Service worker update available');
        // Could show update notification to user
      },
    }).then((registration) => {
      if (!registration) {
        setServiceWorkerStatus('unsupported');
      }
    });

    // Set up network monitoring
    const removeNetworkListener = NetworkManager.addListener((online) => {
      setIsOnline(online);
      console.log('[Performance] Network status changed:', online ? 'online' : 'offline');
    });

    // Initial network status
    setIsOnline(NetworkManager.isOnline());

    // Get initial cache size
    updateCacheSize();

    // Set up performance metrics collection
    const metricsInterval = setInterval(() => {
      collectPerformanceMetrics();
    }, 30000); // Every 30 seconds

    return () => {
      removeNetworkListener();
      clearInterval(metricsInterval);
    };
  }, []);

  const updateCacheSize = async () => {
    try {
      const size = await CacheManager.getCacheSize();
      setCacheSize(size);
    } catch (error) {
      console.error('[Performance] Failed to get cache size:', error);
    }
  };

  const collectPerformanceMetrics = () => {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return;
    }

    try {
      // Get navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const pageLoadTime = navigation.loadEventEnd - navigation.navigationStart;
        
        setPerformanceMetrics(prev => ({
          ...prev,
          pageLoadTime,
        }));
      }

      // Get resource count
      const resources = performance.getEntriesByType('resource');
      setPerformanceMetrics(prev => ({
        ...prev,
        resourceCount: resources.length,
      }));

      // Calculate cache hit rate (simplified)
      const cachedResources = resources.filter(resource => 
        (resource as PerformanceResourceTiming).transferSize === 0
      );
      const cacheHitRate = resources.length > 0 ? 
        (cachedResources.length / resources.length) * 100 : 0;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        cacheHitRate,
      }));
    } catch (error) {
      console.error('[Performance] Failed to collect metrics:', error);
    }
  };

  const clearCache = async () => {
    try {
      await CacheManager.clearAllCaches();
      await updateCacheSize();
      console.log('[Performance] All caches cleared');
    } catch (error) {
      console.error('[Performance] Failed to clear cache:', error);
      throw error;
    }
  };

  const updateServiceWorker = async () => {
    try {
      const { updateServiceWorker } = await import('@/utils/serviceWorker');
      await updateServiceWorker();
      console.log('[Performance] Service worker update triggered');
    } catch (error) {
      console.error('[Performance] Failed to update service worker:', error);
      throw error;
    }
  };

  const preloadComponents = (type: 'dashboard' | 'data' | 'admin' | 'reports') => {
    try {
      switch (type) {
        case 'dashboard':
          preloadDashboardComponents();
          break;
        case 'data':
          preloadDataComponents();
          break;
        case 'admin':
          preloadAdminComponents();
          break;
        case 'reports':
          preloadReportComponents();
          break;
      }
      console.log(`[Performance] Preloading ${type} components`);
    } catch (error) {
      console.error(`[Performance] Failed to preload ${type} components:`, error);
    }
  };

  const contextValue: PerformanceContextType = {
    isOnline,
    cacheSize,
    serviceWorkerStatus,
    performanceMetrics,
    actions: {
      clearCache,
      updateServiceWorker,
      preloadComponents,
    },
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  const { performanceMetrics, isOnline, serviceWorkerStatus } = usePerformance();

  const getPerformanceScore = (): number => {
    let score = 100;
    
    // Deduct points for slow page load
    if (performanceMetrics.pageLoadTime) {
      if (performanceMetrics.pageLoadTime > 3000) score -= 30;
      else if (performanceMetrics.pageLoadTime > 2000) score -= 20;
      else if (performanceMetrics.pageLoadTime > 1000) score -= 10;
    }

    // Deduct points for low cache hit rate
    if (performanceMetrics.cacheHitRate !== undefined) {
      if (performanceMetrics.cacheHitRate < 30) score -= 20;
      else if (performanceMetrics.cacheHitRate < 50) score -= 10;
    }

    // Deduct points for being offline
    if (!isOnline) score -= 15;

    // Deduct points for service worker issues
    if (serviceWorkerStatus === 'error') score -= 10;
    else if (serviceWorkerStatus === 'unsupported') score -= 5;

    return Math.max(0, score);
  };

  const getPerformanceGrade = (): 'A' | 'B' | 'C' | 'D' | 'F' => {
    const score = getPerformanceScore();
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const getRecommendations = (): string[] => {
    const recommendations: string[] = [];
    
    if (performanceMetrics.pageLoadTime && performanceMetrics.pageLoadTime > 2000) {
      recommendations.push('Consider optimizing images and reducing bundle size');
    }
    
    if (performanceMetrics.cacheHitRate !== undefined && performanceMetrics.cacheHitRate < 50) {
      recommendations.push('Enable more aggressive caching for better performance');
    }
    
    if (serviceWorkerStatus === 'error') {
      recommendations.push('Fix service worker issues for offline support');
    }
    
    if (!isOnline) {
      recommendations.push('You are currently offline. Some features may be limited');
    }

    return recommendations;
  };

  return {
    score: getPerformanceScore(),
    grade: getPerformanceGrade(),
    recommendations: getRecommendations(),
    metrics: performanceMetrics,
  };
}

export default PerformanceProvider;