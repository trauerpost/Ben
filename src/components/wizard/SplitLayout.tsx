"use client";

import { useState } from "react";
import type { WizardState } from "@/lib/editor/wizard-state";
import SpreadPreview from "./SpreadPreview";
import CardRenderer from "./CardRenderer";

interface SplitLayoutProps {
  children: React.ReactNode;
  state: WizardState;
  toolbar?: React.ReactNode;
}

function PreviewPanel({ state }: { state: WizardState }) {
  const templateId = state.templateId;

  if (!templateId) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No template selected
      </div>
    );
  }

  // V2 templates (TI-prefix) use SpreadPreview, V1 uses CardRenderer
  if (templateId.startsWith("TI")) {
    return <SpreadPreview state={state} />;
  }

  return <CardRenderer templateId={templateId} panelId="front" state={state} />;
}

export default function SplitLayout({ children, state, toolbar }: SplitLayoutProps) {
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
      {/* Form column */}
      <div className="w-full lg:w-[55%] md:w-[60%]">
        {toolbar}
        {children}
      </div>

      {/* Preview column — desktop/tablet only */}
      <div className="hidden md:block md:w-[40%] lg:w-[45%]">
        <div className="sticky top-8">
          <PreviewPanel state={state} />
        </div>
      </div>

      {/* Mobile floating preview button — <768px only */}
      <button
        type="button"
        onClick={() => setShowMobilePreview(true)}
        className="md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-[15] bg-brand-primary text-white px-6 py-3 rounded-full shadow-lg hover:bg-brand-primary/90 transition-colors text-sm font-medium"
      >
        Preview
      </button>

      {/* Mobile bottom sheet */}
      {showMobilePreview && (
        <div className="md:hidden fixed inset-0 z-30">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMobilePreview(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 h-[70vh] bg-white rounded-t-2xl shadow-2xl flex flex-col animate-slide-up">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Preview</span>
              <button
                type="button"
                onClick={() => setShowMobilePreview(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                aria-label="Close preview"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-y-auto p-4 flex items-start justify-center">
              <div className="w-full max-w-sm">
                <PreviewPanel state={state} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
