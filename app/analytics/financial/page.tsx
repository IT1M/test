'use client';

import dynamic from 'next/dynamic';
import { DashboardSkeleton } from '@/components/common/LoadingSkeleton';

// Lazy load the heavy financial analytics component
const FinancialAnalyticsDashboard = dynamic(() => import('@/components/analytics/FinancialAnalyticsDashboard'), {
  loading: () => <DashboardSkeleton />,
  ssr: false
});

export default function FinancialAnalyticsPage() {
  return <FinancialAnalyticsDashboard />;
}
