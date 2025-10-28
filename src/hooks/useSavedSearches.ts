"use client";

import { useState, useEffect, useCallback } from 'react';

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  query: string;
  filters: Record<string, any>;
  isShared: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  sharedWith?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
    canEdit: boolean;
  }>;
  _count?: {
    sharedWith: number;
  };
}

export interface SavedSearchesData {
  own: SavedSearch[];
  shared: SavedSearch[];
  public: SavedSearch[];
}

export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearchesData>({
    own: [],
    shared: [],
    public: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all saved searches
  const fetchSearches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/search/saved?includeShared=true&includePublic=true');
      const result = await response.json();

      if (result.success) {
        setSearches(result.data);
      } else {
        throw new Error(result.error?.message || 'Failed to fetch saved searches');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching saved searches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new saved search
  const createSearch = useCallback(async (data: {
    name: string;
    description?: string;
    query: string;
    filters: Record<string, any>;
    isPublic?: boolean;
    sharedUserIds?: string[];
  }) => {
    try {
      const response = await fetch('/api/search/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the searches list
        await fetchSearches();
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to create saved search');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, [fetchSearches]);

  // Update an existing saved search
  const updateSearch = useCallback(async (id: string, data: {
    name?: string;
    description?: string;
    query?: string;
    filters?: Record<string, any>;
    isPublic?: boolean;
    sharedUserIds?: string[];
  }) => {
    try {
      const response = await fetch(`/api/search/saved/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the searches list
        await fetchSearches();
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to update saved search');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, [fetchSearches]);

  // Delete a saved search
  const deleteSearch = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/search/saved/${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the searches list
        await fetchSearches();
        return true;
      } else {
        throw new Error(result.error?.message || 'Failed to delete saved search');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, [fetchSearches]);

  // Get a specific saved search
  const getSearch = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/search/saved/${id}`);
      const result = await response.json();

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error?.message || 'Failed to fetch saved search');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Get all searches (own + shared + public) as a flat array
  const getAllSearches = useCallback(() => {
    return [
      ...searches.own,
      ...searches.shared,
      ...searches.public
    ];
  }, [searches]);

  // Get searches for suggestions (recent and frequently used)
  const getSearchSuggestions = useCallback((limit: number = 5) => {
    const allSearches = getAllSearches();
    
    // Sort by most recently updated
    return allSearches
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit)
      .map(search => ({
        id: search.id,
        value: search.query,
        label: search.name,
        type: 'saved' as const,
        description: search.description || `Saved search by ${search.createdBy.name}`,
        metadata: {
          filters: search.filters,
          isShared: search.isShared,
          isPublic: search.isPublic
        }
      }));
  }, [getAllSearches]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  return {
    searches,
    loading,
    error,
    fetchSearches,
    createSearch,
    updateSearch,
    deleteSearch,
    getSearch,
    getAllSearches,
    getSearchSuggestions,
    clearError
  };
}