'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck,
  RefreshCw,
  Plus,
  Save,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { InventoryService } from '@/services/database/inventory';
import { ProductService } from '@/services/database/products';
import { formatDate } from '@/lib/utils/formatters';
import type { Inventory, Product } from '@/types/database';
import toast from 'react-hot-toast';

interface StockTakeItem {
  productId: string;
  productName: string;
  productSKU: string;
  location: string;
  expectedQuantity: number;
  countedQuantity: number | null;
  variance: number;
  status: 'pending' | 'counted' | 'adjusted';
}

interface StockTakeSession {
  id: string;
  date: Date;
  location: string;
  items: StockTakeItem[];
  status: 'in-progress' | 'completed';
  completedAt?: Date;
}

export default function StockTakePage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<StockTakeSession[]>([]);
  const [currentSession, setCurrentSession] = useState<StockTakeSession | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load warehouse locations
      const locs = await InventoryService.getWarehouseLocations();
      setLocations(locs);

      // Load saved sessions from localStorage
      const savedSessions = localStorage.getItem('stockTakeSessions');
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        // Convert date strings back to Date objects
        const sessionsWithDates = parsed.map((s: any) => ({
          ...s,
          date: new Date(s.date),
          completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
        }));
        setSessions(sessionsWithDates);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load stock take data');
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = async () => {
    if (!selectedLocation) {
      toast.error('Please select a location');
      return;
    }

    try {
      // Get all inventory for the selected location
      const inventory = await InventoryService.getInventoryByLocation(selectedLocation);

      // Build stock take items
      const items: StockTakeItem[] = await Promise.all(
        inventory.map(async (inv) => {
          const product = await ProductService.getProductById(inv.productId);
          return {
            productId: inv.productId,
            productName: product?.name || 'Unknown',
            productSKU: product?.sku || 'N/A',
            location: inv.warehouseLocation,
            expectedQuantity: inv.quantity,
            countedQuantity: null,
            variance: 0,
            status: 'pending' as const,
          };
        })
      );

      const newSession: StockTakeSession = {
        id: `ST-${Date.now()}`,
        date: new Date(),
        location: selectedLocation,
        items,
        status: 'in-progress',
      };

      setCurrentSession(newSession);
      setShowNewSessionDialog(false);
      setSelectedLocation('');
      toast.success('Stock take session started');
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start stock take session');
    }
  };

  const updateCount = (index: number, count: number) => {
    if (!currentSession) return;

    const updatedItems = [...currentSession.items];
    updatedItems[index].countedQuantity = count;
    updatedItems[index].variance = count - updatedItems[index].expectedQuantity;
    updatedItems[index].status = 'counted';

    setCurrentSession({
      ...currentSession,
      items: updatedItems,
    });
  };

  const saveSession = () => {
    if (!currentSession) return;

    const updatedSessions = [...sessions, currentSession];
    setSessions(updatedSessions);
    localStorage.setItem('stockTakeSessions', JSON.stringify(updatedSessions));

    toast.success('Stock take session saved');
    setCurrentSession(null);
  };

  const completeSession = async () => {
    if (!currentSession) return;

    // Check if all items are counted
    const uncounted = currentSession.items.filter(item => item.countedQuantity === null);
    if (uncounted.length > 0) {
      toast.error(`${uncounted.length} items not counted yet`);
      return;
    }

    try {
      // Apply adjustments for items with variance
      const itemsWithVariance = currentSession.items.filter(item => item.variance !== 0);

      for (const item of itemsWithVariance) {
        await InventoryService.adjustStock({
          productId: item.productId,
          quantity: item.countedQuantity!,
          type: 'adjustment',
          reason: `Stock take adjustment - Session: ${currentSession.id}`,
          fromLocation: item.location,
          performedBy: 'current-user',
        });
      }

      // Mark session as completed
      const completedSession: StockTakeSession = {
        ...currentSession,
        status: 'completed',
        completedAt: new Date(),
        items: currentSession.items.map(item => ({
          ...item,
          status: 'adjusted' as const,
        })),
      };

      const updatedSessions = [...sessions, completedSession];
      setSessions(updatedSessions);
      localStorage.setItem('stockTakeSessions', JSON.stringify(updatedSessions));

      toast.success(`Stock take completed. ${itemsWithVariance.length} adjustments applied.`);
      setCurrentSession(null);
    } catch (error: any) {
      console.error('Error completing session:', error);
      toast.error(error.message || 'Failed to complete stock take');
    }
  };

  const cancelSession = () => {
    if (confirm('Are you sure you want to cancel this stock take session? All counts will be lost.')) {
      setCurrentSession(null);
      toast('Stock take session cancelled');
    }
  };

  const loadSession = (session: StockTakeSession) => {
    setCurrentSession(session);
  };

  const deleteSession = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      localStorage.setItem('stockTakeSessions', JSON.stringify(updatedSessions));
      toast.success('Session deleted');
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance === 0) return 'text-green-600';
    if (variance > 0) return 'text-blue-600';
    return 'text-red-600';
  };

  const getVarianceBadge = (variance: number) => {
    if (variance === 0) {
      return <Badge className="bg-green-100 text-green-800">Match</Badge>;
    } else if (variance > 0) {
      return <Badge className="bg-blue-100 text-blue-800">Surplus</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Shortage</Badge>;
    }
  };

  const calculateSummary = () => {
    if (!currentSession) return null;

    const counted = currentSession.items.filter(item => item.countedQuantity !== null).length;
    const total = currentSession.items.length;
    const withVariance = currentSession.items.filter(item => item.variance !== 0).length;
    const totalVariance = currentSession.items.reduce((sum, item) => sum + Math.abs(item.variance), 0);

    return {
      counted,
      total,
      withVariance,
      totalVariance,
      progress: (counted / total) * 100,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading stock take data...</p>
        </div>
      </div>
    );
  }

  // Show current session if active
  if (currentSession) {
    const summary = calculateSummary();

    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Take - {currentSession.id}</h1>
            <p className="text-gray-600 mt-1">
              Location: {currentSession.location} • Started: {formatDate(currentSession.date)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={cancelSession} variant="outline">
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={saveSession} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save Progress
            </Button>
            <Button onClick={completeSession}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete & Apply
            </Button>
          </div>
        </div>

        {/* Progress Summary */}
        {summary && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-2xl font-bold">
                    {summary.counted} / {summary.total}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${summary.progress}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Items with Variance</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.withVariance}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Variance</p>
                  <p className="text-2xl font-bold text-red-600">{summary.totalVariance}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summary.counted > 0
                      ? ((1 - summary.withVariance / summary.counted) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock Take Items */}
        <Card>
          <CardHeader>
            <CardTitle>Count Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentSession.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-600">SKU: {item.productSKU}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Expected</p>
                    <p className="font-semibold">{item.expectedQuantity}</p>
                  </div>
                  <div className="w-32">
                    <Label>Counted</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.countedQuantity ?? ''}
                      onChange={(e) => updateCount(index, parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className={item.countedQuantity !== null ? 'border-green-500' : ''}
                    />
                  </div>
                  {item.countedQuantity !== null && (
                    <>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Variance</p>
                        <p className={`font-semibold ${getVarianceColor(item.variance)}`}>
                          {item.variance > 0 ? '+' : ''}
                          {item.variance}
                        </p>
                      </div>
                      <div>{getVarianceBadge(item.variance)}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show sessions list
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Take</h1>
          <p className="text-gray-600 mt-1">Physical inventory counting and variance reporting</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowNewSessionDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Stock Take
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="grid gap-4">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ClipboardCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No stock take sessions found</p>
                <Button onClick={() => setShowNewSessionDialog(true)} className="mt-4">
                  Start Your First Stock Take
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{session.id}</h3>
                      <Badge
                        className={
                          session.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {session.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Location</p>
                        <p className="font-medium">{session.location}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-medium">{formatDate(session.date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Items</p>
                        <p className="font-medium">{session.items.length}</p>
                      </div>
                    </div>
                    {session.status === 'completed' && session.completedAt && (
                      <p className="text-sm text-gray-600 mt-2">
                        Completed: {formatDate(session.completedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {session.status === 'in-progress' && (
                      <Button size="sm" onClick={() => loadSession(session)}>
                        Continue
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteSession(session.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Session Dialog */}
      {showNewSessionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Start New Stock Take</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="location">Select Location *</Label>
                  <select
                    id="location"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Choose a location...</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewSessionDialog(false);
                      setSelectedLocation('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={startNewSession}>Start Stock Take</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
