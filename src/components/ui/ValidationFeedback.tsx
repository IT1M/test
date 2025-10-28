"use client";

import { cn } from "@/utils/cn";

interface ValidationFeedbackProps {
  state: "idle" | "validating" | "valid" | "invalid";
  message?: string;
  className?: string;
}

export function ValidationFeedback({ state, message, className }: ValidationFeedbackProps) {
  if (state === "idle") {
    return null;
  }

  return (
    <div className={cn("flex items-center mt-1 text-sm", className)}>
      {state === "validating" && (
        <>
          <svg
            className="animate-spin w-4 h-4 mr-2 text-secondary-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-secondary-500 dark:text-secondary-400">
            Validating...
          </span>
        </>
      )}
      
      {state === "valid" && (
        <>
          <svg
            className="w-4 h-4 mr-2 text-success-600 dark:text-success-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-success-600 dark:text-success-400">
            {message || "Valid"}
          </span>
        </>
      )}
      
      {state === "invalid" && message && (
        <>
          <svg
            className="w-4 h-4 mr-2 text-danger-600 dark:text-danger-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span className="text-danger-600 dark:text-danger-400">
            {message}
          </span>
        </>
      )}
    </div>
  );
}