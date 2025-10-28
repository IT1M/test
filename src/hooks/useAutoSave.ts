"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface AutoSaveOptions {
  key: string;
  data: any;
  enabled?: boolean;
  interval?: number; // in milliseconds
  onSave?: (data: any) => void;
  onRestore?: (data: any) => void;
  onError?: (error: Error) => void;
  onConflict?: (localData: any, remoteData: any) => any; // Conflict resolution
  enableRecovery?: boolean;
  maxVersions?: number; // Number of versions to keep
}

interface AutoSaveState {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  hasRecoveryData: boolean;
  conflictDetected: boolean;
}

interface SavedData {
  data: any;
  timestamp: string;
  version: string;
  sessionId: string;
  checksum: string;
}

export function useAutoSave({
  key,
  data,
  enabled = true,
  interval = 60000, // 1 minute default
  onSave,
  onRestore,
  onError,
  onConflict,
  enableRecovery = true,
  maxVersions = 5,
}: AutoSaveOptions) {
  const [state, setState] = useState<AutoSaveState>({
    lastSaved: null,
    isSaving: false,
    hasUnsavedChanges: false,
    hasRecoveryData: false,
    conflictDetected: false,
  });
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>("");
  const isInitializedRef = useRef(false);
  const sessionIdRef = useRef<string>(generateSessionId());

  // Generate session ID
  function generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate checksum for data integrity
  function generateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Save data to localStorage with versioning
  const saveData = useCallback(async () => {
    if (!enabled || !data) return;

    try {
      setState(prev => ({ ...prev, isSaving: true }));
      
      const timestamp = new Date().toISOString();
      const checksum = generateChecksum(data);
      
      const dataToSave: SavedData = {
        data,
        timestamp,
        version: "2.0",
        sessionId: sessionIdRef.current,
        checksum,
      };
      
      // Check for conflicts before saving
      const existing = localStorage.getItem(key);
      if (existing && enableRecovery) {
        try {
          const existingData: SavedData = JSON.parse(existing);
          if (existingData.sessionId !== sessionIdRef.current && 
              existingData.timestamp > (state.lastSaved?.toISOString() || "")) {
            // Conflict detected
            setState(prev => ({ ...prev, conflictDetected: true, isSaving: false }));
            
            if (onConflict) {
              const resolvedData = onConflict(data, existingData.data);
              dataToSave.data = resolvedData;
            } else {
              // Default: keep local changes but warn user
              console.warn("Auto-save conflict detected. Local changes preserved.");
            }
          }
        } catch (parseError) {
          console.warn("Could not parse existing auto-save data:", parseError);
        }
      }
      
      localStorage.setItem(key, JSON.stringify(dataToSave));
      
      // Save version history if enabled
      if (enableRecovery) {
        saveVersionHistory(key, dataToSave);
      }
      
      setState(prev => ({
        ...prev,
        lastSaved: new Date(),
        isSaving: false,
        hasUnsavedChanges: false,
        conflictDetected: false,
      }));
      
      onSave?.(data);
    } catch (error) {
      setState(prev => ({ ...prev, isSaving: false }));
      onError?.(error as Error);
    }
  }, [key, data, enabled, onSave, onError, onConflict, enableRecovery, state.lastSaved]);

  // Save version history
  const saveVersionHistory = useCallback((storageKey: string, saveData: SavedData) => {
    try {
      const historyKey = `${storageKey}_history`;
      const existing = localStorage.getItem(historyKey);
      let history: SavedData[] = existing ? JSON.parse(existing) : [];
      
      // Add new version
      history.unshift(saveData);
      
      // Keep only maxVersions
      if (history.length > maxVersions) {
        history = history.slice(0, maxVersions);
      }
      
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (error) {
      console.warn("Could not save version history:", error);
    }
  }, [maxVersions]);

  // Restore data from localStorage
  const restoreData = useCallback(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed: SavedData = JSON.parse(saved);
        if (parsed.data && parsed.timestamp) {
          // Verify data integrity if checksum exists
          if (parsed.checksum) {
            const expectedChecksum = generateChecksum(parsed.data);
            if (parsed.checksum !== expectedChecksum) {
              console.warn("Auto-save data integrity check failed");
              return null;
            }
          }
          
          onRestore?.(parsed.data);
          setState(prev => ({
            ...prev,
            lastSaved: new Date(parsed.timestamp),
            hasRecoveryData: true,
          }));
          return parsed.data;
        }
      }
    } catch (error) {
      onError?.(error as Error);
    }
    return null;
  }, [key, onRestore, onError]);

  // Get version history
  const getVersionHistory = useCallback((): SavedData[] => {
    try {
      const historyKey = `${key}_history`;
      const existing = localStorage.getItem(historyKey);
      return existing ? JSON.parse(existing) : [];
    } catch (error) {
      console.warn("Could not retrieve version history:", error);
      return [];
    }
  }, [key]);

  // Restore from version history
  const restoreFromVersion = useCallback((version: SavedData) => {
    try {
      onRestore?.(version.data);
      setState(prev => ({
        ...prev,
        lastSaved: new Date(version.timestamp),
      }));
      return version.data;
    } catch (error) {
      onError?.(error as Error);
      return null;
    }
  }, [onRestore, onError]);

  // Clear saved data and history
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_history`);
      setState(prev => ({
        ...prev,
        lastSaved: null,
        hasUnsavedChanges: false,
        hasRecoveryData: false,
        conflictDetected: false,
      }));
    } catch (error) {
      onError?.(error as Error);
    }
  }, [key, onError]);

  // Check if data has changed
  useEffect(() => {
    if (!enabled) return;

    const currentDataString = JSON.stringify(data);
    
    if (!isInitializedRef.current) {
      lastDataRef.current = currentDataString;
      isInitializedRef.current = true;
      return;
    }

    const hasChanged = currentDataString !== lastDataRef.current;
    
    if (hasChanged) {
      setState(prev => ({ ...prev, hasUnsavedChanges: true }));
      lastDataRef.current = currentDataString;
    }
  }, [data, enabled]);

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled || !state.hasUnsavedChanges) return;

    intervalRef.current = setInterval(() => {
      if (state.hasUnsavedChanges && !state.isSaving) {
        saveData();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, state.hasUnsavedChanges, state.isSaving, interval, saveData]);

  // Manual save function
  const save = useCallback(() => {
    if (enabled && state.hasUnsavedChanges && !state.isSaving) {
      saveData();
    }
  }, [enabled, state.hasUnsavedChanges, state.isSaving, saveData]);

  // Warn user about unsaved changes before leaving
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled, state.hasUnsavedChanges]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Check for recovery data on mount
  useEffect(() => {
    if (enableRecovery) {
      const saved = localStorage.getItem(key);
      if (saved) {
        setState(prev => ({ ...prev, hasRecoveryData: true }));
      }
    }
  }, [key, enableRecovery]);

  return {
    ...state,
    save,
    restoreData,
    clearSavedData,
    getVersionHistory,
    restoreFromVersion,
  };
}