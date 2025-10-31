'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, trackUserActivity } from '@/store/authStore';
import { canAccessRoute } from '@/lib/auth/rbac';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard component to protect routes and track user activity
 * Automatically redirects to login if not authenticated or session expired
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, getCurrentUser, checkSessionTimeout, logout } = useAuthStore();

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/login') {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check session timeout
    if (checkSessionTimeout()) {
      logout();
      router.push('/login?timeout=true');
      return;
    }

    // Check if user has permission to access this route
    const user = getCurrentUser();
    if (user && !canAccessRoute(user, pathname)) {
      router.push('/unauthorized');
      return;
    }

    // Track user activity
    trackUserActivity();
  }, [pathname, isAuthenticated, checkSessionTimeout, getCurrentUser, logout, router]);

  // Set up activity tracking on user interactions
  useEffect(() => {
    const handleActivity = () => {
      trackUserActivity();
    };

    // Track various user activities
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  // Set up session timeout checker
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && checkSessionTimeout()) {
        logout();
        router.push('/login?timeout=true');
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated, checkSessionTimeout, logout, router]);

  return <>{children}</>;
}
