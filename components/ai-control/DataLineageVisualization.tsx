'use client';

// Data Lineage Tracking Visualization
// Shows data flow through AI processing pipeline

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Database,
  ArrowRight,
  Brain,
  FileText,
  Shield,
  CheckCircle,
  AlertTriangle,
  Download,
} from 'lucide-react';

interface DataLineageNode {
  id: string;
  type: 'source' | 'processing' | 'storage' | 'output';
  name: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'processing' | 'failed';
  metadata?: Record<string, any>;
}

interface DataLineageFlow {
  id: string;
  name: string;
  nodes: DataLineageNode[];
  connections: Array<{ from: string; to: string }>;
  dataTypes: string[];
  securityMeasures: string[];
  complianceStatus: 'compliant' | 'review_needed' | 'non_compliant';
}

export default function DataLineageVisualization() {
  const [selectedFlow, setSelectedFlow] = useState<string>('flow-1');

  const flows: DataLineageFlow[] = [
    {
      id: 'flow-1',
      name: 'Medical Document Classification',
      dataTypes: ['Medical Records', 'Patient Data', 'Diagnostic Images'],
      securityMeasures: ['PHI Sanitization', 'Encryption', 'Access Logging'],
      complianceStatus: 'compliant',
      nodes: [
        {
          id: 'node-1',
          type: 'source',
          name: 'Document Upload',
          description: 'User uploads medical document',
          timestamp: new Date('2024-10-31T10:00:00'),
          status: 'success',
          metadata: {
            fileType: 'PDF',
            fileSize: '2.5 MB',
            uploadedBy: 'Dr. Ahmed',
          },
        },
        {
          id: 'node-2',
          type: 'processing',
          name: 'PHI Detection',
          description: 'Scan for Protected Health Information',
          timestamp: new Date('2024-10-31T10:00:05'),
          status: 'success',
          metadata: {
            phiDetected: true,
            detectedTypes: ['Names', 'MRN', 'Dates'],
          },
        },
        {
          id: 'node-3',
          type: 'processing',
          name: 'PHI Sanitization',
          description: 'Redact sensitive information',
          timestamp: new Date('2024-10-31T10:00:10'),
          status: 'success',
          metadata: {
            redactedFields: 3,
            sanitizationMethod: 'Automatic',
          },
        },
        {
          id: 'node-4',
          type: 'processing',
          name: 'AI Classification',
          description: 'Gemini AI document classification',
          timestamp: new Date('2024-10-31T10:00:15'),
          status: 'success',
          metadata: {
            model: 'gemini-pro',
            confidence: 0.87,
            category: 'Cardiology Report',
          },
        },
        {
          id: 'node-5',
          type: 'storage',
          name: 'Encrypted Storage',
          description: 'Store classified document',
          timestamp: new Date('2024-10-31T10:00:20'),
          status: 'success',
          metadata: {
            encryption: 'AES-256',
            location: 'Primary Database',
          },
        },
        {
          id: 'node-6',
          type: 'output',
          name: 'User Notification',
          description: 'Notify user of classification result',
          timestamp: new Date('2024-10-31T10:00:25'),
          status: 'success',
          metadata: {
            notificationType: 'In-app',
            recipient: 'Dr. Ahmed',
          },
        },
      ],
      connections: [
        { from: 'node-1', to: 'node-2' },
        { from: 'node-2', to: 'node-3' },
        { from: 'node-3', to: 'node-4' },
        { from: 'node-4', to: 'node-5' },
        { from: 'node-5', to: 'node-6' },
      ],
    },
    {
      id: 'flow-2',
      name: 'Demand Forecasting',
      dataTypes: ['Sales Data', 'Inventory Levels', 'Customer Orders'],
      securityMeasures: ['Data Anonymization', 'Access Controls'],
      complianceStatus: 'compliant',
      nodes: [
        {
          id: 'node-1',
          type: 'source',
          name: 'Data Collection',
          description: 'Aggregate sales and inventory data',
          timestamp: new Date('2024-10-31T09:00:00'),
          status: 'success',
        },
        {
          id: 'node-2',
          type: 'processing',
          name: 'Data Anonymization',
          description: 'Remove PII from dataset',
          timestamp: new Date('2024-10-31T09:00:10'),
          status: 'success',
        },
        {
          id: 'node-3',
          type: 'processing',
          name: 'AI Analysis',
          description: 'Gemini AI demand forecasting',
          timestamp: new Date('2024-10-31T09:00:30'),
          status: 'success',
        },
        {
          id: 'node-4',
          type: 'output',
          name: 'Forecast Report',
          description: 'Generate forecast report',
          timestamp: new Date('2024-10-31T09:01:00'),
          status: 'success',
        },
      ],
      connections: [
        { from: 'node-1', to: 'node-2' },
        { from: 'node-2', to: 'node-3' },
        { from: 'node-3', to: 'node-4' },
      ],
    },
  ];

  const currentFlow = flows.find((f) => f.id === selectedFlow) || flows[0];

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'source':
        return <Database className="w-5 h-5" />;
      case 'processing':
        return <Brain className="w-5 h-5" />;
      case 'storage':
        return <Shield className="w-5 h-5" />;
      case 'output':
        return <FileText className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'source':
        return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'processing':
        return 'bg-purple-100 border-purple-300 text-purple-700';
      case 'storage':
        return 'bg-green-100 border-green-300 text-green-700';
      case 'output':
        return 'bg-orange-100 border-orange-300 text-orange-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const exportLineage = () => {
    const data = {
      flow: currentFlow,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-lineage-${currentFlow.id}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Lineage Tracking</h2>
          <p className="text-gray-600">
            Visualize data flow through AI processing pipeline
          </p>
        </div>
        <Button onClick={exportLineage}>
          <Download className="w-4 h-4 mr-2" />
          Export Lineage
        </Button>
      </div>

      {/* Flow Selector */}
      <div className="flex gap-2">
        {flows.map((flow) => (
          <Button
            key={flow.id}
            variant={selectedFlow === flow.id ? 'default' : 'outline'}
            onClick={() => setSelectedFlow(flow.id)}
          >
            {flow.name}
          </Button>
        ))}
      </div>

      {/* Flow Info */}
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">{currentFlow.name}</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Data Types:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentFlow.dataTypes.map((type, idx) => (
                    <Badge key={idx} variant="outline">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-600">Security Measures:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentFlow.securityMeasures.map((measure, idx) => (
                    <Badge key={idx} variant="outline" className="bg-green-50">
                      {measure}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-600">Compliance Status:</p>
                <Badge
                  className={
                    currentFlow.complianceStatus === 'compliant'
                      ? 'bg-green-500'
                      : 'bg-yellow-500'
                  }
                >
                  {currentFlow.complianceStatus.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Lineage Visualization */}
      <Card className="p-6">
        <div className="space-y-4">
          {currentFlow.nodes.map((node, index) => (
            <div key={node.id}>
              <div className="flex items-start gap-4">
                {/* Node */}
                <div
                  className={`flex-1 p-4 border-2 rounded-lg ${getNodeColor(
                    node.type
                  )}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getNodeIcon(node.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{node.name}</h4>
                          {getStatusIcon(node.status)}
                        </div>
                        <p className="text-sm mt-1">{node.description}</p>
                        <p className="text-xs mt-2 opacity-75">
                          {node.timestamp.toLocaleString()}
                        </p>

                        {/* Metadata */}
                        {node.metadata && (
                          <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-xs">
                            {Object.entries(node.metadata).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="font-medium">{key}:</span>
                                <span>{JSON.stringify(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {node.type}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              {index < currentFlow.nodes.length - 1 && (
                <div className="flex justify-center my-2">
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 border-2 border-blue-300 rounded flex items-center justify-center">
              <Database className="w-4 h-4 text-blue-700" />
            </div>
            <span className="text-sm">Data Source</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 border-2 border-purple-300 rounded flex items-center justify-center">
              <Brain className="w-4 h-4 text-purple-700" />
            </div>
            <span className="text-sm">Processing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 border-2 border-green-300 rounded flex items-center justify-center">
              <Shield className="w-4 h-4 text-green-700" />
            </div>
            <span className="text-sm">Storage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 border-2 border-orange-300 rounded flex items-center justify-center">
              <FileText className="w-4 h-4 text-orange-700" />
            </div>
            <span className="text-sm">Output</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
