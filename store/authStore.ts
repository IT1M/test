// Authentication Store - User session management with role-based access control
// Requirements: 12.8, 12.15

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '@/types/database';

interface AuthState {
  user: User | null;
  sessionStartTime: number | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  getCurrentUser: () => User | null;
  updateLastActivity: () => void;
  checkSessionTimeout: () => boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      sessionStartTime: null,
      isAuthenticated: false,

      login: (user: User) => {
        set({
          user: {
            ...user,
            lastLogin: new Date(),
          },
          sessionStartTime: Date.now(),
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          sessionStartTime: null,
          isAuthenticated: false,
        });
      },

      getCurrentUser: () => {
        const state = get();
        
        // Check session timeout
        if (state.checkSessionTimeout()) {
          state.logout();
          return null;
        }
        
        return state.user;
      },

      updateLastActivity: () => {
        const state = get();
        if (state.isAuthenticated) {
          set({ sessionStartTime: Date.now() });
        }
      },

      checkSessionTimeout: () => {
        const state = get();
        
        if (!state.sessionStartTime || !state.isAuthenticated) {
          return false;
        }
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - state.sessionStartTime;
        
        // Return true if session has timed out
        return elapsedTime > SESSION_TIMEOUT;
      },

      hasRole: (role: UserRole) => {
        const state = get();
        return state.user?.role === role;
      },

      hasPermission: (permission: string) => {
        const state = get();
        return state.user?.permissions.includes(permission) || false;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        sessionStartTime: state.sessionStartTime,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Helper function to get current user ID
export const getCurrentUserId = (): string => {
  const user = useAuthStore.getState().getCurrentUser();
  return user?.id || 'anonymous';
};

// Helper function to check if user is authenticated
export const isUserAuthenticated = (): boolean => {
  const state = useAuthStore.getState();
  
  if (!state.isAuthenticated) {
    return false;
  }
  
  // Check for session timeout
  if (state.checkSessionTimeout()) {
    state.logout();
    return false;
  }
  
  return true;
};

// Auto-logout on session timeout - can be called in app initialization
export const initializeSessionMonitoring = () => {
  // Check session every minute
  setInterval(() => {
    const state = useAuthStore.getState();
    if (state.isAuthenticated && state.checkSessionTimeout()) {
      state.logout();
      // Optionally show a notification or redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, 60000); // Check every minute
};

// Activity tracker - call this on user interactions to reset session timer
export const trackUserActivity = () => {
  const state = useAuthStore.getState();
  if (state.isAuthenticated) {
    state.updateLastActivity();
  }
};
