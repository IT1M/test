'use client';

/**
 * Session Monitor Component
 * Monitors session timeout and warns user before expiration
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from './Modal';
import { Button } from './Button';

interface SessionMonitorProps {
  locale: string;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before expiry
const CHECK_INTERVAL = 60 * 1000; // Check every minute

export function SessionMonitor({ locale }: SessionMonitorProps) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Update last activity on user interaction
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  // Extend session
  const extendSession = useCallback(async () => {
    try {
      // Make a lightweight API call to refresh the session
      await fetch('/api/auth/session', { method: 'GET' });
      updateActivity();
    } catch (error) {
      console.error('Error extending session:', error);
    }
  }, [updateActivity]);

  // Logout user
  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push(`/${locale}/login`);
    } catch (error) {
      console.error('Error logging out:', error);
      router.push(`/${locale}/login`);
    }
  }, [router, locale]);

  // Check session status
  useEffect(() => {
    const checkSession = () => {
      const now = Date.now();
      const elapsed = now - lastActivity;
      const remaining = SESSION_TIMEOUT - elapsed;

      setTimeRemaining(remaining);

      // Show warning if session is about to expire
      if (remaining <= WARNING_TIME && remaining > 0) {
        setShowWarning(true);
      }

      // Logout if session has expired
      if (remaining <= 0) {
        handleLogout();
      }
    };

    // Check immediately
    checkSession();

    // Set up interval to check periodically
    const interval = setInterval(checkSession, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [lastActivity, handleLogout]);

  // Listen for user activity
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach((event) => {
      document.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [updateActivity]);

  // Format time remaining
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {showWarning && (
        <Modal
          isOpen={showWarning}
          onClose={() => setShowWarning(false)}
          title="Session Expiring Soon"
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Your session will expire in{' '}
              <span className="font-semibold text-red-600 dark:text-red-400">
                {formatTime(timeRemaining)}
              </span>
              . Would you like to continue your session?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
              <Button onClick={extendSession}>
                Continue Session
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
