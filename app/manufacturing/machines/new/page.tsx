'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db/schema';
import { Machine, MachineStatus } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function NewMachinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    machineId: '',
    name: '',
    type: 'packaging',
    manufacturer: '',
    model: '',
    serialNumber: '',
    location: '',
    status: 'offline' as MachineStatus,
    capacity: 100,
    currentSpeed: 0,
    targetSpeed: 100,
    installDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.machineId || !formData.name || !formData.manufacturer) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Check if machine ID already exists
      const existing = await db.machines
        .where('machineId')
        .equals(formData.machineId)
        .first();

      if (existing) {
        toast.error('Machine ID already exists');
        return;
      }

      const newMachine: Machine = {
        id: crypto.randomUUID(),
        machineId: formData.machineId,
        name: formData.name,
        type: formData.type,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serialNumber: formData.serialNumber,
        location: formData.location,
        status: formData.status,
        capacity: formData.capacity,
        currentSpeed: formData.currentSpeed,
        targetSpeed: formData.targetSpeed,
        installDate: new Date(formData.installDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.machines.add(newMachine);
      
      toast.success('Machine added successfully');
      router.push('/manufacturing/machines');
    } catch (error) {
      console.error('Error adding machine:', error);
      toast.error('Failed to add machine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Machine</h1>
          <p className="text-gray-600 mt-1">Register a new manufacturing machine</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="machineId">Machine ID *</Label>
                <Input
                  id="machineId"
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  placeholder="e.g., MCH-001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Machine Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Packaging Line 1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <option value="packaging">Packaging</option>
                  <option value="filling">Filling</option>
                  <option value="labeling">Labeling</option>
                  <option value="mixing">Mixing</option>
                  <option value="assembly">Assembly</option>
                  <option value="inspection">Inspection</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Production Line A"
                />
              </div>
            </div>
          </div>

          {/* Manufacturer Details */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Manufacturer Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="manufacturer">Manufacturer *</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="e.g., Bosch"
                  required
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., PKG-2000"
                />
              </div>
              <div>
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="e.g., SN123456"
                />
              </div>
            </div>
          </div>

          {/* Capacity & Performance */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Capacity & Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="capacity">Capacity (units/hour)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="targetSpeed">Target Speed (units/hour)</Label>
                <Input
                  id="targetSpeed"
                  type="number"
                  value={formData.targetSpeed}
                  onChange={(e) => setFormData({ ...formData, targetSpeed: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="currentSpeed">Current Speed (units/hour)</Label>
                <Input
                  id="currentSpeed"
                  type="number"
                  value={formData.currentSpeed}
                  onChange={(e) => setFormData({ ...formData, currentSpeed: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Status & Dates */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Status & Dates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Initial Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as MachineStatus })}
                >
                  <option value="offline">Offline</option>
                  <option value="idle">Idle</option>
                  <option value="running">Running</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="down">Down</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="installDate">Install Date</Label>
                <Input
                  id="installDate"
                  type="date"
                  value={formData.installDate}
                  onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Machine'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
