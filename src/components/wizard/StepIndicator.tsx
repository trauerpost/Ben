"use client";

import { TOTAL_STEPS } from "@/lib/editor/wizard-state";

const STEP_LABELS = [
  "Size",
  "Background",
  "Photo",
  "Text",
  "Decorations",
  "Preview",
  "Order",
];

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1 md:gap-3 py-4 px-4">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={step} className="flex items-center gap-1 md:gap-3">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-primary text-white shadow-md"
                    : isCompleted
                    ? "bg-brand-primary/20 text-brand-primary"
                    : "bg-brand-light-gray text-brand-gray"
                }`}
              >
                {isCompleted ? "✓" : step}
              </div>
              <span
                className={`hidden md:block text-xs ${
                  isActive ? "text-brand-primary font-medium" : "text-brand-gray"
                }`}
              >
                {STEP_LABELS[i]}
              </span>
            </div>
            {step < TOTAL_STEPS && (
              <div
                className={`w-4 md:w-8 h-0.5 ${
                  isCompleted ? "bg-brand-primary/30" : "bg-brand-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
