'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, X } from 'lucide-react';

/**
 * SessionTimeoutWarning component
 * Shows a warning when session is about to expire
 */
export function SessionTimeoutWarning() {
  const { isAuthenticated, getSessionTimeRemaining, updateLastActivity } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    const interval = setInterval(() => {
      const remaining = getSessionTimeRemaining();
      setTimeRemaining(remaining);

      // Show warning when less than 5 minutes remaining
      const fiveMinutes = 5 * 60 * 1000;
      if (remaining > 0 && remaining <= fiveMinutes) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, getSessionTimeRemaining]);

  const handleExtendSession = () => {
    updateLastActivity();
    setShowWarning(false);
  };

  const handleDismiss = () => {
    setShowWarning(false);
  };

  if (!showWarning) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200">
          Session Expiring Soon
        </AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
          <p className="mb-3">
            Your session will expire in {minutes}:{seconds.toString().padStart(2, '0')}. 
            Click "Stay Logged In" to extend your session.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleExtendSession}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Stay Logged In
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
