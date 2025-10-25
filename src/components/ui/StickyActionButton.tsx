"use client";

import { Button } from "./Button";
import { cn } from "@/utils/cn";

interface StickyActionButtonProps {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
}

export function StickyActionButton({
  onClick,
  label,
  icon,
  variant = "primary",
  className,
}: StickyActionButtonProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white dark:from-secondary-950 via-white dark:via-secondary-950 to-transparent pointer-events-none z-40">
      <Button
        onClick={onClick}
        variant={variant}
        className={cn(
          "w-full shadow-lg pointer-events-auto",
          "min-h-[56px] text-base font-semibold",
          className
        )}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </Button>
    </div>
  );
}
