"use client";

import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/utils/cn";

export interface GridItem {
  id: string;
  component: ReactNode;
  size: "sm" | "md" | "lg" | "xl";
  order?: number;
  minWidth?: number;
  minHeight?: number;
}

export interface DashboardGridProps {
  items: GridItem[];
  className?: string;
  enableDragDrop?: boolean;
  onLayoutChange?: (layout: GridLayout[]) => void;
  savedLayout?: GridLayout[];
}

export interface GridLayout {
  id: string;
  order: number;
  size: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "col-span-1",
  md: "col-span-1 md:col-span-2",
  lg: "col-span-1 md:col-span-2 lg:col-span-3",
  xl: "col-span-1 md:col-span-2 lg:col-span-4",
};

export function DashboardGrid({
  items,
  className,
  enableDragDrop = false,
  onLayoutChange,
  savedLayout,
}: DashboardGridProps) {
  const [currentLayout, setCurrentLayout] = useState<GridLayout[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  // Initialize layout
  useEffect(() => {
    if (savedLayout && savedLayout.length > 0) {
      setCurrentLayout(savedLayout);
    } else {
      const defaultLayout = items.map((item, index) => ({
        id: item.id,
        order: item.order ?? index,
        size: item.size,
      }));
      setCurrentLayout(defaultLayout);
    }
  }, [items, savedLayout]);

  // Sort items by layout order
  const sortedItems = [...items].sort((a, b) => {
    const layoutA = currentLayout.find(l => l.id === a.id);
    const layoutB = currentLayout.find(l => l.id === b.id);
    return (layoutA?.order ?? 0) - (layoutB?.order ?? 0);
  });

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    if (!enableDragDrop) return;
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    if (!enableDragDrop || !draggedItem) return;
    e.preventDefault();
    setDragOverItem(itemId);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (!enableDragDrop || !draggedItem || draggedItem === targetId) return;
    
    e.preventDefault();
    
    const newLayout = [...currentLayout];
    const draggedIndex = newLayout.findIndex(item => item.id === draggedItem);
    const targetIndex = newLayout.findIndex(item => item.id === targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Swap the items
      const draggedLayoutItem = newLayout[draggedIndex];
      const targetLayoutItem = newLayout[targetIndex];
      
      const tempOrder = draggedLayoutItem.order;
      draggedLayoutItem.order = targetLayoutItem.order;
      targetLayoutItem.order = tempOrder;
      
      setCurrentLayout(newLayout);
      onLayoutChange?.(newLayout);
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleSizeChange = (itemId: string, newSize: "sm" | "md" | "lg" | "xl") => {
    const newLayout = currentLayout.map(item =>
      item.id === itemId ? { ...item, size: newSize } : item
    );
    setCurrentLayout(newLayout);
    onLayoutChange?.(newLayout);
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {sortedItems.map((item) => {
        const layoutItem = currentLayout.find(l => l.id === item.id);
        const size = layoutItem?.size ?? item.size;
        
        return (
          <div
            key={item.id}
            className={cn(
              sizeClasses[size],
              "transition-all duration-200",
              enableDragDrop && "cursor-move",
              draggedItem === item.id && "opacity-50 scale-95",
              dragOverItem === item.id && "ring-2 ring-primary-500 ring-opacity-50"
            )}
            draggable={enableDragDrop}
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id)}
            onDragEnd={handleDragEnd}
            onDrop={(e) => handleDrop(e, item.id)}
          >
            <div className="relative group h-full">
              {/* Drag handle and resize controls */}
              {enableDragDrop && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="flex items-center gap-1 bg-white dark:bg-secondary-800 rounded-md shadow-sm border border-secondary-200 dark:border-secondary-700 p-1">
                    {/* Drag handle */}
                    <button
                      className="p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                      title="Drag to reorder"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </button>
                    
                    {/* Size selector */}
                    <select
                      value={size}
                      onChange={(e) => handleSizeChange(item.id, e.target.value as any)}
                      className="text-xs border-0 bg-transparent text-secondary-600 dark:text-secondary-400 focus:ring-0"
                      title="Change size"
                    >
                      <option value="sm">S</option>
                      <option value="md">M</option>
                      <option value="lg">L</option>
                      <option value="xl">XL</option>
                    </select>
                  </div>
                </div>
              )}
              
              {/* Item content */}
              <div className="h-full">
                {item.component}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Hook for managing dashboard layout preferences
export function useDashboardLayout(userId: string, dashboardId: string = "default") {
  const [layout, setLayout] = useState<GridLayout[]>([]);
  const [loading, setLoading] = useState(true);

  // Load saved layout
  useEffect(() => {
    const loadLayout = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/preferences`);
        if (response.ok) {
          const data = await response.json();
          const savedLayout = data.data?.dashboardLayout?.[dashboardId];
          if (savedLayout) {
            setLayout(savedLayout);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard layout:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadLayout();
    }
  }, [userId, dashboardId]);

  // Save layout
  const saveLayout = async (newLayout: GridLayout[]) => {
    try {
      setLayout(newLayout);
      
      // Save to server
      await fetch(`/api/users/${userId}/preferences`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dashboardLayout: {
            [dashboardId]: newLayout,
          },
        }),
      });
    } catch (error) {
      console.error("Failed to save dashboard layout:", error);
    }
  };

  return {
    layout,
    loading,
    saveLayout,
  };
}

// Predefined grid item components
export function GridItemWrapper({
  title,
  children,
  actions,
  loading = false,
  error,
}: {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  error?: string;
}) {
  return (
    <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          {title}
        </h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-danger-600 dark:text-danger-400">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}