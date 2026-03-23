"use client";

import { CARD_DIMENSIONS } from "@/lib/editor/wizard-state";
import type { WizardState, WizardAction, CardSize } from "@/lib/editor/wizard-state";

interface StepSizeProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

const sizes: CardSize[] = ["postcard", "large"];

export default function StepSize({ state, dispatch }: StepSizeProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        Choose Card Size
      </h2>
      <p className="text-brand-gray text-center mb-12">
        Select the size for your memorial card.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sizes.map((size) => {
          const dim = CARD_DIMENSIONS[size];
          const isSelected = state.size === size;
          const scale = size === "postcard" ? 0.7 : 0.85;

          return (
            <button
              key={size}
              onClick={() => dispatch({ type: "SET_SIZE", size })}
              className={`relative p-8 rounded-2xl border-2 transition-all hover:shadow-lg ${
                isSelected
                  ? "border-brand-primary bg-brand-primary-light shadow-md"
                  : "border-brand-border bg-white hover:border-brand-gray"
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}

              {/* Visual size representation */}
              <div className="flex justify-center mb-6">
                <div
                  className={`border-2 rounded-lg ${
                    isSelected ? "border-brand-primary/40 bg-white" : "border-brand-border bg-brand-light-gray"
                  }`}
                  style={{
                    width: `${dim.width * scale * 0.4}px`,
                    height: `${dim.height * scale * 0.4}px`,
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center text-xs text-brand-gray">
                    {dim.mm}
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-medium text-brand-dark mb-1">
                {dim.label}
              </h3>
              <p className="text-sm text-brand-gray">{dim.mm}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
