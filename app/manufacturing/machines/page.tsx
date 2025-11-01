'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/db/schema';
import { Machine, MachineStatus } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  Power
} from 'lucide-react';

export default function MachinesPage() {
  const router = useRouter();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MachineStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      setLoading(true);
      const allMachines = await db.machines.toArray();
      setMachines(allMachines);
    } catch (error) {
      console.error('Error loading machines:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.machineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         machine.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || machine.status === statusFilter;
    const matchesType = typeFilter === 'all' || machine.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const machineTypes = Array.from(new Set(machines.map(m => m.type)));

  const getStatusIcon = (status: MachineStatus) => {
    switch (status) {
      case 'running': return <Activity className="w-4 h-4" />;
      case 'idle': return <Clock className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'down': return <AlertCircle className="w-4 h-4" />;
      case 'offline': return <Power className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: MachineStatus) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'maintenance': return 'bg-blue-500';
      case 'down': return 'bg-red-500';
      case 'offline': return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: MachineStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'running': return 'default';
      case 'idle': return 'secondary';
      case 'maintenance': return 'outline';
      case 'down': return 'destructive';
      case 'offline': return 'secondary';
    }
  };

  const statusCounts = {
    running: machines.filter(m => m.status === 'running').length,
    idle: machines.filter(m => m.status === 'idle').length,
    maintenance: machines.filter(m => m.status === 'maintenance').length,
    down: machines.filter(m => m.status === 'down').length,
    offline: machines.filter(m => m.status === 'offline').length,
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manufacturing Machines</h1>
          <p className="text-gray-600 mt-1">Monitor and manage production equipment</p>
        </div>
        <Button onClick={() => router.push('/manufacturing/machines/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Machine
        </Button>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Running</p>
              <p className="text-2xl font-bold">{statusCounts.running}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${getStatusColor('running')} flex items-center justify-center text-white`}>
              {getStatusIcon('running')}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Idle</p>
              <p className="text-2xl font-bold">{statusCounts.idle}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${getStatusColor('idle')} flex items-center justify-center text-white`}>
              {getStatusIcon('idle')}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold">{statusCounts.maintenance}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${getStatusColor('maintenance')} flex items-center justify-center text-white`}>
              {getStatusIcon('maintenance')}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Down</p>
              <p className="text-2xl font-bold">{statusCounts.down}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${getStatusColor('down')} flex items-center justify-center text-white`}>
              {getStatusIcon('down')}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Offline</p>
              <p className="text-2xl font-bold">{statusCounts.offline}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${getStatusColor('offline')} flex items-center justify-center text-white`}>
              {getStatusIcon('offline')}
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search machines by name, ID, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as MachineStatus | 'all')}>
            <option value="all">All Status</option>
            <option value="running">Running</option>
            <option value="idle">Idle</option>
            <option value="maintenance">Maintenance</option>
            <option value="down">Down</option>
            <option value="offline">Offline</option>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <option value="all">All Types</option>
            {machineTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Machines Grid */}
      {filteredMachines.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No machines found</h3>
              <p className="text-gray-600 mt-1">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first machine'}
              </p>
            </div>
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
              <Button onClick={() => router.push('/manufacturing/machines/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Add Machine
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMachines.map(machine => (
            <Card 
              key={machine.id} 
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/manufacturing/machines/${machine.id}`)}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{machine.name}</h3>
                    <p className="text-sm text-gray-600">{machine.machineId}</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(machine.status)}>
                    {machine.status}
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{machine.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{machine.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{machine.capacity} units/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Speed:</span>
                    <span className="font-medium">{machine.currentSpeed} units/hr</span>
                  </div>
                </div>

                {/* Performance Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Performance</span>
                    <span>{Math.round((machine.currentSpeed / machine.targetSpeed) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        (machine.currentSpeed / machine.targetSpeed) >= 0.9 ? 'bg-green-500' :
                        (machine.currentSpeed / machine.targetSpeed) >= 0.7 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((machine.currentSpeed / machine.targetSpeed) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 border-t flex justify-between items-center text-xs text-gray-600">
                  <span>{machine.manufacturer} {machine.model}</span>
                  {machine.nextMaintenanceDate && (
                    <span className="flex items-center">
                      <Wrench className="w-3 h-3 mr-1" />
                      {new Date(machine.nextMaintenanceDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
