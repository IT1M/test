// Lazy-loaded components for better code splitting and performance
import { lazy, Suspense, ComponentType } from 'react';
import { Loading } from '@/components/ui/Loading';

// Loading fallback component
const LoadingFallback = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex items-center justify-center p-8">
    <Loading size="lg" message={message} />
  </div>
);

// Error boundary for lazy components
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[LazyComponent] Error loading component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback = ({ error }: { error: Error }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="text-danger-600 mb-4">
      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-2">
      Failed to load component
    </h3>
    <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
      {error.message}
    </p>
    <button
      onClick={() => window.location.reload()}
      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
    >
      Reload Page
    </button>
  </div>
);

// Higher-order component for lazy loading with enhanced features
function withLazyLoading<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: {
    fallback?: React.ComponentType;
    errorFallback?: React.ComponentType<{ error: Error }>;
    loadingMessage?: string;
    preload?: boolean;
  } = {}
) {
  const LazyComponent = lazy(importFn);
  
  // Preload component if requested
  if (options.preload && typeof window !== 'undefined') {
    // Preload after a short delay to not block initial render
    setTimeout(() => {
      importFn().catch(error => {
        console.warn('[LazyComponent] Preload failed:', error);
      });
    }, 100);
  }

  const WrappedComponent = (props: T) => (
    <LazyErrorBoundary fallback={options.errorFallback}>
      <Suspense 
        fallback={
          options.fallback ? 
            <options.fallback /> : 
            <LoadingFallback message={options.loadingMessage} />
        }
      >
        <LazyComponent {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );

  // Add preload method to component
  (WrappedComponent as any).preload = importFn;

  return WrappedComponent;
}

// Lazy-loaded dashboard components
export const LazyEnhancedDashboard = withLazyLoading(
  () => import('@/app/[locale]/dashboard/EnhancedDashboard'),
  {
    loadingMessage: 'Loading dashboard...',
    preload: true, // Preload since it's commonly used
  }
);

export const LazyAnalyticsDashboard = withLazyLoading(
  () => import('@/app/[locale]/analytics/AnalyticsDashboard'),
  {
    loadingMessage: 'Loading analytics...',
  }
);

export const LazyReportsClient = withLazyLoading(
  () => import('@/app/[locale]/reports/ReportsClient'),
  {
    loadingMessage: 'Loading reports...',
  }
);

// Lazy-loaded data entry components
export const LazyEnhancedDataEntryClient = withLazyLoading(
  () => import('@/app/[locale]/data-entry/EnhancedDataEntryClient'),
  {
    loadingMessage: 'Loading data entry form...',
  }
);

export const LazyEnhancedDataLogClient = withLazyLoading(
  () => import('@/app/[locale]/data-log/EnhancedDataLogClient'),
  {
    loadingMessage: 'Loading data log...',
  }
);

// Lazy-loaded settings components
export const LazySettingsClient = withLazyLoading(
  () => import('@/app/[locale]/settings/SettingsClient'),
  {
    loadingMessage: 'Loading settings...',
  }
);

export const LazyUserManagementClient = withLazyLoading(
  () => import('@/app/[locale]/settings/users/UserManagementClient'),
  {
    loadingMessage: 'Loading user management...',
  }
);

// Lazy-loaded admin components
export const LazyActivityMonitoringDashboard = withLazyLoading(
  () => import('@/components/admin/ActivityMonitoringDashboard'),
  {
    loadingMessage: 'Loading activity monitoring...',
  }
);

export const LazySystemHealthMonitoring = withLazyLoading(
  () => import('@/components/admin/SystemHealthMonitoring'),
  {
    loadingMessage: 'Loading system health...',
  }
);

// Lazy-loaded chart components
export const LazyInteractiveChart = withLazyLoading(
  () => import('@/components/charts/InteractiveChart'),
  {
    loadingMessage: 'Loading chart...',
  }
);

export const LazyAIInsightsPanel = withLazyLoading(
  () => import('@/components/charts/AIInsightsPanel'),
  {
    loadingMessage: 'Loading AI insights...',
  }
);

// Lazy-loaded form components
export const LazyBulkImportModal = withLazyLoading(
  () => import('@/components/forms/BulkImportModal'),
  {
    loadingMessage: 'Loading import tool...',
  }
);

export const LazyReportBuilder = withLazyLoading(
  () => import('@/components/reports/ReportBuilder'),
  {
    loadingMessage: 'Loading report builder...',
  }
);

// Lazy-loaded backup components
export const LazyBackupClient = withLazyLoading(
  () => import('@/app/[locale]/backup/BackupClient'),
  {
    loadingMessage: 'Loading backup management...',
  }
);

export const LazyAuditClient = withLazyLoading(
  () => import('@/app/[locale]/audit/AuditClient'),
  {
    loadingMessage: 'Loading audit logs...',
  }
);

// Utility function to preload multiple components
export function preloadComponents(components: Array<{ preload?: () => Promise<any> }>) {
  if (typeof window === 'undefined') return;

  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePreload = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, 100);
    }
  };

  components.forEach((component, index) => {
    if (component.preload) {
      schedulePreload(() => {
        setTimeout(() => {
          component.preload?.().catch(error => {
            console.warn(`[LazyComponent] Preload failed for component ${index}:`, error);
          });
        }, index * 200); // Stagger preloads
      });
    }
  });
}

// Hook for managing component preloading
export function useComponentPreloading() {
  const preloadDashboardComponents = () => {
    preloadComponents([
      LazyEnhancedDashboard,
      LazyAnalyticsDashboard,
      LazyInteractiveChart,
    ]);
  };

  const preloadDataComponents = () => {
    preloadComponents([
      LazyEnhancedDataEntryClient,
      LazyEnhancedDataLogClient,
      LazyBulkImportModal,
    ]);
  };

  const preloadAdminComponents = () => {
    preloadComponents([
      LazySettingsClient,
      LazyUserManagementClient,
      LazyActivityMonitoringDashboard,
      LazySystemHealthMonitoring,
    ]);
  };

  const preloadReportComponents = () => {
    preloadComponents([
      LazyReportsClient,
      LazyReportBuilder,
      LazyAIInsightsPanel,
    ]);
  };

  return {
    preloadDashboardComponents,
    preloadDataComponents,
    preloadAdminComponents,
    preloadReportComponents,
  };
}

export default {
  LazyEnhancedDashboard,
  LazyAnalyticsDashboard,
  LazyReportsClient,
  LazyEnhancedDataEntryClient,
  LazyEnhancedDataLogClient,
  LazySettingsClient,
  LazyUserManagementClient,
  LazyActivityMonitoringDashboard,
  LazySystemHealthMonitoring,
  LazyInteractiveChart,
  LazyAIInsightsPanel,
  LazyBulkImportModal,
  LazyReportBuilder,
  LazyBackupClient,
  LazyAuditClient,
  preloadComponents,
  useComponentPreloading,
};