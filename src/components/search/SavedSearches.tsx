"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';

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

export interface SavedSearchesProps {
  onSearchSelect: (search: SavedSearch) => void;
  onSave?: (data: { name: string; description?: string; query: string; filters: Record<string, any> }) => void;
  currentQuery?: string;
  currentFilters?: Record<string, any>;
  className?: string;
}

export function SavedSearches({
  onSearchSelect,
  onSave,
  currentQuery = '',
  currentFilters = {},
  className
}: SavedSearchesProps) {
  const [searches, setSearches] = useState<{
    own: SavedSearch[];
    shared: SavedSearch[];
    public: SavedSearch[];
  }>({ own: [], shared: [], public: [] });
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch saved searches
  const fetchSearches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/search/saved?includeShared=true&includePublic=true');
      const result = await response.json();

      if (result.success) {
        setSearches(result.data);
      } else {
        showToast('Failed to load saved searches', 'error');
      }
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      showToast('Error loading saved searches', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearches();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSaveSearch = async (data: { name: string; description?: string; isPublic?: boolean }) => {
    try {
      const response = await fetch('/api/search/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          query: currentQuery,
          filters: currentFilters,
          isPublic: data.isPublic || false
        })
      });

      const result = await response.json();

      if (result.success) {
        showToast('Search saved successfully', 'success');
        setShowSaveModal(false);
        fetchSearches();
        if (onSave) {
          onSave({
            name: data.name,
            description: data.description,
            query: currentQuery,
            filters: currentFilters
          });
        }
      } else {
        showToast(result.error?.message || 'Failed to save search', 'error');
      }
    } catch (error) {
      console.error('Error saving search:', error);
      showToast('Error saving search', 'error');
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) {
      return;
    }

    try {
      const response = await fetch(`/api/search/saved/${searchId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        showToast('Search deleted successfully', 'success');
        fetchSearches();
      } else {
        showToast(result.error?.message || 'Failed to delete search', 'error');
      }
    } catch (error) {
      console.error('Error deleting search:', error);
      showToast('Error deleting search', 'error');
    }
  };

  const canSaveCurrentSearch = currentQuery.trim().length > 0;

  if (loading) {
    return (
      <div className={cn("p-4", className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-secondary-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-secondary-200 rounded"></div>
            <div className="h-8 bg-secondary-200 rounded"></div>
            <div className="h-8 bg-secondary-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          Saved Searches
        </h3>
        <div className="flex gap-2">
          {canSaveCurrentSearch && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSaveModal(true)}
            >
              Save Current Search
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManageModal(true)}
          >
            Manage
          </Button>
        </div>
      </div>

      {/* Search Lists */}
      <div className="space-y-6">
        {/* Own Searches */}
        {searches.own.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              My Searches ({searches.own.length})
            </h4>
            <div className="space-y-2">
              {searches.own.map((search) => (
                <SearchItem
                  key={search.id}
                  search={search}
                  onSelect={() => onSearchSelect(search)}
                  onDelete={() => handleDeleteSearch(search.id)}
                  onEdit={() => setEditingSearch(search)}
                  showOwnerActions
                />
              ))}
            </div>
          </div>
        )}

        {/* Shared Searches */}
        {searches.shared.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Shared with Me ({searches.shared.length})
            </h4>
            <div className="space-y-2">
              {searches.shared.map((search) => (
                <SearchItem
                  key={search.id}
                  search={search}
                  onSelect={() => onSearchSelect(search)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Public Searches */}
        {searches.public.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
              Public Searches ({searches.public.length})
            </h4>
            <div className="space-y-2">
              {searches.public.slice(0, 5).map((search) => (
                <SearchItem
                  key={search.id}
                  search={search}
                  onSelect={() => onSearchSelect(search)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {searches.own.length === 0 && searches.shared.length === 0 && searches.public.length === 0 && (
          <div className="text-center py-8 text-secondary-500 dark:text-secondary-400">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <p className="text-sm">No saved searches yet</p>
            {canSaveCurrentSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveModal(true)}
                className="mt-2"
              >
                Save your first search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Save Search Modal */}
      <SaveSearchModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveSearch}
        currentQuery={currentQuery}
        currentFilters={currentFilters}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

interface SearchItemProps {
  search: SavedSearch;
  onSelect: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  showOwnerActions?: boolean;
}

function SearchItem({ search, onSelect, onDelete, onEdit, showOwnerActions }: SearchItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border",
      "bg-white dark:bg-secondary-900",
      "border-secondary-200 dark:border-secondary-700",
      "hover:border-primary-300 dark:hover:border-primary-600",
      "transition-colors cursor-pointer"
    )}>
      <div className="flex-1 min-w-0" onClick={onSelect}>
        <div className="flex items-center gap-2 mb-1">
          <h5 className="font-medium text-secondary-900 dark:text-secondary-100 truncate">
            {search.name}
          </h5>
          <div className="flex gap-1">
            {search.isPublic && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                Public
              </span>
            )}
            {search.isShared && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Shared
              </span>
            )}
          </div>
        </div>
        
        <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate mb-1">
          {search.query}
        </p>
        
        <div className="flex items-center gap-4 text-xs text-secondary-500 dark:text-secondary-400">
          <span>By {search.createdBy.name}</span>
          <span>{formatDate(search.updatedAt)}</span>
          {search._count?.sharedWith && search._count.sharedWith > 0 && (
            <span>{search._count.sharedWith} shares</span>
          )}
        </div>
      </div>

      {showOwnerActions && (
        <div className="flex items-center gap-1 ml-3">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 h-8 w-8"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 h-8 w-8 text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface SaveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string; isPublic?: boolean }) => void;
  currentQuery: string;
  currentFilters: Record<string, any>;
}

function SaveSearchModal({ isOpen, onClose, onSave, currentQuery, currentFilters }: SaveSearchModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic
      });
      setName('');
      setDescription('');
      setIsPublic(false);
    } finally {
      setSaving(false);
    }
  };

  const filterCount = Object.keys(currentFilters).filter(key => {
    const value = currentFilters[key];
    return value !== undefined && value !== null && value !== '' && 
           !(Array.isArray(value) && value.length === 0);
  }).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Search">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Search Preview
          </label>
          <div className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
            <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 mb-1">
              Query: "{currentQuery}"
            </p>
            <p className="text-xs text-secondary-600 dark:text-secondary-400">
              {filterCount} filter{filterCount !== 1 ? 's' : ''} applied
            </p>
          </div>
        </div>

        <Input
          label="Search Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name for this search..."
          required
          maxLength={100}
        />

        <div>
          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description to help others understand this search..."
            maxLength={500}
            rows={3}
            className={cn(
              "w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600",
              "rounded-lg bg-white dark:bg-secondary-900",
              "text-secondary-900 dark:text-secondary-100",
              "placeholder:text-secondary-500 dark:placeholder:text-secondary-400",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
              "dark:focus:ring-primary-400 dark:focus:border-primary-400"
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="isPublic" className="text-sm text-secondary-700 dark:text-secondary-300">
            Make this search public (visible to all users)
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={!name.trim() || saving}
            loading={saving}
            className="flex-1"
          >
            Save Search
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}