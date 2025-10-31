'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/db/schema';
import type { Sale } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import toast from 'react-hot-toast';

interface CommissionData {
  salesPerson: string;
  totalSales: number;
  totalProfit: number;
  commission: number;
  salesCount: number;
}

export default function CommissionsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [commissions, setCommissions] = useState<CommissionData[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get date range based on period
      const { startDate, endDate } = getDateRange(period);

      // Load sales data
      const sales = await db.sales
        .where('saleDate')
        .between(startDate, endDate, true, true)
        .toArray();

      // Calculate commissions by sales person
      const commissionsByPerson = calculateCommissions(sales);
      setCommissions(commissionsByPerson);

      // Calculate totals
      const totalComm = commissionsByPerson.reduce((sum, c) => sum + c.commission, 0);
      const totalSalesAmount = commissionsByPerson.reduce((sum, c) => sum + c.totalSales, 0);

      setTotalCommission(totalComm);
      setTotalSales(totalSalesAmount);
    } catch (error) {
      console.error('Failed to load commission data:', error);
      toast.error('Failed to load commission data');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (period: 'month' | 'quarter' | 'year') => {
    const now = new Date();

    switch (period) {
      case 'month':
        return {
          startDate: startOfMonth(now),
          endDate: endOfMonth(now),
        };
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
        return {
          startDate: quarterStart,
          endDate: quarterEnd,
        };
      case 'year':
        return {
          startDate: startOfYear(now),
          endDate: endOfYear(now),
        };
    }
  };

  const calculateCommissions = (sales: Sale[]): CommissionData[] => {
    // Group sales by sales person
    const salesByPerson = new Map<string, Sale[]>();

    sales.forEach(sale => {
      const existing = salesByPerson.get(sale.salesPerson) || [];
      existing.push(sale);
      salesByPerson.set(sale.salesPerson, existing);
    });

    // Calculate commission for each person
    const commissions: CommissionData[] = [];

    salesByPerson.forEach((personSales, salesPerson) => {
      const totalSales = personSales.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalProfit = personSales.reduce((sum, s) => sum + s.profit, 0);

      // Commission is already calculated in the sale record
      const commission = personSales.reduce((sum, s) => sum + s.commission, 0);

      commissions.push({
        salesPerson,
        totalSales,
        totalProfit,
        commission,
        salesCount: personSales.length,
      });
    });

    // Sort by commission (highest first)
    commissions.sort((a, b) => b.commission - a.commission);

    return commissions;
  };

  const getPeriodLabel = () => {
    const now = new Date();
    switch (period) {
      case 'month':
        return format(now, 'MMMM yyyy');
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return `Q${quarter} ${now.getFullYear()}`;
      case 'year':
        return now.getFullYear().toString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading commission data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Commissions</h1>
            <p className="text-gray-600 mt-1">Track sales performance and commissions</p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'month' | 'quarter' | 'year')}
              className="px-4 py-2 border rounded-md bg-white"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Period Label */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700">{getPeriodLabel()}</h2>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total Commissions</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${totalCommission.toFixed(2)}
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total Sales</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${totalSales.toFixed(2)}
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Sales People</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {commissions.length}
                  </div>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commission Table */}
        <Card>
          <CardHeader>
            <CardTitle>Commission Report by Sales Person</CardTitle>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No commission data for this period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Sales Person
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Sales Count
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Total Sales
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Total Profit
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Commission
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Commission %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {commissions.map((data, index) => {
                      const commissionRate =
                        data.totalSales > 0
                          ? (data.commission / data.totalSales) * 100
                          : 0;

                      return (
                        <tr key={data.salesPerson} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold">
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {data.salesPerson}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {data.salesCount}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            ${data.totalSales.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                            ${data.totalProfit.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                            ${data.commission.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">
                            {commissionRate.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm font-semibold">
                        Total
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold">
                        ${totalSales.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        $
                        {commissions
                          .reduce((sum, c) => sum + c.totalProfit, 0)
                          .toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                        ${totalCommission.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {totalSales > 0
                          ? ((totalCommission / totalSales) * 100).toFixed(2)
                          : 0}
                        %
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commission Notes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Commission Calculation Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                • Commissions are calculated based on completed orders and recorded in the
                Sales table.
              </p>
              <p>
                • The commission rate and amount are determined at the time of sale
                completion.
              </p>
              <p>
                • Only orders with status "completed" and payment status "paid" generate
                commission.
              </p>
              <p>
                • Commission percentages may vary based on product categories, sales
                targets, and individual agreements.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
