// Search History Service
// Manages search history and saved searches

import { db } from '@/lib/db/schema';
import type { SearchHistory } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Saved search interface
 */
export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  entityType: 'all' | 'products' | 'customers' | 'orders' | 'patients';
  filters?: any;
  createdAt: Date;
  userId: string;
}

/**
 * Search analytics interface
 */
export interface SearchAnalytics {
  mostSearchedTerms: Array<{ term: string; count: number }>;
  searchesByEntityType: Record<string, number>;
  totalSearches: number;
  averageResultsPerSearch: number;
  recentSearches: SearchHistory[];
}

/**
 * Search History Service Class
 */
export class SearchHistoryService {
  /**
   * Save a search query to history
   */
  async saveSearchHistory(
    query: string,
    entityType: 'all' | 'products' | 'customers' | 'orders' | 'patients',
    resultsCount: number,
    userId: string = 'system'
  ): Promise<void> {
    try {
      await db.searchHistory.add({
        id: uuidv4(),
        query,
        entityType,
        results: resultsCount,
        timestamp: new Date(),
        userId,
      });
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }

  /**
   * Get recent search history
   */
  async getRecentSearches(
    userId: string = 'system',
    limit: number = 10
  ): Promise<SearchHistory[]> {
    return db.searchHistory
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('timestamp')
      .then(results => results.slice(0, limit));
  }

  /**
   * Get all search history for a user
   */
  async getAllSearchHistory(userId: string = 'system'): Promise<SearchHistory[]> {
    return db.searchHistory
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('timestamp');
  }

  /**
   * Clear search history
   */
  async clearSearchHistory(userId: string = 'system'): Promise<void> {
    const userSearches = await db.searchHistory
      .where('userId')
      .equals(userId)
      .toArray();

    const ids = userSearches.map(s => s.id);
    await db.searchHistory.bulkDelete(ids);
  }

  /**
   * Delete a specific search from history
   */
  async deleteSearch(searchId: string): Promise<void> {
    await db.searchHistory.delete(searchId);
  }

  /**
   * Save a search for later use
   */
  async saveSearch(
    name: string,
    query: string,
    entityType: 'all' | 'products' | 'customers' | 'orders' | 'patients',
    filters?: any,
    userId: string = 'system'
  ): Promise<SavedSearch> {
    const savedSearch: SavedSearch = {
      id: uuidv4(),
      name,
      query,
      entityType,
      filters,
      createdAt: new Date(),
      userId,
    };

    // Store in localStorage since we don't have a dedicated table
    const savedSearches = this.getSavedSearches(userId);
    savedSearches.push(savedSearch);
    localStorage.setItem(`savedSearches_${userId}`, JSON.stringify(savedSearches));

    return savedSearch;
  }

  /**
   * Get all saved searches
   */
  getSavedSearches(userId: string = 'system'): SavedSearch[] {
    if (typeof window === 'undefined') return [];

    const saved = localStorage.getItem(`savedSearches_${userId}`);
    if (!saved) return [];

    try {
      const searches = JSON.parse(saved);
      // Convert date strings back to Date objects
      return searches.map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
      }));
    } catch (error) {
      console.error('Failed to parse saved searches:', error);
      return [];
    }
  }

  /**
   * Delete a saved search
   */
  deleteSavedSearch(searchId: string, userId: string = 'system'): void {
    const savedSearches = this.getSavedSearches(userId);
    const filtered = savedSearches.filter(s => s.id !== searchId);
    localStorage.setItem(`savedSearches_${userId}`, JSON.stringify(filtered));
  }

  /**
   * Update a saved search
   */
  updateSavedSearch(
    searchId: string,
    updates: Partial<SavedSearch>,
    userId: string = 'system'
  ): void {
    const savedSearches = this.getSavedSearches(userId);
    const index = savedSearches.findIndex(s => s.id === searchId);

    if (index !== -1) {
      savedSearches[index] = { ...savedSearches[index], ...updates };
      localStorage.setItem(`savedSearches_${userId}`, JSON.stringify(savedSearches));
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(
    userId: string = 'system',
    days: number = 30
  ): Promise<SearchAnalytics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const searches = await db.searchHistory
      .where('userId')
      .equals(userId)
      .and(s => s.timestamp >= startDate)
      .toArray();

    // Calculate most searched terms
    const termCounts = new Map<string, number>();
    searches.forEach(search => {
      const term = search.query.toLowerCase().trim();
      termCounts.set(term, (termCounts.get(term) || 0) + 1);
    });

    const mostSearchedTerms = Array.from(termCounts.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate searches by entity type
    const searchesByEntityType: Record<string, number> = {};
    searches.forEach(search => {
      searchesByEntityType[search.entityType] =
        (searchesByEntityType[search.entityType] || 0) + 1;
    });

    // Calculate average results per search
    const totalResults = searches.reduce((sum, s) => sum + s.results, 0);
    const averageResultsPerSearch =
      searches.length > 0 ? totalResults / searches.length : 0;

    // Get recent searches
    const recentSearches = searches
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      mostSearchedTerms,
      searchesByEntityType,
      totalSearches: searches.length,
      averageResultsPerSearch,
      recentSearches,
    };
  }

  /**
   * Get popular searches across all users
   */
  async getPopularSearches(limit: number = 10): Promise<Array<{ term: string; count: number }>> {
    const allSearches = await db.searchHistory.toArray();

    const termCounts = new Map<string, number>();
    allSearches.forEach(search => {
      const term = search.query.toLowerCase().trim();
      termCounts.set(term, (termCounts.get(term) || 0) + 1);
    });

    return Array.from(termCounts.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get search suggestions based on history
   */
  async getSearchSuggestions(
    partialQuery: string,
    userId: string = 'system',
    limit: number = 5
  ): Promise<string[]> {
    const searches = await db.searchHistory
      .where('userId')
      .equals(userId)
      .toArray();

    const lowerQuery = partialQuery.toLowerCase();
    const suggestions = searches
      .filter(s => s.query.toLowerCase().includes(lowerQuery))
      .map(s => s.query)
      .filter((query, index, self) => self.indexOf(query) === index) // Remove duplicates
      .slice(0, limit);

    return suggestions;
  }
}

// Export singleton instance
export const searchHistoryService = new SearchHistoryService();
