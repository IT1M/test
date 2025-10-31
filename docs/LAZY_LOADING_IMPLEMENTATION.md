# Lazy Loading Implementation

## Overview

This document describes the lazy loading implementation for heavy components in the Medical Products Management System, specifically for analytics dashboards and report builder components.

## Implementation Details

### 1. Dynamic Imports with Next.js

All heavy analytics and report components have been converted to use Next.js `dynamic()` imports with the following pattern:

```typescript
import dynamic from 'next/dynamic';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';

const HeavyComponent = dynamic(() => import('@/components/path/to/Component'), {
  loading: () => <DashboardSkeleton />,
  ssr: false
});
```

### 2. Loading Skeletons

Created reusable loading skeleton components in `components/common/LoadingSkeleton.tsx`:

- **StatCardSkeleton**: For metric cards
- **ChartSkeleton**: For chart placeholders
- **TableSkeleton**: For table data placeholders
- **DashboardSkeleton**: Complete dashboard loading state
- **PageLoadingSkeleton**: Generic page loading spinner

### 3. Route-Based Code Splitting

Next.js 14 automatically implements route-based code splitting. Each page in the `app/` directory is automatically split into separate chunks.

### 4. Lazy-Loaded Components

The following heavy components have been lazy-loaded:

#### Analytics Pages
- **app/analytics/page.tsx** → `components/analytics/AnalyticsDashboard.tsx`
- **app/analytics/financial/page.tsx** → `components/analytics/FinancialAnalyticsDashboard.tsx`
- **app/analytics/sales/page.tsx** → `components/analytics/SalesAnalyticsDashboard.tsx`
- **app/analytics/inventory/page.tsx** → `components/analytics/InventoryAnalyticsDashboard.tsx`

#### Reports Pages
- **app/reports/page.tsx** → `components/reports/ReportsDashboard.tsx`
- **app/reports/builder/page.tsx** → `components/reports/ReportBuilder.tsx`

## Benefits

### Performance Improvements

1. **Reduced Initial Bundle Size**: Heavy analytics and charting libraries (Recharts) are only loaded when needed
2. **Faster Initial Page Load**: Main bundle is smaller, leading to faster Time to Interactive (TTI)
3. **Better User Experience**: Loading skeletons provide visual feedback during component loading
4. **Optimized Network Usage**: Components are loaded on-demand, reducing unnecessary data transfer

### Code Organization

1. **Separation of Concerns**: Page components are thin wrappers, actual logic is in dedicated components
2. **Reusable Components**: Analytics dashboards can be reused in different contexts
3. **Maintainability**: Easier to update and test individual components

## Usage Example

### Before (Heavy Page Component)
```typescript
// app/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, BarChart } from 'recharts'; // Heavy library
// ... lots of imports and code

export default function AnalyticsPage() {
  // Heavy component logic
  return (
    // Complex dashboard with charts
  );
}
```

### After (Lazy-Loaded)
```typescript
// app/analytics/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';

const AnalyticsDashboard = dynamic(() => import('@/components/analytics/AnalyticsDashboard'), {
  loading: () => <DashboardSkeleton />,
  ssr: false
});

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
```

## Configuration

### Next.js Configuration

The `next.config.mjs` file already has the necessary configuration for code splitting:

```javascript
const nextConfig = {
  reactStrictMode: true,
  // Code splitting is enabled by default in Next.js 14
};
```

### TypeScript Configuration

No special TypeScript configuration is required. Dynamic imports work out of the box with the existing `tsconfig.json`.

## Testing

To verify lazy loading is working:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Check the build output**: You should see separate chunks for each lazy-loaded component

3. **Use browser DevTools**:
   - Open Network tab
   - Navigate to analytics pages
   - Observe separate JavaScript chunks being loaded on demand

## Best Practices

1. **Use Loading Skeletons**: Always provide a loading component that matches the layout of the actual component
2. **Disable SSR for Client-Heavy Components**: Use `ssr: false` for components with heavy client-side logic
3. **Group Related Components**: Keep related components together for better code splitting
4. **Monitor Bundle Size**: Regularly check bundle sizes to ensure lazy loading is effective

## Future Improvements

1. **Prefetching**: Implement link prefetching for analytics pages when user hovers over navigation
2. **Progressive Loading**: Load critical data first, then load charts and visualizations
3. **Component-Level Splitting**: Further split large dashboard components into smaller lazy-loaded pieces
4. **Caching Strategy**: Implement service worker caching for lazy-loaded chunks

## Maintenance

When adding new heavy components:

1. Create the component in the appropriate `components/` directory
2. Create a thin page wrapper using `dynamic()` import
3. Add appropriate loading skeleton
4. Test the lazy loading behavior
5. Update this documentation

## Related Files

- `components/common/LoadingSkeleton.tsx` - Loading skeleton components
- `components/analytics/*` - Analytics dashboard components
- `components/reports/*` - Reports components
- `app/analytics/**/*` - Analytics page wrappers
- `app/reports/**/*` - Reports page wrappers
