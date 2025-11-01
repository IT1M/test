'use client';

import { User, Settings, LogOut, Shield, Brain, Activity, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Permission, hasPermission } from "@/lib/auth/rbac";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3 pb-4 border-b">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-medium">{user?.username || 'Guest User'}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.role || 'admin'}</p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-1">
            {/* AI Control Center Quick Access - Only for AI Admins */}
            {user && hasPermission(user, Permission.ACCESS_AI_CONTROL_CENTER) && (
              <>
                <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  AI Control Center
                </div>
                <Link href="/ai-control-center">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100"
                    onClick={() => setOpen(false)}
                  >
                    <Brain className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-blue-700">AI Dashboard</span>
                  </Button>
                </Link>
                
                <Link href="/ai-control-center/audit-logs">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setOpen(false)}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Activity Logs
                  </Button>
                </Link>
                
                <Link href="/ai-control-center/diagnostics">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setOpen(false)}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Diagnostics
                  </Button>
                </Link>
                
                <div className="border-t my-2"></div>
              </>
            )}
            
            <Link href="/settings">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setOpen(false)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            
            <Link href="/admin">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setOpen(false)}
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Button>
            </Link>

            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                logout();
                setOpen(false);
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
