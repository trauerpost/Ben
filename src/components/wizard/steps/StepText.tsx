"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { WIZARD_FONTS, FONT_COLORS, getCardDimensions } from "@/lib/editor/wizard-state";
import { TEXT_TEMPLATES } from "@/lib/editor/text-templates";
import type { WizardState, WizardAction } from "@/lib/editor/wizard-state";

interface StepTextProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export default function StepText({ state, dispatch }: StepTextProps) {
  const t = useTranslations("wizard.text");
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const templates = state.cardType ? TEXT_TEMPLATES[state.cardType] : [];

  function applyTemplate(text: string): void {
    if (state.text.trim().length > 0) {
      setShowConfirm(text);
    } else {
      dispatch({ type: "SET_TEXT", text });
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        Add Text
      </h2>
      <p className="text-brand-gray text-center mb-10">
        Write the text for the inside right of your card.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Controls */}
        <div className="space-y-6">
          {/* Template selector */}
          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-2">
                {t("templateTitle")}
              </label>
              <div className="flex flex-wrap gap-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl.label}
                    onClick={() => applyTemplate(tpl.text)}
                    className="px-3 py-1.5 rounded-lg text-sm border border-brand-border bg-white hover:bg-brand-light-gray transition-colors text-brand-dark"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
              {/* Confirm replace dialog */}
              {showConfirm && (
                <div className="mt-2 p-3 rounded-lg border border-amber-300 bg-amber-50">
                  <p className="text-sm text-amber-800 mb-2">{t("templateConfirm")}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        dispatch({ type: "SET_TEXT", text: showConfirm });
                        setShowConfirm(null);
                      }}
                      className="px-3 py-1 rounded text-sm bg-brand-primary text-white"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setShowConfirm(null)}
                      className="px-3 py-1 rounded text-sm bg-brand-light-gray text-brand-gray"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text input */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-2">
              Your text
            </label>
            <textarea
              value={state.text}
              onChange={(e) => dispatch({ type: "SET_TEXT", text: e.target.value })}
              rows={8}
              placeholder="Name, dates, poem, prayer..."
              className="w-full px-4 py-3 rounded-lg border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
            />
          </div>

          {/* Font selector */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-2">
              Font
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {WIZARD_FONTS.map((font) => (
                <button
                  key={font}
                  onClick={() => dispatch({ type: "SET_FONT", fontFamily: font })}
                  className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    state.fontFamily === font
                      ? "bg-brand-primary text-white"
                      : "bg-brand-light-gray text-brand-dark hover:bg-brand-border"
                  }`}
                  style={{ fontFamily: font }}
                >
                  {font}
                </button>
              ))}
            </div>
          </div>

          {/* Font size */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-2">
              Size: {state.fontSize}px
            </label>
            <input
              type="range"
              min={12}
              max={36}
              value={state.fontSize}
              onChange={(e) => dispatch({ type: "SET_FONT_SIZE", fontSize: parseInt(e.target.value) })}
              className="w-full accent-brand-primary"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {FONT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => dispatch({ type: "SET_FONT_COLOR", color: c.value })}
                  title={c.name}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    state.fontColor === c.value
                      ? "border-brand-primary scale-110 shadow"
                      : "border-brand-border hover:border-brand-gray"
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-2">
              Alignment
            </label>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => dispatch({ type: "SET_TEXT_ALIGN", align })}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    state.textAlign === align
                      ? "bg-brand-primary text-white"
                      : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
                  }`}
                >
                  {align === "left" ? "←" : align === "center" ? "↔" : "→"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="flex items-start justify-center">
          <div
            className="w-full max-w-sm rounded-xl border border-brand-border bg-white shadow-lg p-8 flex items-center justify-center"
            style={{
              aspectRatio: (() => {
                const dims = getCardDimensions(state);
                return dims ? `${dims.widthMm}/${dims.heightMm}` : "3/4";
              })(),
            }}
          >
            <p
              className="whitespace-pre-wrap leading-relaxed w-full"
              style={{
                fontFamily: state.fontFamily,
                fontSize: `${state.fontSize}px`,
                color: state.fontColor,
                textAlign: state.textAlign,
              }}
            >
              {state.text || "Your text will appear here..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
