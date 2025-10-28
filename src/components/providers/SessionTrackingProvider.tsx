'use client';

import { useSessionTracking } from '@/hooks/useSessionTracking';

export function SessionTrackingProvider({ children }: { children: React.ReactNode }) {
  useSessionTracking();
  return <>{children}</>;
}