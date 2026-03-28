"use client";

import { useTranslations } from "next-intl";
import { CARD_CONFIGS } from "@/lib/editor/wizard-state";
import type { WizardState, WizardAction, CardType, CardFormat } from "@/lib/editor/wizard-state";

interface StepCardTypeProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

const CARD_TYPES: CardType[] = ["sterbebild", "trauerkarte", "dankkarte"];

const CARD_ICONS: Record<CardType, string> = {
  sterbebild: "🕯️",
  trauerkarte: "✉️",
  dankkarte: "🙏",
};

export default function StepCardType({ state, dispatch }: StepCardTypeProps) {
  const t = useTranslations("wizard.cardType");
  const selectedConfig = state.cardType ? CARD_CONFIGS[state.cardType] : null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        {t("title")}
      </h2>
      <p className="text-brand-gray text-center mb-12">
        {t("subtitle")}
      </p>

      {/* Card type selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {CARD_TYPES.map((type) => {
          const config = CARD_CONFIGS[type];
          const isSelected = state.cardType === type;
          const defaultDims = config.formats[config.availableFormats[0]];

          return (
            <button
              key={type}
              onClick={() => dispatch({ type: "SET_CARD_TYPE", cardType: type })}
              className={`relative p-6 rounded-2xl border-2 transition-all hover:shadow-lg text-left ${
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

              <div className="text-3xl mb-3">{CARD_ICONS[type]}</div>

              <h3 className="text-lg font-medium text-brand-dark mb-1">
                {t(`types.${type}.label`)}
              </h3>
              <p className="text-sm text-brand-gray mb-3">
                {t(`types.${type}.description`)}
              </p>

              {/* Size preview — proportional rectangle */}
              {defaultDims && (
                <div className="flex items-end gap-2 mt-2">
                  <div
                    className={`border-2 rounded ${
                      isSelected ? "border-brand-primary/40 bg-white" : "border-brand-border bg-brand-light-gray"
                    }`}
                    style={{
                      width: `${defaultDims.widthMm * 0.5}px`,
                      height: `${defaultDims.heightMm * 0.5}px`,
                    }}
                  />
                  <span className="text-xs text-brand-gray">{defaultDims.description}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Format toggle — only for trauerkarte and dankkarte */}
      {state.cardType && selectedConfig && selectedConfig.availableFormats.length > 1 && (
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium text-brand-dark text-center mb-4">
            {t("formatTitle")}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {selectedConfig.availableFormats.map((format: CardFormat) => {
              const dims = selectedConfig.formats[format];
              if (!dims) return null;
              const isSelected = state.cardFormat === format;

              return (
                <button
                  key={format}
                  onClick={() => dispatch({ type: "SET_CARD_FORMAT", cardFormat: format })}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    isSelected
                      ? "border-brand-primary bg-brand-primary-light"
                      : "border-brand-border bg-white hover:border-brand-gray"
                  }`}
                >
                  <p className="font-medium text-brand-dark mb-1">
                    {t(`formats.${format}`)}
                  </p>
                  <p className="text-sm text-brand-gray">{dims.description}</p>

                  {/* Proportional preview */}
                  <div className="flex justify-center mt-3">
                    <div
                      className={`border-2 rounded ${
                        isSelected ? "border-brand-primary/40 bg-white" : "border-brand-border bg-brand-light-gray"
                      }`}
                      style={{
                        width: `${Math.min(dims.widthMm * 0.4, 140)}px`,
                        height: `${dims.heightMm * 0.4}px`,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
