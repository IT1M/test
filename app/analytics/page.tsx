'use client';

import dynamic from 'next/dynamic';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';

// Lazy load the heavy analytics dashboard component
const AnalyticsDashboard = dynamic(() => import('@/components/analytics/AnalyticsDashboard'), {
  loading: () => <DashboardSkeleton />,
  ssr: false
});

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
