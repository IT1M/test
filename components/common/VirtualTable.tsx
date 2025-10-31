"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils/cn";

export interface VirtualTableColumn<TData> {
  key: string;
  header: string;
  width?: number;
  render?: (row: TData, index: number) => React.ReactNode;
  className?: string;
}

interface VirtualTableProps<TData> {
  data: TData[];
  columns: VirtualTableColumn<TData>[];
  estimateSize?: number;
  overscan?: number;
  onRowClick?: (row: TData, index: number) => void;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: TData, index: number) => string);
}

export function VirtualTable<TData extends Record<string, any>>({
  data,
  columns,
  estimateSize = 50,
  overscan = 5,
  onRowClick,
  className,
  headerClassName,
  rowClassName,
}: VirtualTableProps<TData>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div
        className={cn(
          "flex border-b bg-muted/50 font-medium",
          headerClassName
        )}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className={cn(
              "flex items-center px-4 py-3 text-sm text-muted-foreground",
              column.className
            )}
            style={{ width: column.width || "auto", flex: column.width ? undefined : 1 }}
          >
            {column.header}
          </div>
        ))}
      </div>

      {/* Virtual scrolling container */}
      <div
        ref={parentRef}
        className="overflow-auto border rounded-b-md"
        style={{ height: "600px" }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const row = data[virtualRow.index];
            const rowClass =
              typeof rowClassName === "function"
                ? rowClassName(row, virtualRow.index)
                : rowClassName;

            return (
              <div
                key={virtualRow.key}
                className={cn(
                  "absolute top-0 left-0 w-full flex border-b transition-colors hover:bg-muted/50",
                  onRowClick && "cursor-pointer",
                  rowClass
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => onRowClick?.(row, virtualRow.index)}
              >
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className={cn(
                      "flex items-center px-4 py-2 text-sm",
                      column.className
                    )}
                    style={{ width: column.width || "auto", flex: column.width ? undefined : 1 }}
                  >
                    {column.render
                      ? column.render(row, virtualRow.index)
                      : row[column.key]}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground border-t">
        <div>
          Showing {virtualItems.length > 0 ? virtualItems[0].index + 1 : 0} to{" "}
          {virtualItems.length > 0
            ? Math.min(
                virtualItems[virtualItems.length - 1].index + 1,
                data.length
              )
            : 0}{" "}
          of {data.length} rows
        </div>
        <div>Virtual scrolling enabled for optimal performance</div>
      </div>
    </div>
  );
}

// Hook for dynamic row height calculation
export function useVirtualTableWithDynamicHeight<TData>(
  data: TData[]
) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const [rowHeights, setRowHeights] = React.useState<Record<number, number>>({});

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => rowHeights[index] || 50,
    overscan: 5,
    measureElement: (element) => {
      return element.getBoundingClientRect().height;
    },
  });

  return {
    parentRef,
    rowVirtualizer,
    setRowHeights,
  };
}
