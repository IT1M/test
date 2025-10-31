// Performance Monitoring Utilities
// Tracks page load times, API call durations, and logs metrics to SystemLogs

import { db } from '@/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Performance metric types
 */
export type PerformanceMetricType = 
  | 'page_load'
  | 'api_call'
  | 'database_query'
  | 'component_render'
  | 'file_upload'
  | 'export_operation';

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  id: string;
  type: PerformanceMetricType;
  name: string;
  duration: number; // milliseconds
  timestamp: Date;
  metadata?: Record<string, any>;
  userId?: string;
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  type: PerformanceMetricType;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  totalDuration: number;
}

/**
 * Performance monitoring class
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  
  /**
   * Start timing an operation
   */
  startTimer(operationId: string): void {
    this.timers.set(operationId, performance.now());
  }
  
  /**
   * End timing an operation and record the metric
   */
  async endTimer(
    operationId: string,
    type: PerformanceMetricType,
    name: string,
    metadata?: Record<string, any>,
    userId?: string
  ): Promise<number> {
    const startTime = this.timers.get(operationId);
    
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationId}`);
      return 0;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Remove timer
    this.timers.delete(operationId);
    
    // Record metric
    const metric: PerformanceMetric = {
      id: uuidv4(),
      type,
      name,
      duration,
      timestamp: new Date(),
      metadata,
      userId,
    };
    
    this.metrics.push(metric);
    
    // Log to SystemLogs if duration exceeds threshold
    if (this.shouldLogMetric(type, duration)) {
      await this.logToDatabase(metric);
    }
    
    return duration;
  }
  
  /**
   * Measure a synchronous function
   */
  measure<T>(
    type: PerformanceMetricType,
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const operationId = uuidv4();
    this.startTimer(operationId);
    
    try {
      const result = fn();
      this.endTimer(operationId, type, name, metadata);
      return result;
    } catch (error) {
      this.endTimer(operationId, type, name, { ...metadata, error: String(error) });
      throw error;
    }
  }
  
  /**
   * Measure an asynchronous function
   */
  async measureAsync<T>(
    type: PerformanceMetricType,
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
    userId?: string
  ): Promise<T> {
    const operationId = uuidv4();
    this.startTimer(operationId);
    
    try {
      const result = await fn();
      await this.endTimer(operationId, type, name, metadata, userId);
      return result;
    } catch (error) {
      await this.endTimer(operationId, type, name, { ...metadata, error: String(error) }, userId);
      throw error;
    }
  }
  
  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  /**
   * Get metrics by type
   */
  getMetricsByType(type: PerformanceMetricType): PerformanceMetric[] {
    return this.metrics.filter(m => m.type === type);
  }
  
  /**
   * Get performance statistics for a metric type
   */
  getStats(type: PerformanceMetricType): PerformanceStats | null {
    const typeMetrics = this.getMetricsByType(type);
    
    if (typeMetrics.length === 0) {
      return null;
    }
    
    const durations = typeMetrics.map(m => m.duration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    
    return {
      type,
      count: typeMetrics.length,
      avgDuration: totalDuration / typeMetrics.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalDuration,
    };
  }
  
  /**
   * Get all statistics
   */
  getAllStats(): PerformanceStats[] {
    const types: PerformanceMetricType[] = [
      'page_load',
      'api_call',
      'database_query',
      'component_render',
      'file_upload',
      'export_operation',
    ];
    
    return types
      .map(type => this.getStats(type))
      .filter((stats): stats is PerformanceStats => stats !== null);
  }
  
  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
  
  /**
   * Clear metrics older than specified time
   */
  clearOldMetrics(maxAgeMs: number = 3600000): void {
    const cutoffTime = Date.now() - maxAgeMs;
    this.metrics = this.metrics.filter(
      m => m.timestamp.getTime() > cutoffTime
    );
  }
  
  /**
   * Determine if a metric should be logged to database
   */
  private shouldLogMetric(type: PerformanceMetricType, duration: number): boolean {
    // Define thresholds for different metric types (in milliseconds)
    const thresholds: Record<PerformanceMetricType, number> = {
      page_load: 3000,        // Log if page load > 3s
      api_call: 5000,         // Log if API call > 5s
      database_query: 1000,   // Log if DB query > 1s
      component_render: 500,  // Log if render > 500ms
      file_upload: 10000,     // Log if upload > 10s
      export_operation: 5000, // Log if export > 5s
    };
    
    return duration > thresholds[type];
  }
  
  /**
   * Log metric to SystemLogs database
   */
  private async logToDatabase(metric: PerformanceMetric): Promise<void> {
    try {
      await db.systemLogs.add({
        id: uuidv4(),
        action: 'performance_metric',
        entityType: metric.type,
        entityId: metric.id,
        details: JSON.stringify({
          name: metric.name,
          duration: metric.duration,
          metadata: metric.metadata,
        }),
        userId: metric.userId || 'system',
        timestamp: metric.timestamp,
        status: metric.duration > 10000 ? 'warning' : 'success',
      });
    } catch (error) {
      console.error('Failed to log performance metric to database:', error);
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure page load time
 */
export function measurePageLoad(pageName: string, userId?: string): void {
  if (typeof window === 'undefined') return;
  
  // Use Navigation Timing API
  window.addEventListener('load', async () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (perfData) {
      const loadTime = perfData.loadEventEnd - perfData.fetchStart;
      const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.fetchStart;
      const domInteractive = perfData.domInteractive - perfData.fetchStart;
      
      await performanceMonitor.measureAsync(
        'page_load',
        pageName,
        async () => {
          // Simulate async operation
          return Promise.resolve();
        },
        {
          loadTime,
          domContentLoaded,
          domInteractive,
          transferSize: perfData.transferSize,
          encodedBodySize: perfData.encodedBodySize,
          decodedBodySize: perfData.decodedBodySize,
        },
        userId
      );
    }
  });
}

/**
 * Measure API call duration
 */
export async function measureAPICall<T>(
  apiName: string,
  apiCall: () => Promise<T>,
  userId?: string
): Promise<T> {
  return await performanceMonitor.measureAsync(
    'api_call',
    apiName,
    apiCall,
    undefined,
    userId
  );
}

/**
 * Measure database query duration
 */
export async function measureDatabaseQuery<T>(
  queryName: string,
  query: () => Promise<T>,
  userId?: string
): Promise<T> {
  return await performanceMonitor.measureAsync(
    'database_query',
    queryName,
    query,
    undefined,
    userId
  );
}

/**
 * Measure component render time
 */
export function measureComponentRender(
  componentName: string,
  renderFn: () => void
): void {
  performanceMonitor.measure(
    'component_render',
    componentName,
    renderFn
  );
}

/**
 * Measure file upload duration
 */
export async function measureFileUpload<T>(
  fileName: string,
  fileSize: number,
  uploadFn: () => Promise<T>,
  userId?: string
): Promise<T> {
  return await performanceMonitor.measureAsync(
    'file_upload',
    fileName,
    uploadFn,
    { fileSize },
    userId
  );
}

/**
 * Measure export operation duration
 */
export async function measureExport<T>(
  exportType: string,
  recordCount: number,
  exportFn: () => Promise<T>,
  userId?: string
): Promise<T> {
  return await performanceMonitor.measureAsync(
    'export_operation',
    exportType,
    exportFn,
    { recordCount },
    userId
  );
}

/**
 * Get performance dashboard data
 */
export async function getPerformanceDashboardData(): Promise<{
  stats: PerformanceStats[];
  recentSlowOperations: PerformanceMetric[];
  systemHealth: 'good' | 'warning' | 'critical';
}> {
  const stats = performanceMonitor.getAllStats();
  
  // Get recent slow operations from SystemLogs
  const recentLogs = await db.systemLogs
    .where('action')
    .equals('performance_metric')
    .reverse()
    .limit(50)
    .toArray();
  
  const recentSlowOperations: PerformanceMetric[] = recentLogs.map(log => {
    const details = JSON.parse(log.details);
    return {
      id: log.entityId || log.id,
      type: log.entityType as PerformanceMetricType,
      name: details.name,
      duration: details.duration,
      timestamp: log.timestamp,
      metadata: details.metadata,
      userId: log.userId,
    };
  });
  
  // Determine system health based on average durations
  let systemHealth: 'good' | 'warning' | 'critical' = 'good';
  
  const pageLoadStats = stats.find(s => s.type === 'page_load');
  const apiCallStats = stats.find(s => s.type === 'api_call');
  
  if (pageLoadStats && pageLoadStats.avgDuration > 5000) {
    systemHealth = 'critical';
  } else if (apiCallStats && apiCallStats.avgDuration > 8000) {
    systemHealth = 'critical';
  } else if (pageLoadStats && pageLoadStats.avgDuration > 3000) {
    systemHealth = 'warning';
  } else if (apiCallStats && apiCallStats.avgDuration > 5000) {
    systemHealth = 'warning';
  }
  
  return {
    stats,
    recentSlowOperations,
    systemHealth,
  };
}

/**
 * Auto-cleanup old metrics (call this periodically)
 */
export function initializePerformanceCleanup(): void {
  // Clean up metrics older than 1 hour every 10 minutes
  setInterval(() => {
    performanceMonitor.clearOldMetrics(3600000); // 1 hour
  }, 600000); // 10 minutes
}

/**
 * React hook for measuring component render time
 */
export function usePerformanceMonitor(componentName: string) {
  if (typeof window === 'undefined') return;
  
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    performanceMonitor.measureAsync(
      'component_render',
      componentName,
      async () => Promise.resolve(),
      { duration }
    );
  };
}
