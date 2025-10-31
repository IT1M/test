"use client";

import * as React from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export interface FormWizardStep {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  optional?: boolean;
}

interface FormWizardProps {
  steps: FormWizardStep[];
  onComplete: (data: any) => void;
  onStepChange?: (stepIndex: number) => void;
  className?: string;
  autoSaveInterval?: number; // in milliseconds
  onAutoSave?: (data: any) => void;
}

export function FormWizard({
  steps,
  onComplete,
  onStepChange,
  className,
  autoSaveInterval = 30000, // 30 seconds default
  onAutoSave,
}: FormWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set());
  const [formData, setFormData] = React.useState<any>({});
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  // Auto-save functionality
  React.useEffect(() => {
    if (!onAutoSave) return;

    const interval = setInterval(() => {
      onAutoSave(formData);
      setLastSaved(new Date());
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [formData, autoSaveInterval, onAutoSave]);

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
      onStepChange?.(stepIndex);
    }
  };

  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps((prev) => new Set(prev).add(currentStep));
      goToStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const skipStep = () => {
    if (steps[currentStep].optional) {
      goToNextStep();
    }
  };

  const handleComplete = () => {
    setCompletedSteps((prev) => new Set(prev).add(currentStep));
    onComplete(formData);
  };

  const isStepCompleted = (stepIndex: number) => completedSteps.has(stepIndex);
  const isStepAccessible = (stepIndex: number) => {
    return stepIndex === 0 || isStepCompleted(stepIndex - 1) || stepIndex <= currentStep;
  };

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = isStepCompleted(index);
          const isCurrent = index === currentStep;
          const isAccessible = isStepAccessible(index);

          return (
            <React.Fragment key={step.id}>
              {/* Step indicator */}
              <button
                onClick={() => isAccessible && goToStep(index)}
                disabled={!isAccessible}
                className={cn(
                  "flex flex-col items-center gap-2 transition-opacity",
                  !isAccessible && "opacity-50 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      !isCompleted &&
                      "border-primary bg-background text-primary",
                    !isCurrent &&
                      !isCompleted &&
                      "border-muted-foreground/25 bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-foreground",
                      !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </div>
                  {step.optional && (
                    <div className="text-xs text-muted-foreground">Optional</div>
                  )}
                </div>
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 transition-colors",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/25"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{currentStepData.title}</CardTitle>
          {currentStepData.description && (
            <CardDescription>{currentStepData.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {/* Render current step content */}
          <div>
            {React.isValidElement(currentStepData.content)
              ? React.cloneElement(currentStepData.content as React.ReactElement<any>, {
                  formData,
                  setFormData,
                })
              : currentStepData.content}
          </div>
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Auto-save indicator */}
          {lastSaved && (
            <div className="text-xs text-muted-foreground">
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}

          {/* Skip button for optional steps */}
          {currentStepData.optional && !isLastStep && (
            <Button variant="ghost" onClick={skipStep}>
              Skip
            </Button>
          )}

          {/* Next/Complete button */}
          {isLastStep ? (
            <Button onClick={handleComplete}>
              Complete
              <Check className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={goToNextStep}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress text */}
      <div className="text-center text-sm text-muted-foreground">
        Step {currentStep + 1} of {steps.length}
      </div>
    </div>
  );
}

// Example step component wrapper
export function FormWizardStepContent({
  children,
  formData,
  setFormData,
}: {
  children: React.ReactNode;
  formData?: any;
  setFormData?: (data: any) => void;
}) {
  return <div className="space-y-4">{children}</div>;
}
