'use client';

// Compliance Reporting Dashboard
// Shows data processing activities, consent tracking, and compliance metrics

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  FileText,
  CheckCircle,
  AlertTriangle,
  Download,
  Eye,
  Database,
  Lock,
  Users,
  Activity,
} from 'lucide-react';

interface DataProcessingActivity {
  id: string;
  activityName: string;
  dataTypes: string[];
  purpose: string;
  legalBasis: string;
  dataSubjects: string;
  recipients: string[];
  retentionPeriod: string;
  securityMeasures: string[];
  lastReviewed: Date;
  status: 'compliant' | 'review_needed' | 'non_compliant';
}

interface ConsentRecord {
  id: string;
  userId: string;
  userName: string;
  consentType: string;
  purpose: string;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'revoked';
}

interface ComplianceMetrics {
  totalActivities: number;
  compliantActivities: number;
  reviewNeeded: number;
  nonCompliant: number;
  totalConsents: number;
  activeConsents: number;
  revokedConsents: number;
  expiredConsents: number;
  dataSubjectRequests: number;
  averageResponseTime: number;
}

export default function ComplianceReportingDashboard() {
  const [metrics, setMetrics] = useState<ComplianceMetrics>({
    totalActivities: 12,
    compliantActivities: 10,
    reviewNeeded: 1,
    nonCompliant: 1,
    totalConsents: 245,
    activeConsents: 198,
    revokedConsents: 32,
    expiredConsents: 15,
    dataSubjectRequests: 8,
    averageResponseTime: 2.5,
  });

  const [activities, setActivities] = useState<DataProcessingActivity[]>([
    {
      id: '1',
      activityName: 'AI Model Training',
      dataTypes: ['Medical Records', 'Patient Demographics', 'Diagnostic Images'],
      purpose: 'Improve diagnostic accuracy',
      legalBasis: 'Legitimate Interest',
      dataSubjects: 'Patients',
      recipients: ['Internal AI Team', 'Cloud Service Provider'],
      retentionPeriod: '5 years',
      securityMeasures: ['Encryption at rest', 'Access controls', 'Audit logging'],
      lastReviewed: new Date('2024-10-15'),
      status: 'compliant',
    },
    {
      id: '2',
      activityName: 'Document Classification',
      dataTypes: ['Medical Documents', 'Patient Names', 'Medical Record Numbers'],
      purpose: 'Automated document categorization',
      legalBasis: 'Consent',
      dataSubjects: 'Patients',
      recipients: ['Gemini AI Service'],
      retentionPeriod: '90 days',
      securityMeasures: ['PHI Sanitization', 'Encrypted transmission', 'Access logging'],
      lastReviewed: new Date('2024-10-20'),
      status: 'compliant',
    },
    {
      id: '3',
      activityName: 'Predictive Analytics',
      dataTypes: ['Sales Data', 'Inventory Levels', 'Customer Orders'],
      purpose: 'Demand forecasting',
      legalBasis: 'Legitimate Interest',
      dataSubjects: 'Customers',
      recipients: ['Internal Analytics Team'],
      retentionPeriod: '3 years',
      securityMeasures: ['Data anonymization', 'Access controls'],
      lastReviewed: new Date('2024-09-10'),
      status: 'review_needed',
    },
  ]);

  const [consents, setConsents] = useState<ConsentRecord[]>([
    {
      id: '1',
      userId: 'user-001',
      userName: 'Dr. Ahmed Hassan',
      consentType: 'AI Processing',
      purpose: 'Use of AI for medical record analysis',
      granted: true,
      grantedAt: new Date('2024-01-15'),
      status: 'active',
    },
    {
      id: '2',
      userId: 'user-002',
      userName: 'Sarah Johnson',
      consentType: 'Data Analytics',
      purpose: 'Use of anonymized data for analytics',
      granted: true,
      grantedAt: new Date('2024-03-20'),
      status: 'active',
    },
    {
      id: '3',
      userId: 'user-003',
      userName: 'Mohammed Ali',
      consentType: 'AI Processing',
      purpose: 'Use of AI for medical record analysis',
      granted: false,
      grantedAt: new Date('2024-02-10'),
      revokedAt: new Date('2024-10-15'),
      status: 'revoked',
    },
  ]);

  const exportComplianceReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      metrics,
      activities,
      consents,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'active':
        return 'bg-green-500';
      case 'review_needed':
      case 'expired':
        return 'bg-yellow-500';
      case 'non_compliant':
      case 'revoked':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Reporting</h2>
          <p className="text-gray-600">
            Data processing activities and consent tracking
          </p>
        </div>
        <Button onClick={exportComplianceReport}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold">{metrics.totalActivities}</p>
            </div>
            <Database className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2 flex gap-2 text-xs">
            <span className="text-green-600">
              {metrics.compliantActivities} compliant
            </span>
            <span className="text-yellow-600">
              {metrics.reviewNeeded} review
            </span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Consents</p>
              <p className="text-2xl font-bold">{metrics.activeConsents}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2 text-xs text-gray-600">
            {metrics.totalConsents} total consents
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Data Subject Requests</p>
              <p className="text-2xl font-bold">{metrics.dataSubjectRequests}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Avg response: {metrics.averageResponseTime} days
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Compliance Score</p>
              <p className="text-2xl font-bold">
                {Math.round((metrics.compliantActivities / metrics.totalActivities) * 100)}%
              </p>
            </div>
            <Shield className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="mt-2 text-xs text-green-600">
            {metrics.nonCompliant === 0 ? 'All clear' : `${metrics.nonCompliant} issues`}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activities" className="w-full">
        <TabsList>
          <TabsTrigger value="activities">
            <Activity className="w-4 h-4 mr-2" />
            Processing Activities
          </TabsTrigger>
          <TabsTrigger value="consents">
            <CheckCircle className="w-4 h-4 mr-2" />
            Consent Records
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="w-4 h-4 mr-2" />
            Security Measures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{activity.activityName}</h3>
                    <Badge className={getStatusColor(activity.status)}>
                      {getStatusLabel(activity.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Purpose:</p>
                      <p>{activity.purpose}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Legal Basis:</p>
                      <p>{activity.legalBasis}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Data Types:</p>
                      <p>{activity.dataTypes.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Retention:</p>
                      <p>{activity.retentionPeriod}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm text-gray-600">Security Measures:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {activity.securityMeasures.map((measure, idx) => (
                        <Badge key={idx} variant="outline">
                          {measure}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Last reviewed: {activity.lastReviewed.toLocaleDateString()}
                  </p>
                </div>

                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="consents" className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Consent Type</th>
                  <th className="text-left p-2">Purpose</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {consents.map((consent) => (
                  <tr key={consent.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{consent.userName}</td>
                    <td className="p-2">{consent.consentType}</td>
                    <td className="p-2 text-sm text-gray-600">{consent.purpose}</td>
                    <td className="p-2">
                      <Badge className={getStatusColor(consent.status)}>
                        {getStatusLabel(consent.status)}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm">
                      {consent.grantedAt?.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Security Measures Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">PHI Sanitization</p>
                    <p className="text-sm text-gray-600">
                      Automatic detection and redaction enabled
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-500">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Encryption at Rest</p>
                    <p className="text-sm text-gray-600">
                      AES-256 encryption for stored data
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-500">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Audit Logging</p>
                    <p className="text-sm text-gray-600">
                      Comprehensive activity tracking with tamper-proof signatures
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-500">Active</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Access Controls</p>
                    <p className="text-sm text-gray-600">
                      Role-based access control (RBAC) with MFA for critical operations
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-500">Active</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
