'use client';

// AI Control Center - Security & Compliance Page
// Comprehensive security and compliance management

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIControlBreadcrumb } from '@/components/ai-control';
import {
  Shield,
  Key,
  FileText,
  Activity,
  Database,
  Lock,
} from 'lucide-react';
import SecurityAuditLogsViewer from '@/components/ai-control/SecurityAuditLogsViewer';
import ComplianceReportingDashboard from '@/components/ai-control/ComplianceReportingDashboard';
import DataLineageVisualization from '@/components/ai-control/DataLineageVisualization';
import APIKeyManagement from '@/components/ai-control/APIKeyManagement';

export default function SecurityCompliancePage() {
  const [activeTab, setActiveTab] = useState('audit-logs');

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb Navigation */}
      <AIControlBreadcrumb />

      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Security & Compliance</h1>
        <p className="text-gray-600">
          Comprehensive security monitoring, compliance reporting, and data governance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="audit-logs">
            <Shield className="w-4 h-4 mr-2" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="compliance">
            <FileText className="w-4 h-4 mr-2" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="data-lineage">
            <Activity className="w-4 h-4 mr-2" />
            Data Lineage
          </TabsTrigger>
          <TabsTrigger value="api-keys">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit-logs" className="mt-6">
          <SecurityAuditLogsViewer />
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <ComplianceReportingDashboard />
        </TabsContent>

        <TabsContent value="data-lineage" className="mt-6">
          <DataLineageVisualization />
        </TabsContent>

        <TabsContent value="api-keys" className="mt-6">
          <APIKeyManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
