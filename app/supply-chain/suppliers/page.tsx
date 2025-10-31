'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Star, TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SupplierService } from '@/services/database/suppliers';
import type { Supplier } from '@/types/database';
import Link from 'next/link';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadSuppliers();
    loadStats();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchQuery, statusFilter, typeFilter]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await SupplierService.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await SupplierService.getSupplierStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterSuppliers = () => {
    let filtered = [...suppliers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.supplierId.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.country.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(s => s.type === typeFilter);
    }

    setFilteredSuppliers(filtered);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      inactive: 'secondary',
      blacklisted: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      manufacturer: 'bg-blue-100 text-blue-800',
      distributor: 'bg-green-100 text-green-800',
      wholesaler: 'bg-purple-100 text-purple-800',
      'service-provider': 'bg-orange-100 text-orange-800',
    };
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type.replace('-', ' ')}
      </Badge>
    );
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading suppliers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supplier Management</h1>
          <p className="text-gray-600 mt-1">Manage and evaluate your suppliers</p>
        </div>
        <Link href="/supply-chain/suppliers/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Suppliers</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                {stats.active} active, {stats.inactive} inactive
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Preferred Suppliers</CardDescription>
              <CardTitle className="text-3xl flex items-center">
                <Award className="w-6 h-6 mr-2 text-yellow-500" />
                {stats.preferred}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                {((stats.preferred / stats.total) * 100).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average Rating</CardDescription>
              <CardTitle className="text-3xl">{stats.averageRating.toFixed(1)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                {getRatingStars(stats.averageRating)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Supplier Types</CardDescription>
              <CardTitle className="text-3xl">{Object.keys(stats.byType).length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                {Object.entries(stats.byType)
                  .slice(0, 2)
                  .map(([type, count]) => `${type}: ${count}`)
                  .join(', ')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search suppliers by name, ID, email, or country..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blacklisted">Blacklisted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="manufacturer">Manufacturer</SelectItem>
                <SelectItem value="distributor">Distributor</SelectItem>
                <SelectItem value="wholesaler">Wholesaler</SelectItem>
                <SelectItem value="service-provider">Service Provider</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSuppliers.map(supplier => (
          <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{supplier.name}</CardTitle>
                    {supplier.isPreferred && (
                      <Award className="w-5 h-5 text-yellow-500" title="Preferred Supplier" />
                    )}
                  </div>
                  <CardDescription className="space-y-1">
                    <div>ID: {supplier.supplierId}</div>
                    <div>{supplier.email} • {supplier.phone}</div>
                    <div>{supplier.city}, {supplier.country}</div>
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {getStatusBadge(supplier.status)}
                  {getTypeBadge(supplier.type)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Rating */}
              <div>
                <div className="text-sm font-medium mb-1">Overall Rating</div>
                {getRatingStars(supplier.rating)}
              </div>

              {/* Performance Scores */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Quality</div>
                  <div className={`text-lg font-bold ${getScoreColor(supplier.qualityScore)}`}>
                    {supplier.qualityScore}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Delivery</div>
                  <div className={`text-lg font-bold ${getScoreColor(supplier.deliveryScore)}`}>
                    {supplier.deliveryScore}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Price</div>
                  <div className={`text-lg font-bold ${getScoreColor(supplier.priceScore)}`}>
                    {supplier.priceScore}%
                  </div>
                </div>
              </div>

              {/* Business Terms */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Lead Time:</span>
                  <span className="ml-2 font-medium">{supplier.leadTime} days</span>
                </div>
                <div>
                  <span className="text-gray-600">Payment:</span>
                  <span className="ml-2 font-medium">{supplier.paymentTerms}</span>
                </div>
              </div>

              {/* Certifications */}
              {supplier.certifications && supplier.certifications.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Certifications</div>
                  <div className="flex flex-wrap gap-1">
                    {supplier.certifications.slice(0, 3).map((cert, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                    {supplier.certifications.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{supplier.certifications.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link href={`/supply-chain/suppliers/${supplier.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                </Link>
                <Link href={`/supply-chain/suppliers/${supplier.id}/evaluate`}>
                  <Button variant="outline">
                    Evaluate
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSuppliers.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first supplier'}
              </p>
              {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && (
                <Link href="/supply-chain/suppliers/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Supplier
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
