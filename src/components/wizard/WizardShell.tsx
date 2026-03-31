"use client";

import { useReducer, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import StepIndicator from "./StepIndicator";
import {
  wizardReducer,
  initialWizardState,
  isStepValid,
  saveDraft,
  loadDraft,
  clearDraft,
  TOTAL_STEPS,
  WIZARD_FONTS,
} from "@/lib/editor/wizard-state";
import type { WizardState, WizardAction } from "@/lib/editor/wizard-state";
import { getTemplateConfig } from "@/lib/editor/template-configs";

import SplitLayout from "./SplitLayout";
import { ActiveFieldProvider, useActiveField } from "./ActiveFieldContext";
import TextFormatToolbar from "./TextFormatToolbar";
import FontCarousel from "./FontCarousel";
import StepCardType from "./steps/StepCardType";
import StepTemplate from "./steps/StepTemplate";

import StepPhoto from "./steps/StepPhoto";
import StepText from "./steps/StepText";
import StepDecorations from "./steps/StepDecorations";
import StepPreview from "./steps/StepPreview";
import StepOrder from "./steps/StepOrder";

export default function WizardShell() {
  return (
    <ActiveFieldProvider>
      <WizardShellInner />
    </ActiveFieldProvider>
  );
}

function WizardShellInner() {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const { activeField, setActiveField } = useActiveField();
  const [validationAttempted, setValidationAttempted] = useState(false);
  const t = useTranslations("wizard.text");

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
    setValidationAttempted(true);
    if (!canGoNext) return;
    setValidationAttempted(false);
    if (shouldSkipPhoto && state.currentStep === 2) {
      dispatch({ type: "SET_STEP", step: 4 }); // skip photo → text
    } else {
      dispatch({ type: "NEXT_STEP" });
    }
  }

  function handlePrev() {
    setValidationAttempted(false);
    if (shouldSkipPhoto && state.currentStep === 4) {
      dispatch({ type: "SET_STEP", step: 2 }); // skip photo ← text
    } else {
      dispatch({ type: "PREV_STEP" });
    }
  }

  function renderStep(stepState: WizardState, stepDispatch: React.Dispatch<WizardAction>) {
    const stepContent = (() => {
      switch (stepState.currentStep) {
        case 1: return <StepCardType state={stepState} dispatch={stepDispatch} />;
        case 2: return <StepTemplate state={stepState} dispatch={stepDispatch} />;
        case 3: return <StepPhoto state={stepState} dispatch={stepDispatch} />;
        case 4: return (
          <StepText
            state={stepState}
            dispatch={stepDispatch}
            onFieldFocus={setActiveField}
            validationAttempted={validationAttempted}
          />
        );
        case 5: return <StepDecorations state={stepState} dispatch={stepDispatch} />;
        case 6: return <StepPreview state={stepState} />;
        case 7: return <StepOrder state={stepState} dispatch={stepDispatch} />;
        default: return null;
      }
    })();

    // Steps 3-5 get split layout with live preview
    if (stepState.currentStep >= 3 && stepState.currentStep <= 5) {
      const toolbar = stepState.currentStep === 4 ? (
        <>
          <TextFormatToolbar state={stepState} dispatch={stepDispatch} activeField={activeField} />
          <FontCarousel
            fonts={WIZARD_FONTS}
            selected={stepState.textContent.fontFamily}
            onSelect={(f) => stepDispatch({ type: "SET_TEXT_STRING", field: "fontFamily", value: f })}
          />
        </>
      ) : undefined;
      return <SplitLayout state={stepState} toolbar={toolbar} interactive={true} dispatch={stepDispatch}>{stepContent}</SplitLayout>;
    }

    return stepContent;
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)]">
      {/* Step indicator */}
      <div className="border-b border-brand-border bg-white">
        <StepIndicator currentStep={state.currentStep} />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {renderStep(state, dispatch)}
      </div>

      {/* Navigation — sticky at bottom of viewport */}
      <div className="sticky bottom-0 border-t border-brand-border bg-white px-6 py-4 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            {state.currentStep > 1 && (
              <button
                onClick={() => {
                  if (window.confirm("Neue Karte erstellen? Alle Eingaben werden gelöscht.")) {
                    clearDraft();
                    dispatch({ type: "RESET" });
                  }
                }}
                className="px-3 py-2 rounded-lg text-xs text-brand-gray hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Neue Karte erstellen"
              >
                Neue Karte
              </button>
            )}
            <button
              onClick={handlePrev}
              disabled={state.currentStep === 1}
              className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-brand-gray hover:text-brand-dark hover:bg-brand-light-gray"
            >
              &larr; Back
            </button>
          </div>

          <span className="text-sm text-brand-gray">
            <span className="hidden md:inline">Step </span>
            {state.currentStep}
            <span className="hidden md:inline"> of </span>
            <span className="md:hidden">/</span>
            {TOTAL_STEPS}
          </span>

          {state.currentStep < TOTAL_STEPS ? (
            <div className="flex items-center gap-2">
              {!canGoNext && validationAttempted && (
                <span className="text-xs text-red-400 hidden md:inline">
                  {state.currentStep === 1 && t("validation.selectType")}
                  {state.currentStep === 2 && t("validation.selectTemplate")}
                  {state.currentStep === 4 && t("validation.enterName")}
                </span>
              )}
              <button
                onClick={handleNext}
                aria-disabled={!canGoNext}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors bg-brand-primary text-white hover:bg-brand-primary-hover ${
                  !canGoNext ? "opacity-30 cursor-not-allowed" : ""
                }`}
              >
                Next &rarr;
              </button>
            </div>
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
