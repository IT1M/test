'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db/schema';
import { PerformanceReview, Employee } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Star, Award, BarChart3 } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import toast from 'react-hot-toast';

export default function PerformancePage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reviewsData, employeesData] = await Promise.all([
        db.performanceReviews.reverse().toArray(),
        db.employees.where('status').equals('active').toArray(),
      ]);
      setReviews(reviewsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading performance data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'acknowledged': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const stats = {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length).toFixed(1)
      : '0',
    highPerformers: employees.filter(e => e.performanceRating && e.performanceRating >= 4.5).length,
    pendingReviews: reviews.filter(r => r.status === 'draft' || r.status === 'submitted').length,
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
          <h1 className="text-3xl font-bold">Performance Management</h1>
          <p className="text-gray-600 mt-1">
            Track and manage employee performance reviews
          </p>
        </div>
        <Button>
          New Performance Review
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Reviews</div>
              <div className="text-2xl font-bold mt-1">{stats.totalReviews}</div>
            </div>
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Average Rating</div>
              <div className="text-2xl font-bold mt-1">{stats.averageRating}/5</div>
            </div>
            <Star className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">High Performers</div>
              <div className="text-2xl font-bold mt-1 text-green-600">{stats.highPerformers}</div>
            </div>
            <Award className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Pending Reviews</div>
              <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.pendingReviews}</div>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
      </div>

      {/* Performance Reviews List */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Performance Reviews</h2>
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No performance reviews found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-lg">
                          {getEmployeeName(review.employeeId)}
                        </h3>
                        <Badge className={getStatusColor(review.status)}>
                          {review.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Review Period: {formatDate(review.reviewPeriodStart)} - {formatDate(review.reviewPeriodEnd)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Review Date: {formatDate(review.reviewDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getRatingColor(review.overallRating)}`}>
                        {review.overallRating}/5
                      </div>
                      <div className="text-sm text-gray-600">Overall Rating</div>
                    </div>
                  </div>

                  {review.ratings.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {review.ratings.slice(0, 4).map((rating, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="text-gray-600">{rating.category}</div>
                          <div className="font-medium">{rating.rating}/5</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {review.strengths.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-green-700">Key Strengths</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {review.strengths.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  )}

                  {review.goals.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-blue-700">Goals</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {review.goals.length} goal(s) set
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Top Performers */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Top Performers</h2>
          {employees.filter(e => e.performanceRating && e.performanceRating >= 4.0).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No top performers data available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {employees
                .filter(e => e.performanceRating && e.performanceRating >= 4.0)
                .sort((a, b) => (b.performanceRating || 0) - (a.performanceRating || 0))
                .slice(0, 6)
                .map(employee => (
                  <div key={employee.id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{employee.employeeId}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          {employee.performanceRating?.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-600">Rating</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
