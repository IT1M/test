# Performance Optimization Guide

## Overview

This guide provides comprehensive strategies for optimizing the Saudi Mais Inventory System performance.

## Performance Targets

- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms
- **Time to Interactive (TTI)**: < 3 seconds
- **First Contentful Paint (FCP)**: < 1.5 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

## Frontend Optimizations

### 1. Code Splitting and Lazy Loading

```typescript
// Lazy load heavy components
const AnalyticsDashboard = lazy(() => import('./pages/Analytics'));
const ReportsPage = lazy(() => import('./pages/Reports'));
const DataEntryPage = lazy(() => import('./pages/DataEntry'));

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <AnalyticsDashboard />
</Suspense>
```

### 2. Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  loading="lazy"
  quality={85}
/>
```

### 3. Bundle Size Optimization

```bash
# Analyze bundle size
npm run analyze

# Check for large dependencies
npx webpack-bundle-analyzer .next/analyze/client.json
```

**Optimization Strategies:**
- Remove unused dependencies
- Use tree-shaking
- Import only needed modules
- Use dynamic imports for large libraries

### 4. Caching Strategies

```typescript
// Browser caching
export const revalidate = 3600; // 1 hour

// API route caching
export async function GET(request: Request) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
```

### 5. React Performance

```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Render logic */}</div>;
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  // Handle click
}, [dependencies]);
```

### 6. Virtual Scrolling

```typescript
// For large lists, use virtual scrolling
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>{items[index]}</div>
  )}
</FixedSizeList>
```

## Backend Optimizations

### 1. Database Query Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_inventory_destination ON inventory_items(destination);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_inventory_created_at ON inventory_items(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX idx_inventory_analytics 
ON inventory_items(destination, category, created_at) 
INCLUDE (quantity, reject);

-- Full-text search index
CREATE INDEX idx_inventory_search 
ON inventory_items USING GIN (to_tsvector('arabic', item_name || ' ' || COALESCE(notes, '')));
```

### 2. Query Optimization

```typescript
// Use select to fetch only needed fields
const items = await prisma.inventoryItem.findMany({
  select: {
    id: true,
    itemName: true,
    quantity: true,
    // Don't fetch unnecessary fields
  },
});

// Use pagination
const items = await prisma.inventoryItem.findMany({
  take: 50,
  skip: page * 50,
  orderBy: { createdAt: 'desc' },
});

// Use aggregations efficiently
const stats = await prisma.inventoryItem.groupBy({
  by: ['destination'],
  _count: true,
  _sum: { quantity: true },
});
```

### 3. Caching with Redis

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
});

// Cache frequently accessed data
async function getCachedData(key: string) {
  const cached = await redis.get(key);
  if (cached) return cached;
  
  const data = await fetchFromDatabase();
  await redis.set(key, data, { ex: 3600 }); // 1 hour TTL
  
  return data;
}
```

### 4. Connection Pooling

```typescript
// Configure Prisma connection pool
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pool settings
  connection_limit = 10
  pool_timeout = 20
}
```

### 5. API Response Compression

```typescript
// Enable compression in Next.js
export default {
  compress: true,
  // ... other config
};

// Or use middleware
import compression from 'compression';
app.use(compression());
```

## Network Optimizations

### 1. HTTP/2 and HTTP/3

Ensure your hosting supports HTTP/2 or HTTP/3 for multiplexing and faster connections.

### 2. CDN Configuration

```typescript
// Use CDN for static assets
const CDN_URL = process.env.CDN_URL || '';

export function getCDNUrl(path: string) {
  return `${CDN_URL}${path}`;
}
```

### 3. Prefetching and Preloading

```typescript
// Prefetch critical resources
<link rel="prefetch" href="/api/dashboard/kpis" />
<link rel="preload" href="/fonts/arabic.woff2" as="font" crossOrigin="anonymous" />

// Prefetch routes
import { useRouter } from 'next/navigation';

const router = useRouter();
router.prefetch('/analytics');
```

## Monitoring and Profiling

### 1. Performance Monitoring

```typescript
import { getPerformanceMonitor } from '@/utils/performance-monitor';

const monitor = getPerformanceMonitor({
  pageLoad: 2000,
  apiResponse: 500,
  render: 100,
  memory: 100,
});

// Monitor will automatically track and warn about slow operations
```

### 2. Database Optimization Script

```bash
# Run database optimization analysis
npm run db:optimize

# This will:
# - Analyze slow queries
# - Check indexes
# - Analyze table sizes
# - Run VACUUM ANALYZE
# - Generate optimization report
```

### 3. Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true npm run build

# This will generate:
# - .next/analyze/client.html
# - .next/analyze/server.html
```

### 4. Lighthouse Audits

```bash
# Run Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Or use Chrome DevTools > Lighthouse tab
```

## Memory Leak Prevention

### 1. Cleanup in useEffect

```typescript
useEffect(() => {
  const subscription = subscribeToUpdates();
  
  return () => {
    subscription.unsubscribe(); // Cleanup
  };
}, []);
```

### 2. Remove Event Listeners

```typescript
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

### 3. Clear Timers

```typescript
useEffect(() => {
  const timer = setInterval(() => {
    // Do something
  }, 1000);
  
  return () => {
    clearInterval(timer);
  };
}, []);
```

### 4. Memory Leak Detection

```typescript
import { detectMemoryLeaks } from '@/utils/performance-monitor';

// Start monitoring for memory leaks
const stopMonitoring = detectMemoryLeaks(5000); // Check every 5 seconds

// Stop monitoring when done
stopMonitoring();
```

## Performance Checklist

### Frontend
- [ ] Code splitting implemented
- [ ] Lazy loading for heavy components
- [ ] Images optimized (WebP, lazy loading)
- [ ] Bundle size analyzed and optimized
- [ ] React.memo used for expensive components
- [ ] useMemo/useCallback used appropriately
- [ ] Virtual scrolling for large lists
- [ ] Service worker for offline support

### Backend
- [ ] Database indexes created
- [ ] Queries optimized (select, pagination)
- [ ] Caching implemented (Redis)
- [ ] Connection pooling configured
- [ ] API responses compressed
- [ ] N+1 queries eliminated

### Network
- [ ] HTTP/2 enabled
- [ ] CDN configured for static assets
- [ ] Critical resources prefetched
- [ ] Compression enabled

### Monitoring
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] Lighthouse audits passing
- [ ] Memory leaks checked
- [ ] Database performance monitored

## Performance Testing

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run load-test.js
```

### Example Load Test Script

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/inventory');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

## Continuous Optimization

1. **Regular Audits**: Run performance audits monthly
2. **Monitor Metrics**: Track Core Web Vitals in production
3. **User Feedback**: Collect and act on user performance feedback
4. **Benchmark**: Compare performance against targets
5. **Iterate**: Continuously improve based on data

## Resources

- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web.dev Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)
