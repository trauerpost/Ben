"use client";

import { useReducer, useEffect, useCallback } from "react";
import StepIndicator from "./StepIndicator";
import {
  wizardReducer,
  initialWizardState,
  isStepValid,
  saveDraft,
  loadDraft,
  TOTAL_STEPS,
} from "@/lib/editor/wizard-state";
import type { WizardState, WizardAction } from "@/lib/editor/wizard-state";
import { getTemplateConfig } from "@/lib/editor/template-configs";

import StepCardType from "./steps/StepCardType";
import StepTemplate from "./steps/StepTemplate";
import StepBackImage from "./steps/StepBackImage";
import StepPhoto from "./steps/StepPhoto";
import StepText from "./steps/StepText";
import StepDecorations from "./steps/StepDecorations";
import StepPreview from "./steps/StepPreview";
import StepOrder from "./steps/StepOrder";

export default function WizardShell() {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      dispatch({ type: "LOAD_STATE", state: draft });
    }
  }, []);

  // Auto-save on every state change
  useEffect(() => {
    saveDraft(state);
  }, [state]);

  const canGoNext = isStepValid(state, state.currentStep);

  // Skip photo step (4) for templates that don't require a photo (e.g. TI04)
  const shouldSkipPhoto = (() => {
    if (!state.templateId) return false;
    const config = getTemplateConfig(state.templateId);
    return config ? !config.requiresPhoto : false;
  })();

  function handleNext() {
    if (shouldSkipPhoto && state.currentStep === 3) {
      dispatch({ type: "SET_STEP", step: 5 }); // skip photo → text
    } else {
      dispatch({ type: "NEXT_STEP" });
    }
  }

  function handlePrev() {
    if (shouldSkipPhoto && state.currentStep === 5) {
      dispatch({ type: "SET_STEP", step: 3 }); // skip photo ← text
    } else {
      dispatch({ type: "PREV_STEP" });
    }
  }

  const renderStep = useCallback(
    (stepState: WizardState, stepDispatch: React.Dispatch<WizardAction>) => {
      switch (stepState.currentStep) {
        case 1: return <StepCardType state={stepState} dispatch={stepDispatch} />;
        case 2: return <StepTemplate state={stepState} dispatch={stepDispatch} />;
        case 3: return <StepBackImage state={stepState} dispatch={stepDispatch} />;
        case 4: return <StepPhoto state={stepState} dispatch={stepDispatch} />;
        case 5: return <StepText state={stepState} dispatch={stepDispatch} />;
        case 6: return <StepDecorations state={stepState} dispatch={stepDispatch} />;
        case 7: return <StepPreview state={stepState} />;
        case 8: return <StepOrder state={stepState} dispatch={stepDispatch} />;
        default: return null;
      }
    },
    []
  );

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)]">
      {/* Step indicator */}
      <div className="border-b border-brand-border bg-white">
        <StepIndicator currentStep={state.currentStep} />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        {renderStep(state, dispatch)}
      </div>

      {/* Navigation — sticky at bottom of viewport */}
      <div className="sticky bottom-0 border-t border-brand-border bg-white px-6 py-4 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={state.currentStep === 1}
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-brand-gray hover:text-brand-dark hover:bg-brand-light-gray"
          >
            &larr; Back
          </button>

          <span className="text-sm text-brand-gray">
            Step {state.currentStep} of {TOTAL_STEPS}
          </span>

          {state.currentStep < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-brand-primary text-white hover:bg-brand-primary-hover"
            >
              Next &rarr;
            </button>
          ) : (
            <button
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors"
            >
              Place Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
