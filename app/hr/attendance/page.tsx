'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db/schema';
import { Attendance, Employee, Department } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar, Download } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatters';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, departmentsData] = await Promise.all([
        db.employees.where('status').equals('active').toArray(),
        db.departments.toArray(),
      ]);

      // Load attendance for selected date
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const attendanceData = await db.attendance
        .where('date')
        .between(startOfDay, endOfDay, true, true)
        .toArray();

      setEmployees(employeesData);
      setDepartments(departmentsData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (employeeId: string) => {
    try {
      const now = new Date();
      const today = new Date(selectedDate);
      
      // Check if already checked in
      const existing = attendance.find(a => a.employeeId === employeeId);
      if (existing && existing.checkIn) {
        toast.error('Employee already checked in today');
        return;
      }

      const checkInTime = new Date();
      const workStartTime = new Date(today);
      workStartTime.setHours(9, 0, 0, 0); // Assuming work starts at 9 AM

      const lateMinutes = checkInTime > workStartTime 
        ? Math.floor((checkInTime.getTime() - workStartTime.getTime()) / (1000 * 60))
        : 0;

      const attendanceRecord: Attendance = {
        id: uuidv4(),
        employeeId,
        date: today,
        checkIn: checkInTime,
        checkOut: undefined,
        workHours: undefined,
        status: lateMinutes > 0 ? 'late' : 'present',
        lateMinutes: lateMinutes > 0 ? lateMinutes : undefined,
        earlyDepartureMinutes: undefined,
        location: undefined,
        notes: undefined,
        approvedBy: undefined,
        createdAt: new Date(),
      };

      await db.attendance.add(attendanceRecord);
      toast.success('Check-in recorded successfully');
      loadData();
    } catch (error) {
      console.error('Error recording check-in:', error);
      toast.error('Failed to record check-in');
    }
  };

  const handleCheckOut = async (employeeId: string) => {
    try {
      const existing = attendance.find(a => a.employeeId === employeeId);
      if (!existing) {
        toast.error('No check-in record found');
        return;
      }

      if (existing.checkOut) {
        toast.error('Employee already checked out');
        return;
      }

      const checkOutTime = new Date();
      const checkInTime = new Date(existing.checkIn!);
      const workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      await db.attendance.update(existing.id, {
        checkOut: checkOutTime,
        workHours: parseFloat(workHours.toFixed(2)),
      });

      toast.success('Check-out recorded successfully');
      loadData();
    } catch (error) {
      console.error('Error recording check-out:', error);
      toast.error('Failed to record check-out');
    }
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Unknown';
  };

  const getAttendanceForEmployee = (employeeId: string) => {
    return attendance.find(a => a.employeeId === employeeId);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesDepartment = filterDepartment === 'all' || employee.departmentId === filterDepartment;
    const attendanceRecord = getAttendanceForEmployee(employee.id);
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'not-marked' && !attendanceRecord) ||
      (attendanceRecord && attendanceRecord.status === filterStatus);

    return matchesDepartment && matchesStatus;
  });

  const stats = {
    total: employees.length,
    present: attendance.filter(a => a.status === 'present' || a.status === 'late').length,
    late: attendance.filter(a => a.status === 'late').length,
    absent: employees.length - attendance.length,
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'on-leave': return 'bg-blue-100 text-blue-800';
      case 'holiday': return 'bg-purple-100 text-purple-800';
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
          <h1 className="text-3xl font-bold">Attendance Tracking</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage employee attendance
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Date and Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Date</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Department</label>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not-marked">Not Marked</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="on-leave">On Leave</SelectItem>
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
              <div className="text-sm text-gray-600">Total Employees</div>
              <div className="text-2xl font-bold mt-1">{stats.total}</div>
            </div>
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Present</div>
              <div className="text-2xl font-bold mt-1 text-green-600">{stats.present}</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Late</div>
              <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.late}</div>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Absent</div>
              <div className="text-2xl font-bold mt-1 text-red-600">{stats.absent}</div>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </Card>
      </div>

      {/* Attendance List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No employees found</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(employee => {
                  const attendanceRecord = getAttendanceForEmployee(employee.id);
                  
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.employeeId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getDepartmentName(employee.departmentId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attendanceRecord?.checkIn 
                          ? new Date(attendanceRecord.checkIn).toLocaleTimeString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attendanceRecord?.checkOut 
                          ? new Date(attendanceRecord.checkOut).toLocaleTimeString()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {attendanceRecord?.workHours 
                          ? `${attendanceRecord.workHours.toFixed(1)}h`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(attendanceRecord?.status)}>
                          {attendanceRecord?.status || 'Not Marked'}
                        </Badge>
                        {attendanceRecord?.lateMinutes && attendanceRecord.lateMinutes > 0 && (
                          <span className="ml-2 text-xs text-yellow-600">
                            ({attendanceRecord.lateMinutes} min late)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {!attendanceRecord?.checkIn && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(employee.id)}
                          >
                            Check In
                          </Button>
                        )}
                        {attendanceRecord?.checkIn && !attendanceRecord?.checkOut && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckOut(employee.id)}
                          >
                            Check Out
                          </Button>
                        )}
                        {attendanceRecord?.checkOut && (
                          <span className="text-green-600">✓ Complete</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
