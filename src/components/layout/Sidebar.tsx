"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Database,
  BarChart3,
  Shield,
  HardDrive,
  Settings,
  FileBarChart,
  X,
} from "lucide-react";
import { UserRole } from "@prisma/client";
import { cn } from "@/utils/cn";

interface SidebarProps {
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Data Entry",
    href: "/data-entry",
    icon: FileText,
    roles: ["ADMIN", "DATA_ENTRY", "SUPERVISOR", "MANAGER"],
  },
  {
    label: "Data Log",
    href: "/data-log",
    icon: Database,
    roles: ["ADMIN", "DATA_ENTRY", "SUPERVISOR", "MANAGER", "AUDITOR"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileBarChart,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Audit Log",
    href: "/audit",
    icon: Shield,
    roles: ["ADMIN", "AUDITOR", "MANAGER"],
  },
  {
    label: "Backup",
    href: "/backup",
    icon: HardDrive,
    roles: ["ADMIN"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN", "MANAGER"],
  },
];

export function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-secondary-900 border-r border-secondary-200 dark:border-secondary-800 transition-transform duration-300 lg:translate-x-0 lg:static",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-secondary-200 dark:border-secondary-800 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SM</span>
            </div>
            <h2 className="text-lg font-bold text-secondary-900 dark:text-secondary-100">
              Saudi Mais
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-secondary-700 dark:text-secondary-300" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                    : "text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
