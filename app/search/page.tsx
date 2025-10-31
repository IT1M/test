'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, ChevronUp, Package, Users, ShoppingCart, User, FileText, Clock, Star, Trash2, Save, BarChart3, Download, FileSpreadsheet, FileText as FileTextIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getGeminiService } from '@/services/gemini/client';
import { SearchService, type GroupedSearchResults, type SearchResult } from '@/services/gemini/search';
import { searchHistoryService, type SavedSearch, type SearchAnalytics } from '@/services/database/search-history';
import { exportSearchResults } from '@/lib/utils/export';
import type { Product, Customer, Order, Patient, MedicalRecord, SearchHistory } from '@/types/database';
import Link from 'next/link';
import toast from 'react-hot-toast';

/**
 * Universal Search Page
 * Natural language search interface with AI-powered results
 */
export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityType, setEntityType] = useState<'all' | 'products' | 'customers' | 'orders' | 'patients'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GroupedSearchResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search history and saved searches
  const [recentSearches, setRecentSearches] = useState<SearchHistory[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Advanced filter states
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Load search history and saved searches on mount
  useEffect(() => {
    loadSearchHistory();
    loadSavedSearches();
  }, []);

  const loadSearchHistory = async () => {
    const history = await searchHistoryService.getRecentSearches('system', 10);
    setRecentSearches(history);
  };

  const loadSavedSearches = () => {
    const saved = searchHistoryService.getSavedSearches('system');
    setSavedSearches(saved);
  };

  const loadAnalytics = async () => {
    const analytics = await searchHistoryService.getSearchAnalytics('system', 30);
    setSearchAnalytics(analytics);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);

    try {
      const gemini = getGeminiService();
      const searchService = new SearchService(gemini);

      const filters: any = {
        entityType,
      };

      if (dateRange.from && dateRange.to) {
        filters.dateRange = {
          from: new Date(dateRange.from),
          to: new Date(dateRange.to),
        };
      }

      if (priceRange.min || priceRange.max) {
        filters.priceRange = {
          min: priceRange.min ? parseFloat(priceRange.min) : 0,
          max: priceRange.max ? parseFloat(priceRange.max) : Infinity,
        };
      }

      if (statusFilter) {
        filters.status = statusFilter;
      }

      if (categoryFilter) {
        filters.category = categoryFilter;
      }

      const results = await searchService.search(searchQuery, filters);
      setSearchResults(results);

      // Save to search history
      await searchHistoryService.saveSearchHistory(
        searchQuery,
        entityType,
        results.totalResults,
        'system'
      );

      // Reload search history
      await loadSearchHistory();
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to perform search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) {
      toast.error('Please enter a name for the saved search');
      return;
    }

    const filters: any = {};
    if (dateRange.from && dateRange.to) {
      filters.dateRange = { from: dateRange.from, to: dateRange.to };
    }
    if (priceRange.min || priceRange.max) {
      filters.priceRange = { min: priceRange.min, max: priceRange.max };
    }
    if (statusFilter) filters.status = statusFilter;
    if (categoryFilter) filters.category = categoryFilter;

    searchHistoryService.saveSearch(
      saveSearchName,
      searchQuery,
      entityType,
      filters,
      'system'
    );

    loadSavedSearches();
    setShowSaveDialog(false);
    setSaveSearchName('');
    toast.success('Search saved successfully');
  };

  const handleLoadSavedSearch = (saved: SavedSearch) => {
    setSearchQuery(saved.query);
    setEntityType(saved.entityType);

    if (saved.filters) {
      if (saved.filters.dateRange) {
        setDateRange(saved.filters.dateRange);
      }
      if (saved.filters.priceRange) {
        setPriceRange(saved.filters.priceRange);
      }
      if (saved.filters.status) {
        setStatusFilter(saved.filters.status);
      }
      if (saved.filters.category) {
        setCategoryFilter(saved.filters.category);
      }
    }

    toast.success(`Loaded saved search: ${saved.name}`);
  };

  const handleDeleteSavedSearch = (searchId: string) => {
    searchHistoryService.deleteSavedSearch(searchId, 'system');
    loadSavedSearches();
    toast.success('Saved search deleted');
  };

  const handleClearHistory = async () => {
    await searchHistoryService.clearSearchHistory('system');
    await loadSearchHistory();
    toast.success('Search history cleared');
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (!searchResults) {
      toast.error('No search results to export');
      return;
    }

    try {
      exportSearchResults(
        {
          products: searchResults.products.map(r => r.entity as Product),
          customers: searchResults.customers.map(r => r.entity as Customer),
          orders: searchResults.orders.map(r => r.entity as Order),
          patients: searchResults.patients.map(r => r.entity as Patient),
          medicalRecords: searchResults.medicalRecords.map(r => r.entity as MedicalRecord),
        },
        format,
        'search-results'
      );
      toast.success(`Exported to ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export results');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setDateRange({ from: '', to: '' });
    setPriceRange({ min: '', max: '' });
    setStatusFilter('');
    setCategoryFilter('');
  };

  const placeholderExamples = [
    'Find all orders from last month',
    'Show me low stock medical supplies',
    'Which customers haven\'t ordered in 3 months?',
    'Products expiring in next 30 days',
    'Patients with diabetes diagnosis',
  ];

  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Universal Search</h1>
          <p className="text-gray-600">
            Search across all entities using natural language. Ask questions in plain English.
          </p>
        </div>

        {/* Main Search Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowSearchHistory(true)}
                onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                placeholder={placeholderExamples[currentPlaceholder]}
                className="pl-12 pr-4 py-6 text-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              {/* Search History Dropdown */}
              {showSearchHistory && recentSearches.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  <div className="p-2">
                    <div className="flex items-center justify-between px-2 py-1 mb-2">
                      <span className="text-sm font-semibold text-gray-700">Recent Searches</span>
                      <button
                        onClick={handleClearHistory}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    </div>
                    {recentSearches.map((search) => (
                      <button
                        key={search.id}
                        onClick={() => {
                          setSearchQuery(search.query);
                          setEntityType(search.entityType);
                          setShowSearchHistory(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{search.query}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {search.results} results
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Entity Type Filters */}
            <div className="mb-4">
              <Tabs value={entityType} onValueChange={(value: any) => setEntityType(value)}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="customers">Customers</TabsTrigger>
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="patients">Patients</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Advanced Filters Toggle and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                  {showAdvancedFilters ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {searchQuery && (
                  <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Save Search
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Save Search</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Name
                          </label>
                          <Input
                            value={saveSearchName}
                            onChange={(e) => setSaveSearchName(e.target.value)}
                            placeholder="e.g., Low stock products"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveSearch}>Save</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <Button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                className="px-8"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-sm"
                  >
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Range
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        placeholder="From"
                      />
                      <Input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        placeholder="To"
                      />
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Range
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        placeholder="Min"
                      />
                      <Input
                        type="number"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        placeholder="Max"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      <option value="medical-equipment">Medical Equipment</option>
                      <option value="pharmaceuticals">Pharmaceuticals</option>
                      <option value="supplies">Supplies</option>
                      <option value="diagnostics">Diagnostics</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved Searches and Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Saved Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedSearches.map((saved) => (
                    <div
                      key={saved.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
                    >
                      <button
                        onClick={() => handleLoadSavedSearch(saved)}
                        className="flex-1 text-left"
                      >
                        <div className="font-semibold text-gray-900">{saved.name}</div>
                        <div className="text-sm text-gray-600">{saved.query}</div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {saved.entityType}
                        </Badge>
                      </button>
                      <button
                        onClick={() => handleDeleteSavedSearch(saved.id)}
                        className="text-gray-400 hover:text-red-600 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Search Analytics
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    loadAnalytics();
                    setShowAnalytics(!showAnalytics);
                  }}
                  className="ml-auto"
                >
                  {showAnalytics ? 'Hide' : 'Show'}
                </Button>
              </CardTitle>
            </CardHeader>
            {showAnalytics && searchAnalytics && (
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Most Searched Terms
                    </div>
                    <div className="space-y-1">
                      {searchAnalytics.mostSearchedTerms.slice(0, 5).map((term, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{term.term}</span>
                          <Badge variant="outline">{term.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Total Searches</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {searchAnalytics.totalSearches}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">Avg Results</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {searchAnalytics.averageResultsPerSearch.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Search Tips */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Search Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Natural Language Queries</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• "Show me all orders from last week"</li>
                  <li>• "Which products are low in stock?"</li>
                  <li>• "Find customers in New York"</li>
                  <li>• "Patients with high blood pressure"</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Specific Searches</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Use product SKU or name</li>
                  <li>• Search by customer ID or email</li>
                  <li>• Find orders by order number</li>
                  <li>• Search patients by national ID</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchResults && (
          <div className="space-y-6">
            {/* Results Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Search Results
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Found {searchResults.totalResults} results for "{searchQuery}"
                    </p>
                  </div>

                  {/* Export Buttons */}
                  {searchResults.totalResults > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('csv')}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('excel')}
                        className="flex items-center gap-2"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport('pdf')}
                        className="flex items-center gap-2"
                      >
                        <FileTextIcon className="h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Products Results */}
            {searchResults.products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Products ({searchResults.products.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.products.map((result) => (
                      <ProductResult key={(result.entity as Product).id} result={result} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customers Results */}
            {searchResults.customers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Customers ({searchResults.customers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.customers.map((result) => (
                      <CustomerResult key={(result.entity as Customer).id} result={result} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Orders Results */}
            {searchResults.orders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Orders ({searchResults.orders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.orders.map((result) => (
                      <OrderResult key={(result.entity as Order).id} result={result} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Patients Results */}
            {searchResults.patients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Patients ({searchResults.patients.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.patients.map((result) => (
                      <PatientResult key={(result.entity as Patient).id} result={result} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medical Records Results */}
            {searchResults.medicalRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Medical Records ({searchResults.medicalRecords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.medicalRecords.map((result) => (
                      <MedicalRecordResult key={(result.entity as MedicalRecord).id} result={result} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Results */}
            {searchResults.totalResults === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your search query or filters
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Result Components
function ProductResult({ result }: { result: SearchResult }) {
  const product = result.entity as Product;
  return (
    <Link href={`/products/${product.id}`}>
      <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">{product.name}</h4>
              <Badge variant="outline" className="text-xs">
                {(result.confidence * 100).toFixed(0)}% match
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
            <p className="text-sm text-gray-500">{product.description}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-600">
                Category: {product.category}
              </span>
              <span className="text-sm text-gray-600">
                Price: ${product.unitPrice.toFixed(2)}
              </span>
              <span className="text-sm text-gray-600">
                Stock: {product.stockQuantity}
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 italic">{result.matchReason}</p>
      </div>
    </Link>
  );
}

function CustomerResult({ result }: { result: SearchResult }) {
  const customer = result.entity as Customer;
  return (
    <Link href={`/customers/${customer.id}`}>
      <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">{customer.name}</h4>
              <Badge variant="outline" className="text-xs">
                {(result.confidence * 100).toFixed(0)}% match
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-2">ID: {customer.customerId}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-600">Type: {customer.type}</span>
              <span className="text-sm text-gray-600">Email: {customer.email}</span>
              <span className="text-sm text-gray-600">Phone: {customer.phone}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 italic">{result.matchReason}</p>
      </div>
    </Link>
  );
}

function OrderResult({ result }: { result: SearchResult }) {
  const order = result.entity as Order;
  return (
    <Link href={`/orders/${order.id}`}>
      <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">Order {order.orderId}</h4>
              <Badge variant="outline" className="text-xs">
                {(result.confidence * 100).toFixed(0)}% match
              </Badge>
              <Badge>{order.status}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-600">
                Date: {order.orderDate.toLocaleDateString()}
              </span>
              <span className="text-sm text-gray-600">
                Total: ${order.totalAmount.toFixed(2)}
              </span>
              <span className="text-sm text-gray-600">
                Items: {order.items.length}
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 italic">{result.matchReason}</p>
      </div>
    </Link>
  );
}

function PatientResult({ result }: { result: SearchResult }) {
  const patient = result.entity as Patient;
  return (
    <Link href={`/patients/${patient.id}`}>
      <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h4>
              <Badge variant="outline" className="text-xs">
                {(result.confidence * 100).toFixed(0)}% match
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-2">ID: {patient.patientId}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-600">
                National ID: {patient.nationalId}
              </span>
              <span className="text-sm text-gray-600">Gender: {patient.gender}</span>
              <span className="text-sm text-gray-600">Phone: {patient.phone}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 italic">{result.matchReason}</p>
      </div>
    </Link>
  );
}

function MedicalRecordResult({ result }: { result: SearchResult }) {
  const record = result.entity as MedicalRecord;
  return (
    <Link href={`/medical-records/${record.id}`}>
      <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">{record.title}</h4>
              <Badge variant="outline" className="text-xs">
                {(result.confidence * 100).toFixed(0)}% match
              </Badge>
              <Badge>{record.recordType}</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Date: {record.visitDate.toLocaleDateString()}
            </p>
            {record.diagnosis && (
              <p className="text-sm text-gray-500">Diagnosis: {record.diagnosis}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 italic">{result.matchReason}</p>
      </div>
    </Link>
  );
}
