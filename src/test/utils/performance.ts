import { act } from '@testing-library/react';

export interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage?: number;
  reRenderCount: number;
}

export interface LoadTestOptions {
  iterations: number;
  concurrency?: number;
  dataSize?: number;
  updateFrequency?: number;
}

export interface LoadTestResult {
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  successRate: number;
  errorCount: number;
  totalRequests: number;
}

/**
 * Measures component render performance
 */
export function measureRenderPerformance<T>(
  renderFn: () => T,
  updateFn?: () => void,
  iterations: number = 10
): PerformanceMetrics {
  const renderTimes: number[] = [];
  const updateTimes: number[] = [];
  let reRenderCount = 0;

  // Measure initial render
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    renderTimes.push(endTime - startTime);
    reRenderCount++;

    // Measure update performance if update function provided
    if (updateFn) {
      const updateStartTime = performance.now();
      act(() => {
        updateFn();
      });
      const updateEndTime = performance.now();
      updateTimes.push(updateEndTime - updateStartTime);
      reRenderCount++;
    }
  }

  const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
  const averageUpdateTime = updateTimes.length > 0 
    ? updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length 
    : 0;

  return {
    renderTime: averageRenderTime,
    updateTime: averageUpdateTime,
    reRenderCount,
    memoryUsage: getMemoryUsage(),
  };
}

/**
 * Simulates high-frequency data updates for stress testing
 */
export async function simulateHighFrequencyUpdates(
  updateFn: (data: any) => void,
  options: {
    frequency: number; // updates per second
    duration: number; // duration in seconds
    dataGenerator: () => any;
  }
): Promise<PerformanceMetrics> {
  const { frequency, duration, dataGenerator } = options;
  const interval = 1000 / frequency;
  const totalUpdates = frequency * duration;
  
  const updateTimes: number[] = [];
  let completedUpdates = 0;

  return new Promise((resolve) => {
    const startTime = performance.now();
    
    const intervalId = setInterval(() => {
      const updateStartTime = performance.now();
      
      act(() => {
        updateFn(dataGenerator());
      });
      
      const updateEndTime = performance.now();
      updateTimes.push(updateEndTime - updateStartTime);
      completedUpdates++;

      if (completedUpdates >= totalUpdates) {
        clearInterval(intervalId);
        const endTime = performance.now();
        
        resolve({
          renderTime: endTime - startTime,
          updateTime: updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length,
          reRenderCount: completedUpdates,
          memoryUsage: getMemoryUsage(),
        });
      }
    }, interval);
  });
}

/**
 * Performs load testing on API endpoints or functions
 */
export async function performLoadTest(
  testFn: () => Promise<any>,
  options: LoadTestOptions
): Promise<LoadTestResult> {
  const { iterations, concurrency = 1 } = options;
  const results: Array<{ time: number; success: boolean; error?: Error }> = [];
  
  const batches = Math.ceil(iterations / concurrency);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchPromises: Promise<any>[] = [];
    const batchSize = Math.min(concurrency, iterations - batch * concurrency);
    
    for (let i = 0; i < batchSize; i++) {
      const promise = (async () => {
        const startTime = performance.now();
        try {
          await testFn();
          const endTime = performance.now();
          return { time: endTime - startTime, success: true };
        } catch (error) {
          const endTime = performance.now();
          return { 
            time: endTime - startTime, 
            success: false, 
            error: error as Error 
          };
        }
      })();
      
      batchPromises.push(promise);
    }
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  const successfulResults = results.filter(r => r.success);
  const responseTimes = successfulResults.map(r => r.time);
  
  return {
    averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
    maxResponseTime: Math.max(...responseTimes, 0),
    minResponseTime: Math.min(...responseTimes, Infinity) || 0,
    successRate: (successfulResults.length / results.length) * 100,
    errorCount: results.length - successfulResults.length,
    totalRequests: results.length,
  };
}

/**
 * Simulates concurrent user interactions
 */
