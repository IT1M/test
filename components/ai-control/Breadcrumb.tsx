'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function AIControlBreadcrumb() {
  const pathname = usePathname();

  // Map paths to breadcrumb labels
  const pathMap: Record<string, string> = {
    '/ai-control-center': 'Dashboard',
    '/ai-control-center/audit-logs': 'Audit Logs',
    '/ai-control-center/settings': 'Settings',
    '/ai-control-center/diagnostics': 'Diagnostics',
    '/ai-control-center/cost-analytics': 'Cost Analytics',
    '/ai-control-center/integrations': 'Integrations',
    '/ai-control-center/reports': 'Reports',
    '/ai-control-center/security': 'Security',
    '/ai-control-center/automation': 'Automation',
    '/ai-control-center/alerts': 'Alerts',
  };

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'AI Control Center', href: '/ai-control-center' },
  ];

  // Add current page if not the main dashboard
  if (pathname !== '/ai-control-center' && pathMap[pathname]) {
    breadcrumbItems.push({
      label: pathMap[pathname],
      href: pathname,
    });
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        const isFirst = index === 0;

        return (
          <div key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            )}
            {isLast ? (
              <span className="font-medium text-gray-900 dark:text-white">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1',
                  isFirst && 'flex items-center gap-1'
                )}
              >
                {isFirst && <Home className="h-4 w-4" />}
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
