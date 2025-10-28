/**
 * Performance Monitoring and Optimization Utilities
 * Provides tools for monitoring and optimizing system performance
 */

export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  timestamp: number;
}

export interface PerformanceThresholds {
  pageLoad: number; // ms
  apiResponse: number; // ms
  render: number; // ms
  memory: number; // MB
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  pageLoad: 2000, // 2 seconds
  apiResponse: 500, // 500ms
  render: 100, // 100ms
  memory: 100, // 100MB
};

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;
  private observers: PerformanceObserver[] = [];

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return;

    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric({
                pageLoadTime: navEntry.loadEventEnd - navEntry.fetchStart,
                apiResponseTime: 0,
                renderTime: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
                memoryUsage: this.getMemoryUsage(),
                timestamp: Date.now(),
              });
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (e) {
        console.warn('Navigation timing observer not supported');
      }

      // Monitor resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              if (resourceEntry.initiatorType === 'fetch' || resourceEntry.initiatorType === 'xmlhttprequest') {
                const responseTime = resourceEntry.responseEnd - resourceEntry.requestStart;
                if (responseTime > this.thresholds.apiResponse) {
                  console.warn(`Slow API request detected: ${resourceEntry.name} took ${responseTime}ms`);
                }
              }
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.warn('Resource timing observer not supported');
      }

      // Monitor long tasks
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.warn(`Long task detected: ${entry.duration}ms`);
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn('Long task observer not supported');
      }
    }
  }

  private getMemoryUsage(): number {
    if (typeof window === 'undefined') return 0;
    if ('memory' in performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return 0;
  }

  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Check thresholds
    this.checkThresholds(metric);
  }

  private checkThresholds(metric: PerformanceMetrics) {
    if (metric.pageLoadTime > this.thresholds.pageLoad) {
      console.warn(`Page load time exceeded threshold: ${metric.pageLoadTime}ms > ${this.thresholds.pageLoad}ms`);
    }
    if (metric.apiResponseTime > this.thresholds.apiResponse) {
      console.warn(`API response time exceeded threshold: ${metric.apiResponseTime}ms > ${this.thresholds.apiResponse}ms`);
    }
    if (metric.renderTime > this.thresholds.render) {
      console.warn(`Render time exceeded threshold: ${metric.renderTime}ms > ${this.thresholds.render}ms`);
    }
    if (metric.memoryUsage > this.thresholds.memory) {
      console.warn(`Memory usage exceeded threshold: ${metric.memoryUsage}MB > ${this.thresholds.memory}MB`);
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {};

    const sum = this.metrics.reduce(
      (acc, metric) => ({
        pageLoadTime: acc.pageLoadTime + metric.pageLoadTime,
        apiResponseTime: acc.apiResponseTime + metric.apiResponseTime,
        renderTime: acc.renderTime + metric.renderTime,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
      }),
      { pageLoadTime: 0, apiResponseTime: 0, renderTime: 0, memoryUsage: 0 }
    );

    const count = this.metrics.length;
    return {
      pageLoadTime: sum.pageLoadTime / count,
      apiResponseTime: sum.apiResponseTime / count,
      renderTime: sum.renderTime / count,
      memoryUsage: sum.memoryUsage / count,
    };
  }

  clearMetrics() {
    this.metrics = [];
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }
}

// Singleton instance
let performanceMonitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(thresholds?: Partial<PerformanceThresholds>): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor(thresholds);
  }
  return performanceMonitorInstance;
}

/**
 * Measure execution time of a function
 */
export async function measureExecutionTime<T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
  
  return { result, duration };
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize function results for performance
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

/**
 * Detect memory leaks
 */
export function detectMemoryLeaks(interval: number = 5000): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const measurements: number[] = [];
  
  const intervalId = setInterval(() => {
    const memory = (performance as any).memory;
    if (memory) {
      const usedMemory = memory.usedJSHeapSize / 1024 / 1024;
      measurements.push(usedMemory);
      
      // Keep only last 10 measurements
      if (measurements.length > 10) {
        measurements.shift();
      }
      
      // Check for consistent memory growth
      if (measurements.length === 10) {
        const trend = measurements[9] - measurements[0];
        if (trend > 50) { // 50MB growth
          console.warn(`Potential memory leak detected: ${trend.toFixed(2)}MB growth over ${(interval * 10) / 1000}s`);
        }
      }
    }
  }, interval);
  
  return () => clearInterval(intervalId);
}

/**
 * Optimize images by lazy loading
 */
export function setupLazyLoading() {
  if (typeof window === 'undefined') return;
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Report Web Vitals
 */
export function reportWebVitals(onPerfEntry?: (metric: any) => void) {
  if (onPerfEntry && typeof window !== 'undefined') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    }).catch(() => {
      // web-vitals not available
    });
  }
}
