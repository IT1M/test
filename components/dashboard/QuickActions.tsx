'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Package, Users, ShoppingCart, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function QuickActions() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd + Shift + key combinations
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'o':
            e.preventDefault();
            router.push('/orders/new');
            break;
          case 'p':
            e.preventDefault();
            router.push('/products/new');
            break;
          case 'c':
            e.preventDefault();
            router.push('/customers/new');
            break;
          case 'u':
            e.preventDefault();
            router.push('/patients/new');
            break;
          case 'k':
            e.preventDefault();
            setOpen(true);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const actions = [
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      label: 'New Order',
      description: 'Create a new customer order',
      href: '/orders/new',
      shortcut: 'Ctrl+Shift+O',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: <Package className="h-5 w-5" />,
      label: 'Add Product',
      description: 'Add a new product to inventory',
      href: '/products/new',
      shortcut: 'Ctrl+Shift+P',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Register Customer',
      description: 'Add a new customer',
      href: '/customers/new',
      shortcut: 'Ctrl+Shift+C',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      icon: <UserCircle className="h-5 w-5" />,
      label: 'Add Patient',
      description: 'Register a new patient',
      href: '/patients/new',
      shortcut: 'Ctrl+Shift+U',
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  const handleAction = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Actions</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose an action or use keyboard shortcuts
          </p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {actions.map((action) => (
            <button
              key={action.href}
              onClick={() => handleAction(action.href)}
              className="flex items-start p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors text-left"
            >
              <div className={`${action.color} text-white p-3 rounded-lg mr-4`}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1">{action.label}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {action.description}
                </p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {action.shortcut}
                </code>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Keyboard Shortcuts</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Press <code className="bg-background px-1 rounded">Ctrl+Shift+K</code> to open this menu</li>
            <li>• Use the shortcuts above to quickly create new items</li>
            <li>• Press <code className="bg-background px-1 rounded">Esc</code> to close</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
