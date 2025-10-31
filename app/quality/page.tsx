'use client';

import { useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  ClipboardCheck, 
  BarChart3, 
  FileText,
  TrendingDown,
  Package
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function QualityControlPage() {
  const router = useRouter();

  const modules = [
    {
      title: 'Rejections',
      description: 'Track and manage product rejections',
      icon: AlertTriangle,
      href: '/quality/rejections',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Quality Inspections',
      description: 'Manage quality inspection records',
      icon: ClipboardCheck,
      href: '/quality/inspections',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Analytics',
      description: 'View quality metrics and trends',
      icon: BarChart3,
      href: '/quality/analytics',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'CAPA Reports',
      description: 'Corrective and Preventive Action reports',
      icon: FileText,
      href: '/quality/capa',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quality Control</h1>
        <p className="text-gray-600 mt-1">
          Manage quality inspections, rejections, and corrective actions
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Rejections</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejection Rate</p>
              <p className="text-2xl font-bold text-gray-900">0%</p>
            </div>
            <TrendingDown className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inspections</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <ClipboardCheck className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Actions</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <Package className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Card
              key={module.href}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(module.href)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${module.bgColor}`}>
                  <Icon className={`h-6 w-6 ${module.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {module.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {module.description}
                  </p>
                  <Button variant="outline" size="sm">
                    Open Module
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="text-center text-gray-500 py-8">
          <p>No recent quality control activities</p>
        </div>
      </Card>
    </div>
  );
}
