'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Warehouse, 
  UserCircle, 
  BarChart3, 
  FileText,
  Settings,
  AlertTriangle,
  Briefcase,
  ChevronDown,
  UserCheck,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  BookOpen,
  LineChart,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
  { href: "/patients", label: "Patients", icon: UserCircle },
  { 
    href: "/quality", 
    label: "Quality Control", 
    icon: AlertTriangle,
    hasDropdown: true,
    dropdownItems: [
      { href: "/quality/rejections", label: "Rejections", icon: AlertTriangle },
      { href: "/quality/rejections/new", label: "New Rejection", icon: AlertTriangle },
      { href: "/quality/analytics", label: "Analytics", icon: BarChart3 },
    ]
  },
  { 
    href: "/hr/employees", 
    label: "HR", 
    icon: Briefcase,
    hasDropdown: true,
    dropdownItems: [
      { href: "/hr/employees", label: "Employees", icon: UserCheck },
      { href: "/hr/attendance", label: "Attendance", icon: Clock },
      { href: "/hr/leaves", label: "Leaves", icon: Calendar },
      { href: "/hr/payroll", label: "Payroll", icon: DollarSign },
      { href: "/hr/performance", label: "Performance", icon: TrendingUp },
      { href: "/hr/training", label: "Training", icon: BookOpen },
    ]
  },
  { 
    href: "/executive", 
    label: "Executive", 
    icon: TrendingUp,
    hasDropdown: true,
    dropdownItems: [
      { href: "/executive", label: "Dashboard", icon: LayoutDashboard },
      { href: "/executive/analytics", label: "Advanced Analytics", icon: LineChart },
      { href: "/executive/reports", label: "Reports", icon: FileText },
    ]
  },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <nav className="bg-white border-t border-b sticky top-[73px] z-40 overflow-visible">
      <div className="px-6">
        <div className="flex space-x-8 overflow-x-auto overflow-y-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            if (item.hasDropdown && item.dropdownItems) {
              return (
                <div
                  key={item.href}
                  className="relative group"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                  data-nav-item={item.label}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 py-4 px-3 border-b-2 transition-all duration-200 whitespace-nowrap",
                      isActive
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50/50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      openDropdown === item.label && "rotate-180"
                    )} />
                  </Link>
                  
                  {/* Dropdown Menu */}
                  {openDropdown === item.label && (
                    <div 
                      className="fixed mt-0 w-64 bg-white rounded-b-lg shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                      style={{
                        top: 'calc(73px + 57px)',
                        left: `${typeof window !== 'undefined' ? document.querySelector(`[data-nav-item="${item.label}"]`)?.getBoundingClientRect().left : 0}px`,
                        zIndex: 9999
                      }}
                    >
                      <div className="px-3 py-2 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {item.label}
                        </p>
                      </div>
                      <div className="py-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                        {item.dropdownItems.map((dropdownItem) => {
                          const DropdownIcon = dropdownItem.icon;
                          const isDropdownActive = pathname === dropdownItem.href;
                          
                          return (
                            <Link
                              key={dropdownItem.href}
                              href={dropdownItem.href}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-150",
                                isDropdownActive
                                  ? "bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 shadow-sm"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                              )}
                            >
                              <div className={cn(
                                "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                                isDropdownActive
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-100 text-gray-500"
                              )}>
                                <DropdownIcon className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-medium flex-1">{dropdownItem.label}</span>
                              {isDropdownActive && (
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
