'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db/schema';
import { Payroll, Employee } from '@/types/database';
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
import { DollarSign, Download, FileText, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import toast from 'react-hot-toast';

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [payrollsData, employeesData] = await Promise.all([
        db.payroll
          .where('[month+year]')
          .equals([selectedMonth, selectedYear])
          .toArray(),
        db.employees.where('status').equals('active').toArray(),
      ]);
      setPayrolls(payrollsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading payroll:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown';
  };

  const generatePayroll = async () => {
    try {
      // Check if payroll already exists for this month
      const existing = await db.payroll
        .where('[month+year]')
        .equals([selectedMonth, selectedYear])
        .count();

      if (existing > 0) {
        toast.error('Payroll already generated for this month');
        return;
      }

      const activeEmployees = await db.employees.where('status').equals('active').toArray();
      
      for (const employee of activeEmployees) {
        const payrollId = `PAY-${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${employee.employeeId}`;
        
        // Calculate totals
        const totalEarnings = employee.basicSalary;
        const tax = totalEarnings * 0.15; // 15% tax
        const insurance = 100; // Fixed insurance
        const totalDeductions = tax + insurance;
        const netSalary = totalEarnings - totalDeductions;

        const payroll: Payroll = {
          id: crypto.randomUUID(),
          payrollId,
          employeeId: employee.id,
          month: selectedMonth,
          year: selectedYear,
          basicSalary: employee.basicSalary,
          allowances: [],
          overtime: 0,
          bonus: 0,
          totalEarnings,
          deductions: [],
          tax,
          insurance,
          totalDeductions,
          netSalary,
          paymentDate: undefined,
          paymentMethod: 'bank-transfer',
          paymentReference: undefined,
          status: 'draft',
          approvedBy: undefined,
          approvalDate: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.payroll.add(payroll);
      }

      toast.success('Payroll generated successfully');
      loadData();
    } catch (error) {
      console.error('Error generating payroll:', error);
      toast.error('Failed to generate payroll');
    }
  };

  const approvePayroll = async (payrollId: string) => {
    try {
      await db.payroll.update(payrollId, {
        status: 'approved',
        approvalDate: new Date(),
        approvedBy: 'current-user',
      });
      toast.success('Payroll approved');
      loadData();
    } catch (error) {
      console.error('Error approving payroll:', error);
      toast.error('Failed to approve payroll');
    }
  };

  const markAsPaid = async (payrollId: string) => {
    try {
      await db.payroll.update(payrollId, {
        status: 'paid',
        paymentDate: new Date(),
        paymentReference: `REF-${Date.now()}`,
      });
      toast.success('Payroll marked as paid');
      loadData();
    } catch (error) {
      console.error('Error marking payroll as paid:', error);
      toast.error('Failed to mark as paid');
    }
  };

  const filteredPayrolls = payrolls.filter(payroll => {
    return filterStatus === 'all' || payroll.status === filterStatus;
  });

  const stats = {
    total: payrolls.length,
    totalAmount: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
    draft: payrolls.filter(p => p.status === 'draft').length,
    approved: payrolls.filter(p => p.status === 'approved').length,
    paid: payrolls.filter(p => p.status === 'paid').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-gray-600 mt-1">
            Process and manage employee salaries
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={generatePayroll}>
            Generate Payroll
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Month</label>
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Year</label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
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
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold mt-1">{formatCurrency(stats.totalAmount)}</div>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Pending Approval</div>
              <div className="text-2xl font-bold mt-1 text-yellow-600">{stats.draft}</div>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Paid</div>
              <div className="text-2xl font-bold mt-1 text-green-600">{stats.paid}</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>
      </div>

      {/* Payroll List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payroll ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
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
              {filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No payroll records found</p>
                    <p className="text-sm mt-1">Click "Generate Payroll" to create payroll for this month</p>
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map(payroll => (
                  <tr key={payroll.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payroll.payrollId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getEmployeeName(payroll.employeeId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payroll.basicSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(payroll.totalDeductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(payroll.netSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={getStatusColor(payroll.status)}>
                        {payroll.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {payroll.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => approvePayroll(payroll.id)}
                        >
                          Approve
                        </Button>
                      )}
                      {payroll.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => markAsPaid(payroll.id)}
                        >
                          Mark as Paid
                        </Button>
                      )}
                      {payroll.status === 'paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          View Payslip
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
