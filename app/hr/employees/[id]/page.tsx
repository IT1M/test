'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/db/schema';
import { Employee, Department, Position, Attendance, Leave, PerformanceReview } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Award,
  FileText,
  Clock,
  TrendingUp,
  Archive,
  UserCircle,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';
import { calculateAge } from '@/types/database';
import toast from 'react-hot-toast';

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployeeData();
  }, [employeeId]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const emp = await db.employees.get(employeeId);
      if (!emp) {
        toast.error('Employee not found');
        router.push('/hr/employees');
        return;
      }

      const [dept, pos, attendanceData, leavesData, reviewsData] = await Promise.all([
        db.departments.get(emp.departmentId),
        db.positions.get(emp.positionId),
        db.attendance.where('employeeId').equals(employeeId).reverse().limit(30).toArray(),
        db.leaves.where('employeeId').equals(employeeId).reverse().toArray(),
        db.performanceReviews.where('employeeId').equals(employeeId).reverse().toArray(),
      ]);

      setEmployee(emp);
      setDepartment(dept || null);
      setPosition(pos || null);
      setAttendance(attendanceData);
      setLeaves(leavesData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading employee:', error);
      toast.error('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!employee) return;
    
    if (confirm('Are you sure you want to archive this employee?')) {
      try {
        await db.employees.update(employee.id, {
          status: 'archived',
          archivedAt: new Date(),
        });
        toast.success('Employee archived successfully');
        loadEmployeeData();
      } catch (error) {
        console.error('Error archiving employee:', error);
        toast.error('Failed to archive employee');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'on-leave': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
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

  if (!employee) {
    return null;
  }

  const age = calculateAge(employee.dateOfBirth);
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
  const approvedLeaves = leaves.filter(l => l.status === 'approved').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/hr/employees')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Employee Profile</h1>
            <p className="text-gray-600 mt-1">
              {employee.employeeId}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.push(`/hr/employees/${employee.id}/edit`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          {employee.status === 'active' && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Employee Header Card */}
      <Card className="p-6">
        <div className="flex items-start space-x-6">
          <div className="flex-shrink-0">
            {employee.photo ? (
              <img
                src={employee.photo}
                alt={`${employee.firstName} ${employee.lastName}`}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                <UserCircle className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {employee.firstName} {employee.lastName}
                </h2>
                <p className="text-gray-600 mt-1">{position?.title || 'Unknown Position'}</p>
              </div>
              <Badge className={getStatusColor(employee.status)}>
                {employee.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {employee.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                {employee.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase className="w-4 h-4 mr-2" />
                {department?.name || 'Unknown Department'}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Joined {formatDate(employee.hireDate)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Annual Leave Balance</div>
          <div className="text-2xl font-bold mt-1">{employee.annualLeaveBalance} days</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Sick Leave Balance</div>
          <div className="text-2xl font-bold mt-1">{employee.sickLeaveBalance} days</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Pending Leaves</div>
          <div className="text-2xl font-bold mt-1 text-yellow-600">{pendingLeaves}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Performance Rating</div>
          <div className="text-2xl font-bold mt-1">
            {employee.performanceRating ? `${employee.performanceRating}/5` : 'N/A'}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Personal Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Full Name</div>
                  <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">National ID</div>
                  <div className="font-medium">{employee.nationalId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Date of Birth</div>
                  <div className="font-medium">{formatDate(employee.dateOfBirth)} ({age} years)</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Gender</div>
                  <div className="font-medium capitalize">{employee.gender}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Address</div>
                  <div className="font-medium">{employee.address}, {employee.city}, {employee.country}</div>
                </div>
              </div>
            </Card>

            {/* Employment Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Employment Details</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Employee ID</div>
                  <div className="font-medium">{employee.employeeId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Department</div>
                  <div className="font-medium">{department?.name || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Position</div>
                  <div className="font-medium">{position?.title || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Contract Type</div>
                  <div className="font-medium capitalize">{employee.contractType}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Hire Date</div>
                  <div className="font-medium">{formatDate(employee.hireDate)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Basic Salary</div>
                  <div className="font-medium">{formatCurrency(employee.basicSalary)} {employee.currency}</div>
                </div>
              </div>
            </Card>

            {/* Emergency Contact */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-medium">{employee.emergencyContact.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Relationship</div>
                  <div className="font-medium">{employee.emergencyContact.relationship}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="font-medium">{employee.emergencyContact.phone}</div>
                </div>
                {employee.emergencyContact.alternatePhone && (
                  <div>
                    <div className="text-sm text-gray-600">Alternate Phone</div>
                    <div className="font-medium">{employee.emergencyContact.alternatePhone}</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Qualifications */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Qualifications</h3>
              {employee.qualifications.length === 0 ? (
                <p className="text-gray-500">No qualifications recorded</p>
              ) : (
                <div className="space-y-3">
                  {employee.qualifications.map((qual, index) => (
                    <div key={index} className="border-b pb-3 last:border-b-0">
                      <div className="font-medium">{qual.degree}</div>
                      <div className="text-sm text-gray-600">{qual.institution}</div>
                      <div className="text-sm text-gray-500">
                        {qual.fieldOfStudy} • {qual.graduationYear}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Attendance (Last 30 days)</h3>
              {attendance.length === 0 ? (
                <p className="text-gray-500">No attendance records found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {attendance.map(record => (
                        <tr key={record.id}>
                          <td className="px-4 py-2">{formatDate(record.date)}</td>
                          <td className="px-4 py-2">{record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}</td>
                          <td className="px-4 py-2">{record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}</td>
                          <td className="px-4 py-2">{record.workHours ? `${record.workHours.toFixed(1)}h` : '-'}</td>
                          <td className="px-4 py-2">
                            <Badge className={record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {record.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Leave History</h3>
              {leaves.length === 0 ? (
                <p className="text-gray-500">No leave records found</p>
              ) : (
                <div className="space-y-3">
                  {leaves.map(leave => (
                    <div key={leave.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium capitalize">{leave.leaveType} Leave</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {formatDate(leave.startDate)} - {formatDate(leave.endDate)} ({leave.totalDays} days)
                          </div>
                          <div className="text-sm text-gray-500 mt-1">{leave.reason}</div>
                        </div>
                        <Badge className={getLeaveStatusColor(leave.status)}>
                          {leave.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Reviews</h3>
              {reviews.length === 0 ? (
                <p className="text-gray-500">No performance reviews found</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-medium">Review - {formatDate(review.reviewDate)}</div>
                          <div className="text-sm text-gray-600">
                            Period: {formatDate(review.reviewPeriodStart)} - {formatDate(review.reviewPeriodEnd)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{review.overallRating}/5</div>
                          <div className="text-sm text-gray-600">Overall Rating</div>
                        </div>
                      </div>
                      {review.strengths.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-green-700">Strengths</div>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {review.strengths.map((strength, idx) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {review.areasForImprovement.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-yellow-700">Areas for Improvement</div>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {review.areasForImprovement.map((area, idx) => (
                              <li key={idx}>{area}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Documents</h3>
              {employee.documents.length === 0 ? (
                <p className="text-gray-500">No documents uploaded</p>
              ) : (
                <div className="space-y-2">
                  {employee.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{doc.fileName}</div>
                          <div className="text-sm text-gray-500 capitalize">{doc.type.replace('-', ' ')}</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
