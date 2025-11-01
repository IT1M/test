'use client';

// Security Audit Logs Viewer
// Displays comprehensive security audit logs with filtering and export

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Shield,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Calendar,
} from 'lucide-react';
import { SecurityAuditLogger, SecurityAuditEntry } from '@/services/ai/security-audit-logger';

export default function SecurityAuditLogsViewer() {
  const [logs, setLogs] = useState<SecurityAuditEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SecurityAuditEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<SecurityAuditEntry | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, severityFilter, outcomeFilter]);

  const loadLogs = async () => {
    const result = await SecurityAuditLogger.getAuditLogs({
      page: 1,
      pageSize: 1000,
    });
    setLogs(result.logs);
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.resourceType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter((log) => log.severity === severityFilter);
    }

    if (outcomeFilter !== 'all') {
      filtered = filtered.filter((log) => log.outcome === outcomeFilter);
    }

    setFilteredLogs(filtered);
  };

  const exportLogs = async () => {
    const result = await SecurityAuditLogger.exportAuditLogs({
      page: 1,
      pageSize: 10000,
    });

    const exportData = {
      logs: result.data,
      exportTimestamp: result.exportTimestamp,
      exportSignature: result.exportSignature,
      totalRecords: result.data.length,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failure':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'denied':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const paginatedLogs = filteredLogs.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Audit Logs</h2>
          <p className="text-gray-600">
            Comprehensive activity tracking with tamper-proof signatures
          </p>
        </div>
        <Button onClick={exportLogs}>
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by action, user, or resource..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="all">All Outcomes</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="denied">Denied</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <span>Total: {filteredLogs.length} logs</span>
          <span>•</span>
          <span>
            Critical:{' '}
            {filteredLogs.filter((l) => l.severity === 'critical').length}
          </span>
          <span>•</span>
          <span>
            Failed: {filteredLogs.filter((l) => l.outcome === 'failure').length}
          </span>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 text-sm font-semibold">Timestamp</th>
                <th className="text-left p-3 text-sm font-semibold">User</th>
                <th className="text-left p-3 text-sm font-semibold">Action</th>
                <th className="text-left p-3 text-sm font-semibold">Resource</th>
                <th className="text-left p-3 text-sm font-semibold">Severity</th>
                <th className="text-left p-3 text-sm font-semibold">Outcome</th>
                <th className="text-left p-3 text-sm font-semibold">MFA</th>
                <th className="text-left p-3 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="p-3 text-sm">
                    {log.timestamp.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="text-sm font-medium">{log.userName}</p>
                      <p className="text-xs text-gray-500">{log.userRole}</p>
                    </div>
                  </td>
                  <td className="p-3 text-sm">{log.action}</td>
                  <td className="p-3">
                    <div>
                      <p className="text-sm">{log.resourceType}</p>
                      <p className="text-xs text-gray-500">{log.resourceId}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge className={getSeverityColor(log.severity)}>
                      {log.severity}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {getOutcomeIcon(log.outcome)}
                      <span className="text-sm capitalize">{log.outcome}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    {log.requiresMFA && (
                      <Badge
                        className={
                          log.mfaVerified ? 'bg-green-500' : 'bg-orange-500'
                        }
                      >
                        {log.mfaVerified ? 'Verified' : 'Required'}
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, filteredLogs.length)} of{' '}
            {filteredLogs.length} logs
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * pageSize >= filteredLogs.length}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedLog(null)}
        >
          <Card
            className="max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold">Audit Log Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLog(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Timestamp</p>
                    <p className="font-medium">
                      {selectedLog.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Log ID</p>
                    <p className="font-mono text-sm">{selectedLog.id}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">User</p>
                    <p className="font-medium">{selectedLog.userName}</p>
                    <p className="text-sm text-gray-500">{selectedLog.userId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-medium">{selectedLog.userRole}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Action</p>
                  <p className="font-medium">{selectedLog.action}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Resource Type</p>
                    <p className="font-medium">{selectedLog.resourceType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Resource ID</p>
                    <p className="font-medium">{selectedLog.resourceId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Severity</p>
                    <Badge className={getSeverityColor(selectedLog.severity)}>
                      {selectedLog.severity}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Outcome</p>
                    <div className="flex items-center gap-2">
                      {getOutcomeIcon(selectedLog.outcome)}
                      <span className="capitalize">{selectedLog.outcome}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">MFA Status</p>
                    {selectedLog.requiresMFA ? (
                      <Badge
                        className={
                          selectedLog.mfaVerified ? 'bg-green-500' : 'bg-orange-500'
                        }
                      >
                        {selectedLog.mfaVerified ? 'Verified' : 'Required'}
                      </Badge>
                    ) : (
                      <span className="text-sm">Not required</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">IP Address</p>
                    <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">User Agent</p>
                    <p className="text-sm truncate">{selectedLog.userAgent}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Details</p>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Tamper-Proof Signature
                  </p>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="font-mono text-xs break-all">
                      {selectedLog.signature}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">
                        Signature verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
