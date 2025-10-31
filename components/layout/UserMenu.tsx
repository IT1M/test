'use client';

import { User, Settings, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

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
