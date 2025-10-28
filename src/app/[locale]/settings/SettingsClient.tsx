"use client";

import { useState, lazy, Suspense } from "react";
import { User, Lock, Palette, Bell, Settings as SettingsIcon, Shield } from "lucide-react";
import { canPerformAction } from "@/utils/rbac";

type UserRole = "ADMIN" | "DATA_ENTRY" | "SUPERVISOR" | "MANAGER" | "AUDITOR";

// Lazy load components
const ProfileSettings = lazy(() => import("./ProfileSettings"));
const SecuritySettings = lazy(() => import("./SecuritySettings"));
const AppearanceSettings = lazy(() => import("./AppearanceSettings"));
const NotificationSettings = lazy(() => import("./NotificationSettings"));
const APISettings = lazy(() => import("./APISettings"));
const EnhancedAdminSettings = lazy(() => import("@/components/admin/EnhancedAdminSettings"));

interface SettingsClientProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    preferences: any;
  };
}

type Tab = "profile" | "security" | "appearance" | "notifications" | "api" | "admin";

export default function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const tabs = [
    { id: "profile" as Tab, label: "Profile", icon: User },
    { id: "security" as Tab, label: "Security", icon: Lock },
    { id: "appearance" as Tab, label: "Appearance", icon: Palette },
    { id: "notifications" as Tab, label: "Notifications", icon: Bell },
  ];

  // Add admin tabs for users with appropriate permissions
  if (canPerformAction(user.role, "read", "user") || canPerformAction(user.role, "read", "monitoring")) {
    tabs.push({ id: "admin" as Tab, label: "Administration", icon: Shield });
  }

  // Add API tab only for ADMIN users
  if (user.role === "ADMIN") {
    tabs.push({ id: "api" as Tab, label: "API Configuration", icon: SettingsIcon });
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-2">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                      : "text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800"
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === "admin" ? (
          <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>}>
            <EnhancedAdminSettings user={user} />
          </Suspense>
        ) : (
          <div className="bg-white dark:bg-secondary-900 rounded-lg shadow p-6">
            <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>}>
              {activeTab === "profile" && <ProfileSettings user={user} />}
              {activeTab === "security" && <SecuritySettings user={user} />}
              {activeTab === "appearance" && <AppearanceSettings user={user} />}
              {activeTab === "notifications" && <NotificationSettings user={user} />}
              {activeTab === "api" && user.role === "ADMIN" && <APISettings />}
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
