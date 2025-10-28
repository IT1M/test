"use client";

import { useState, useEffect, useCallback } from 'react';

const SEARCH_HISTORY_KEY = 'inventory_search_history';
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  filters?: Record<string, any>;
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
        if (stored) {
          const parsed: SearchHistoryItem[] = JSON.parse(stored);
          const queries = parsed
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(item => item.query)
            .slice(0, MAX_HISTORY_ITEMS);
          setHistory(queries);
        }
      } catch (error) {
        console.warn('Failed to load search history:', error);
      }
    }
  }, []);

  // Add search to history
  const addToHistory = useCallback((query: string, filters?: Record<string, any>) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
      filters
    };

    try {
      // Get existing history
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      let existingHistory: SearchHistoryItem[] = [];
      
      if (stored) {
        existingHistory = JSON.parse(stored);
      }

      // Remove duplicate if exists
      existingHistory = existingHistory.filter(item => item.query !== newItem.query);

      // Add new item to beginning
      existingHistory.unshift(newItem);

      // Keep only the most recent items
      existingHistory = existingHistory.slice(0, MAX_HISTORY_ITEMS);

      // Save to localStorage
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(existingHistory));

      // Update state
      setHistory(existingHistory.map(item => item.query));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
      setHistory([]);
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  }, []);

  // Remove specific item from history
  const removeFromHistory = useCallback((query: string) => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        let existingHistory: SearchHistoryItem[] = JSON.parse(stored);
        existingHistory = existingHistory.filter(item => item.query !== query);
        
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(existingHistory));
        setHistory(existingHistory.map(item => item.query));
      }
    } catch (error) {
      console.warn('Failed to remove from search history:', error);
    }
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory
  };
}