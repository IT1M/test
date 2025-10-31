'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { generateMedicalRecordsSummaryReport, type MedicalRecordsSummaryReport } from '@/services/reports/predefined';
import { formatPercentage } from '@/lib/utils/formatters';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function MedicalRecordsSummaryReportPage() {
  const [report, setReport] = useState<MedicalRecordsSummaryReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await generateMedicalRecordsSummaryReport();
      setReport(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/reports">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Medical Records Summary</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{report.summary.totalPatients}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{report.summary.totalRecords}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Records This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{report.summary.recordsThisMonth}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Records/Patient</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{report.summary.averageRecordsPerPatient.toFixed(1)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Demographics by Gender</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={report.patientDemographics.byGender}
                    dataKey="count"
                    nameKey="gender"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: any) => `${entry.gender}: ${formatPercentage(entry.percentage)}`}
                  >
                    {report.patientDemographics.byGender.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient Demographics by Age Group</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={report.patientDemographics.byAgeGroup}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ageGroup" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Common Diagnoses */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top 10 Common Diagnoses</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Diagnosis</th>
                  <th className="text-right py-2 px-4">Count</th>
                  <th className="text-right py-2 px-4">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {report.commonDiagnoses.map((diagnosis, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{diagnosis.diagnosis}</td>
                    <td className="text-right py-2 px-4">{diagnosis.count}</td>
                    <td className="text-right py-2 px-4">{formatPercentage(diagnosis.percentage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Medication Usage */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top 10 Prescribed Medications</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Medication</th>
                  <th className="text-right py-2 px-4">Prescription Count</th>
                  <th className="text-right py-2 px-4">Patient Count</th>
                </tr>
              </thead>
              <tbody>
                {report.medicationUsage.map((med, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{med.medication}</td>
                    <td className="text-right py-2 px-4">{med.prescriptionCount}</td>
                    <td className="text-right py-2 px-4">{med.patientCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Records by Type */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Records by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Record Type</th>
                  <th className="text-right py-2 px-4">Count</th>
                  <th className="text-right py-2 px-4">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {report.recordsByType.map((type, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4 capitalize">{type.type}</td>
                    <td className="text-right py-2 px-4">{type.count}</td>
                    <td className="text-right py-2 px-4">{formatPercentage(type.percentage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Visit Frequency */}
        <Card>
          <CardHeader>
            <CardTitle>Visit Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Last 24 Hours</p>
                <p className="text-3xl font-bold text-blue-600">{report.visitFrequency.daily}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Last 7 Days</p>
                <p className="text-3xl font-bold text-green-600">{report.visitFrequency.weekly}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Last 30 Days</p>
                <p className="text-3xl font-bold text-purple-600">{report.visitFrequency.monthly}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