export async function simulateConcurrentUsers(
  userActions: Array<() => Promise<void>>,
  concurrency: number = 5
): Promise<PerformanceMetrics> {
  const startTime = performance.now();
  const actionTimes: number[] = [];
  
  // Split actions into concurrent batches
  const batches: Array<Array<() => Promise<void>>> = [];
  for (let i = 0; i < userActions.length; i += concurrency) {
    batches.push(userActions.slice(i, i + concurrency));
  }
  
  for (const batch of batches) {
    const batchPromises = batch.map(async (action) => {
      const actionStartTime = performance.now();
      await action();
      const actionEndTime = performance.now();
      actionTimes.push(actionEndTime - actionStartTime);
    });
    
    await Promise.all(batchPromises);
  }
  
  const endTime = performance.now();
  
  return {
    renderTime: endTime - startTime,
    updateTime: actionTimes.reduce((a, b) => a + b, 0) / actionTimes.length,
    reRenderCount: userActions.length,
    memoryUsage: getMemoryUsage(),
  };
}

/**
 * Generates large datasets for testing
 */
export function generateLargeDataset(size: number, type: 'kpi' | 'sparkline' | 'grid'): any {
  switch (type) {
    case 'kpi':
      return Array.from({ length: size }, (_, i) => ({
        id: `kpi-${i}`,
        title: `KPI ${i}`,
        value: Math.floor(Math.random() * 10000),
        trend: {
          direction: Math.random() > 0.5 ? 'up' : 'down',
          percentage: Math.random() * 20,
          period: 'vs last period',
          isGood: Math.random() > 0.5,
        },
      }));
      
    case 'sparkline':
      return Array.from({ length: size }, () => Math.floor(Math.random() * 1000));
      
    case 'grid':
      return Array.from({ length: size }, (_, i) => ({
        id: `item-${i}`,
        component: `Component ${i}`,
        size: ['sm', 'md', 'lg', 'xl'][Math.floor(Math.random() * 4)],
        order: i,
      }));
      
    default:
      return [];
  }
}

/**
 * Measures memory usage (if available)
 */
function getMemoryUsage(): number | undefined {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return undefined;
}

/**
 * Creates a performance observer for monitoring
 */
export function createPerformanceObserver(
  callback: (entries: PerformanceEntry[]) => void
): PerformanceObserver | null {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries());
    });
    
    try {
      observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
      return observer;
    } catch (error) {
      console.warn('Performance observer not supported:', error);
      return null;
    }
  }
  return null;
}

/**
 * Utility to wait for next frame (useful for performance testing)
 */
export function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(() => resolve(), 16); // ~60fps fallback
    }
  });
}

/**
 * Measures component update frequency
 */
export function measureUpdateFrequency(
  component: any,
  duration: number = 5000
): Promise<{ updatesPerSecond: number; totalUpdates: number }> {
  return new Promise((resolve) => {
    let updateCount = 0;
    const startTime = Date.now();
    
    // Mock component update tracking
    const originalRender = component.render;
    if (originalRender) {
      component.render = function(...args: any[]) {
        updateCount++;
        return originalRender.apply(this, args);
      };
    }
    
    setTimeout(() => {
      const endTime = Date.now();
      const actualDuration = (endTime - startTime) / 1000;
      
      // Restore original render
      if (originalRender) {
        component.render = originalRender;
      }
      
      resolve({
        updatesPerSecond: updateCount / actualDuration,
        totalUpdates: updateCount,
      });
    }, duration);
  });
}

/**
 * Benchmarks different implementations
 */
export async function benchmark(
  implementations: Record<string, () => Promise<any> | any>,
  iterations: number = 100
): Promise<Record<string, PerformanceMetrics>> {
  const results: Record<string, PerformanceMetrics> = {};
  
  for (const [name, impl] of Object.entries(implementations)) {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await impl();
      const endTime = performance.now();
      times.push(endTime - startTime);
    }
    
    results[name] = {
      renderTime: times.reduce((a, b) => a + b, 0) / times.length,
      updateTime: 0,
      reRenderCount: iterations,
      memoryUsage: getMemoryUsage(),
    };
  }
  
  return results;
}