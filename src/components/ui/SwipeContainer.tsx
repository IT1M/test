"use client";

import { useRef, useState } from "react";
import { cn } from "@/utils/cn";

interface SwipeContainerProps {
  onRefresh?: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function SwipeContainer({
  onRefresh,
  children,
  className,
}: SwipeContainerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow pull-to-refresh if scrolled to top
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!onRefresh || isRefreshing || startY.current === 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;

    // Only allow downward pulls
    if (distance > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
      // Add resistance to the pull
      const resistedDistance = Math.min(distance * 0.5, 80);
      setPullDistance(resistedDistance);
    }
  };

  const handleTouchEnd = async () => {
    if (!onRefresh || isRefreshing) {
      setPullDistance(0);
      startY.current = 0;
      return;
    }

    // Trigger refresh if pulled down enough
    if (pullDistance > 60) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error("Error refreshing:", error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }

    startY.current = 0;
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {onRefresh && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200"
          style={{
            height: pullDistance,
            opacity: pullDistance / 80,
          }}
        >
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
            {isRefreshing ? (
              <>
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span className="text-sm font-medium">Refreshing...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{
                    transform: `rotate(${Math.min(pullDistance * 3, 180)}deg)`,
                  }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
                <span className="text-sm font-medium">
                  {pullDistance > 60 ? "Release to refresh" : "Pull to refresh"}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing || pullDistance === 0 ? "transform 0.2s" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
