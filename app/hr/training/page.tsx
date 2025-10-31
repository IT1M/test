'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db/schema';
import { Training, Employee } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Calendar, Users, Award, Plus } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import toast from 'react-hot-toast';

export default function TrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trainingsData, employeesData] = await Promise.all([
        db.training.reverse().toArray(),
        db.employees.where('status').equals('active').toArray(),
      ]);
      setTrainings(trainingsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading training data:', error);
      toast.error('Failed to load training data');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
  };

  const filteredTrainings = trainings.filter(training => {
    const matchesStatus = filterStatus === 'all' || training.status === filterStatus;
    const matchesType = filterType === 'all' || training.type === filterType;
    return matchesStatus && matchesType;
  });

  const stats = {
    total: trainings.length,
    ongoing: trainings.filter(t => t.status === 'ongoing').length,
    completed: trainings.filter(t => t.status === 'completed').length,
    totalParticipants: trainings.reduce((sum, t) => sum + t.attendees.length, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'internal': return 'bg-blue-100 text-blue-800';
      case 'external': return 'bg-purple-100 text-purple-800';
      case 'online': return 'bg-green-100 text-green-800';
      case 'workshop': return 'bg-orange-100 text-orange-800';
      case 'certification': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Training Management</h1>
          <p className="text-gray-600 mt-1">
            Manage employee training programs and certifications
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Training Program
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="external">External</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Programs</div>
              <div className="text-2xl font-bold mt-1">{stats.total}</div>
            </div>
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Ongoing</div>
              <div className="text-2xl font-bold mt-1 text-blue-600">{stats.ongoing}</div>
            </div>
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-2xl font-bold mt-1 text-green-600">{stats.completed}</div>
            </div>
            <Award className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Participants</div>
              <div className="text-2xl font-bold mt-1">{stats.totalParticipants}</div>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Training Programs List */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Training Programs</h2>
          {filteredTrainings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No training programs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTrainings.map(training => (
                <div key={training.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium text-lg">{training.title}</h3>
                        <Badge className={getStatusColor(training.status)}>
                          {training.status}
                        </Badge>
                        <Badge className={getTypeColor(training.type)}>
                          {training.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{training.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-gray-600">Category</div>
                          <div className="font-medium">{training.category}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Duration</div>
                          <div className="font-medium">{training.duration} hours</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Start Date</div>
                          <div className="font-medium">{formatDate(training.startDate)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">End Date</div>
                          <div className="font-medium">{formatDate(training.endDate)}</div>
                        </div>
                      </div>

                      {training.location && (
                        <div className="mt-3 text-sm">
                          <span className="text-gray-600">Location: </span>
                          <span className="font-medium">{training.location}</span>
                        </div>
                      )}

                      {training.instructor && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Instructor: </span>
                          <span className="font-medium">{training.instructor}</span>
                          <span className="text-gray-500 ml-2">({training.instructorType})</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {training.attendees.length}
                      </div>
                      <div className="text-sm text-gray-600">
                        {training.maxParticipants ? `/ ${training.maxParticipants}` : ''} Enrolled
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        Cost: {formatCurrency(training.totalCost)}
                      </div>
                    </div>
                  </div>

                  {training.attendees.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm font-medium mb-2">Participants</div>
                      <div className="flex flex-wrap gap-2">
                        {training.attendees.slice(0, 5).map((attendee, idx) => (
                          <div key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {getEmployeeName(attendee.employeeId)}
                            {attendee.status === 'completed' && (
                              <span className="ml-1 text-green-600">✓</span>
                            )}
                          </div>
                        ))}
                        {training.attendees.length > 5 && (
                          <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                            +{training.attendees.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {training.status === 'planned' && (
                      <Button size="sm">
                        Enroll Employees
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Upcoming Trainings */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Trainings</h2>
          {trainings.filter(t => t.status === 'planned' && new Date(t.startDate) > new Date()).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming trainings scheduled</p>
          ) : (
            <div className="space-y-3">
              {trainings
                .filter(t => t.status === 'planned' && new Date(t.startDate) > new Date())
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .slice(0, 5)
                .map(training => (
                  <div key={training.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{training.title}</div>
                        <div className="text-sm text-gray-600">
                          {formatDate(training.startDate)} • {training.duration}h • {training.attendees.length} enrolled
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
