'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useSessionTracking() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    // Track session start
    const trackSessionStart = async () => {
      try {
        await fetch('/api/admin/activity/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'SESSION_START',
          }),
        });
      } catch (error) {
        console.error('Failed to track session start:', error);
      }
    };

    // Track session activity
    const trackActivity = async (action: string, details?: any) => {
      try {
        await fetch('/api/admin/activity/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            details,
          }),
        });
      } catch (error) {
        console.error('Failed to track activity:', error);
      }
    };

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackActivity('PAGE_HIDDEN');
      } else {
        trackActivity('PAGE_VISIBLE');
      }
    };

    // Track user interactions
    const handleUserInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      const action = `USER_${event.type.toUpperCase()}`;
      const details = {
        element: target.tagName,
        className: target.className,
        id: target.id,
      };
      
      // Throttle tracking to avoid too many events
      if (Math.random() < 0.1) { // Track only 10% of interactions
        trackActivity(action, details);
      }
    };

    // Track session end
    const trackSessionEnd = () => {
      navigator.sendBeacon('/api/admin/activity/session', JSON.stringify({
        action: 'SESSION_END',
      }));
    };

    // Set up event listeners
    trackSessionStart();
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    
    window.addEventListener('beforeunload', trackSessionEnd);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('beforeunload', trackSessionEnd);
    };
  }, [session]);
}

export default useSessionTracking;