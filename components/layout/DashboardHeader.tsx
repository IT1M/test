'use client';

import { Bell, Menu, Search, User, X, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UniversalSearchSimple } from "@/components/search/UniversalSearchSimple";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import Link from "next/link";

export function DashboardHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Logo and Title */}
        <div className="flex items-center space-x-4">
          <button
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
            Medical Products Management System
          </h1>
        </div>

        {/* Right: Search, Notifications, Settings, User Menu */}
        <div className="flex items-center space-x-4">
          <NotificationBell />
          <Link 
            href="/settings"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5 text-gray-600 hover:text-gray-900" />
          </Link>
          <div className="hidden md:block">
            <UniversalSearchSimple />
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Mobile Search */}
      {mobileMenuOpen && (
        <div className="px-6 pb-4 md:hidden">
          <UniversalSearchSimple />
        </div>
      )}
    </header>
  );
}
