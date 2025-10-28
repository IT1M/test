"use client";

import Link from "next/link";
import { Menu, User } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useState } from "react";
import { UserRole } from "@prisma/client";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
  onMenuClick: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-secondary-200 dark:border-secondary-800 bg-white dark:bg-secondary-900">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6 text-secondary-700 dark:text-secondary-300" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SM</span>
            </div>
            <h1 className="text-xl font-bold text-secondary-900 dark:text-secondary-100 hidden sm:block">
              Saudi Mais
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <NotificationBell />

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
              aria-label="User menu"
            >
              <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {user.name}
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  {user.role}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 z-50">
                  <div className="p-3 border-b border-secondary-200 dark:border-secondary-700">
                    <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                      {user.name}
                    </p>
                    <p className="text-xs text-secondary-500 dark:text-secondary-400">
                      {user.email}
                    </p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/settings"
                      className="block px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-md"
                    >
                      Settings
                    </Link>
                    <form action="/api/auth/logout" method="POST">
                      <button
                        type="submit"
                        className="w-full text-left px-3 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-md"
                      >
                        Logout
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
