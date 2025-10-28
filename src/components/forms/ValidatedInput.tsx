"use client";

import { useState, useEffect, useRef, forwardRef } from "react";
import { Input } from "@/components/ui/Input";
import { ValidationFeedback } from "@/components/ui/ValidationFeedback";
import { cn } from "@/utils/cn";

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  validator?: (value: string) => Promise<string | null> | string | null;
  debounceMs?: number;
  showValidationState?: boolean;
  validMessage?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({
    label,
    name,
    value,
    onChange,
    error,
    validator,
    debounceMs = 300,
    showValidationState = true,
    validMessage,
    helperText,
    required = false,
    className,
    ...props
  }, ref) => {
    const [validationState, setValidationState] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
    const [validationMessage, setValidationMessage] = useState<string>("");
    const debounceRef = useRef<NodeJS.Timeout>();
    const lastValueRef = useRef<string>("");

    // Validate field with debouncing
    const validateField = async (inputValue: string) => {
      if (!validator) return;

      // Don't validate empty values unless required
      if (!inputValue.trim() && !required) {
        setValidationState("idle");
        setValidationMessage("");
        return;
      }

      setValidationState("validating");

      try {
        const result = await validator(inputValue);
        
        if (result) {
          setValidationState("invalid");
          setValidationMessage(result);
        } else {
          setValidationState("valid");
          setValidationMessage(validMessage || "");
        }
      } catch (validationError) {
        console.error("Validation error:", validationError);
        setValidationState("invalid");
        setValidationMessage("Validation failed");
      }
    };

    // Handle input change with debounced validation
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(e);

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Only validate if value changed
      if (newValue !== lastValueRef.current) {
        lastValueRef.current = newValue;
        
        if (validator) {
          debounceRef.current = setTimeout(() => {
            validateField(newValue);
          }, debounceMs);
        }
      }
    };

    // Reset validation state when error prop changes
    useEffect(() => {
      if (error) {
        setValidationState("invalid");
        setValidationMessage(error);
      } else if (validationState === "invalid" && validationMessage === error) {
        setValidationState("idle");
        setValidationMessage("");
      }
    }, [error, validationState, validationMessage]);

    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    // Determine input border color based on validation state
    const getInputClassName = () => {
      if (error || validationState === "invalid") {
        return "border-danger-300 dark:border-danger-700 focus:border-danger-500 focus:ring-danger-500";
      }
      if (validationState === "valid") {
        return "border-success-300 dark:border-success-700 focus:border-success-500 focus:ring-success-500";
      }
      if (validationState === "validating") {
        return "border-primary-300 dark:border-primary-700 focus:border-primary-500 focus:ring-primary-500";
      }
      return "";
    };

    return (
      <div className={cn("space-y-1", className)}>
        <Input
          ref={ref}
          label={label}
          name={name}
          value={value}
          onChange={handleChange}
          error={error}
          required={required}
          helperText={helperText}
          className={getInputClassName()}
          {...props}
        />
        
        {showValidationState && (
          <ValidationFeedback
            state={error ? "invalid" : validationState}
            message={error || validationMessage}
          />
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";