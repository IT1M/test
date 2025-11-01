'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Factory, 
  Activity, 
  Calendar, 
  Wrench, 
  BarChart3,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function ManufacturingPage() {
  const modules = [
    {
      title: 'Machine Management',
      description: 'Monitor and manage production machines, track status, and view specifications',
      icon: Factory,
      href: '/manufacturing/machines',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      implemented: true,
    },
    {
      title: 'OEE Monitoring',
      description: 'Track Overall Equipment Effectiveness with real-time analytics and AI insights',
      icon: Activity,
      href: '/manufacturing/oee',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      implemented: true,
    },
    {
      title: 'Production Planning',
      description: 'Schedule production runs, manage work orders, and optimize capacity',
      icon: Calendar,
      href: '/manufacturing/production',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      implemented: false,
    },
    {
      title: 'Maintenance Management',
      description: 'Plan preventive maintenance, track repairs, and manage spare parts',
      icon: Wrench,
      href: '/manufacturing/maintenance',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      implemented: false,
    },
    {
      title: 'Manufacturing Analytics',
      description: 'Comprehensive analytics dashboard with production metrics and insights',
      icon: BarChart3,
      href: '/manufacturing/analytics',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      implemented: false,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Manufacturing Operations</h1>
        <p className="text-gray-500 mt-1">
          Comprehensive manufacturing management system for production excellence
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Machines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-gray-500 mt-1">Real-time status</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Average OEE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Production Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-gray-500 mt-1">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Downtime Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Manufacturing Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card 
                key={module.href}
                className={`relative ${!module.implemented ? 'opacity-60' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${module.bgColor}`}>
                      <Icon className={`h-6 w-6 ${module.color}`} />
                    </div>
                    {!module.implemented && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <CardTitle className="mt-4">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {module.implemented ? (
                    <Link href={module.href}>
                      <Button className="w-full" variant="outline">
                        Open Module
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>
            Manufacturing operations management capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Implemented Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Machine management with real-time status monitoring</li>
                <li>Production run tracking and history</li>
                <li>Downtime event logging and analysis</li>
                <li>Maintenance scheduling and history</li>
                <li>OEE (Overall Equipment Effectiveness) calculation and tracking</li>
                <li>Real-time performance metrics and analytics</li>
                <li>AI-powered insights and recommendations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Coming Soon</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Production planning and scheduling with Gantt charts</li>
                <li>Capacity planning and optimization</li>
                <li>Predictive maintenance with AI</li>
                <li>Spare parts inventory management</li>
                <li>Comprehensive manufacturing analytics dashboard</li>
                <li>Cost per unit analysis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
