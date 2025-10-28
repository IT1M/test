"use client";

import { ReactNode, useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";
import { UserRole } from "@prisma/client";

interface AppLayoutProps {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <Sidebar
        userRole={user.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="lg:pl-64">
        <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="min-h-[calc(100vh-8rem)]">
          {children}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
