"use client";

import { useState, useEffect } from 'react';
import { useOffline } from '@/components/providers/OfflineProvider';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineIndicator({ className = '', showDetails = false }: OfflineIndicatorProps) {
  const { isOnline, syncStatus, actions } = useOffline();
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (syncing || !isOnline) return;
    
    setSyncing(true);
    try {
      await actions.syncNow();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-danger-500';
    if (syncStatus.syncInProgress) return 'bg-warning-500';
    if (syncStatus.pendingActions > 0) return 'bg-warning-400';
    return 'bg-success-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus.syncInProgress) return 'Syncing...';
    if (syncStatus.pendingActions > 0) return `${syncStatus.pendingActions} pending`;
    return 'Online';
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
        </svg>
      );
    }
    
    if (syncStatus.syncInProgress || syncing) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    
    if (syncStatus.pendingActions > 0) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main indicator */}
      <div
        className="flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-medium cursor-pointer transition-all hover:opacity-80"
        style={{ backgroundColor: getStatusColor().replace('bg-', '') }}
        onClick={() => setShowSyncDetails(!showSyncDetails)}
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>

      {/* Detailed status panel */}
      {showDetails && showSyncDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 p-4 z-50">
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Connection Status
              </span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                <span className="text-sm text-secondary-600 dark:text-secondary-400">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {/* Sync Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  Sync Status
                </span>
                <span className="text-sm text-secondary-600 dark:text-secondary-400">
                  {syncStatus.syncInProgress ? 'In Progress' : 'Idle'}
                </span>
              </div>
              
              {syncStatus.pendingActions > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600 dark:text-secondary-400">
                    Pending Actions
                  </span>
                  <span className="text-sm font-medium text-warning-600">
                    {syncStatus.pendingActions}
                  </span>
                </div>
              )}

              {syncStatus.lastSync && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary-600 dark:text-secondary-400">
                    Last Sync
                  </span>
                  <span className="text-sm text-secondary-600 dark:text-secondary-400">
                    {new Date(syncStatus.lastSync).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-secondary-200 dark:border-secondary-700">
              <button
                onClick={handleSync}
                disabled={!isOnline || syncing || syncStatus.syncInProgress}
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              
              <button
                onClick={() => setShowSyncDetails(false)}
                className="px-3 py-2 text-sm font-medium text-secondary-600 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-700 rounded-md hover:bg-secondary-200 dark:hover:bg-secondary-600 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Offline Mode Info */}
            {!isOnline && (
              <div className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-md border border-warning-200 dark:border-warning-800">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-warning-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
                      Offline Mode Active
                    </p>
                    <p className="text-sm text-warning-700 dark:text-warning-300 mt-1">
                      Your changes are being saved locally and will sync when connection is restored.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for mobile/small spaces
export function CompactOfflineIndicator({ className = '' }: { className?: string }) {
  const { isOnline, syncStatus } = useOffline();

  const getStatusColor = () => {
    if (!isOnline) return 'bg-danger-500';
    if (syncStatus.syncInProgress) return 'bg-warning-500';
    if (syncStatus.pendingActions > 0) return 'bg-warning-400';
    return 'bg-success-500';
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      {syncStatus.pendingActions > 0 && (
        <span className="text-xs text-secondary-600 dark:text-secondary-400">
          {syncStatus.pendingActions}
        </span>
      )}
    </div>
  );
}

// Toast notification for offline status changes
export function OfflineStatusToast() {
  const { isOnline } = useOffline();
  const [showToast, setShowToast] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline && !wasOffline) {
      // Just went offline
      setWasOffline(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } else if (isOnline && wasOffline) {
      // Just came back online
      setWasOffline(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [isOnline, wasOffline]);

  if (!showToast) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${
        isOnline ? 'bg-success-600' : 'bg-warning-600'
      }`}>
        {isOnline ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728" />
          </svg>
        )}
        <div>
          <p className="font-medium">
            {isOnline ? 'Back Online' : 'You\'re Offline'}
          </p>
          <p className="text-sm opacity-90">
            {isOnline 
              ? 'Your changes will now sync automatically' 
              : 'Changes will be saved locally and synced when connection returns'
            }
          </p>
        </div>
        <button
          onClick={() => setShowToast(false)}
          className="ml-2 opacity-70 hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default OfflineIndicator;