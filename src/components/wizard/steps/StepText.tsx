"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  WIZARD_FONTS,
  FONT_COLORS,
  DIVIDER_SYMBOLS,
  getCardDimensions,
  DEFAULT_TEXT_CONTENT,
} from "@/lib/editor/wizard-state";
import { TEXT_TEMPLATES } from "@/lib/editor/text-templates";
import type { WizardState, WizardAction, TextContent } from "@/lib/editor/wizard-state";

interface StepTextProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

export default function StepText({ state, dispatch }: StepTextProps) {
  const t = useTranslations("wizard.text");
  const [showConfirm, setShowConfirm] = useState<Partial<TextContent> | null>(null);

  const tc = state.textContent;
  const templates = state.cardType ? TEXT_TEMPLATES[state.cardType] : [];

  function applyTextTemplate(partial: Partial<TextContent>) {
    if (tc.name.trim().length > 0 || tc.heading.trim().length > 0) {
      setShowConfirm(partial);
    } else {
      doApply(partial);
    }
  }

  function doApply(partial: Partial<TextContent>) {
    const merged = { ...DEFAULT_TEXT_CONTENT, ...partial };
    // Apply each field via SET_TEXT_STRING
    for (const key of ["heading", "name", "dates", "dividerSymbol", "quote", "fontFamily", "fontColor"] as const) {
      if (merged[key] !== undefined) {
        dispatch({ type: "SET_TEXT_STRING", field: key, value: merged[key] });
      }
    }
    setShowConfirm(null);
  }

  function setString(field: "heading" | "name" | "dates" | "quote" | "fontFamily" | "fontColor" | "dividerSymbol", value: string) {
    dispatch({ type: "SET_TEXT_STRING", field, value });
  }

  function setFontSize(field: "headingFontSize" | "nameFontSize" | "datesFontSize" | "quoteFontSize", value: number) {
    dispatch({ type: "SET_TEXT_NUMBER", field, value });
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        {t("title")}
      </h2>
      <p className="text-brand-gray text-center mb-10">
        {t("subtitle")}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
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
                    onClick={() => applyTextTemplate(tpl.textContent)}
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
                      onClick={() => doApply(showConfirm)}
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

          {/* Heading */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              {t("heading")}
            </label>
            <input
              type="text"
              value={tc.heading}
              onChange={(e) => setString("heading", e.target.value)}
              placeholder={t("headingPlaceholder")}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-brand-gray">{tc.headingFontSize}px</span>
              <input
                type="range"
                min={8}
                max={24}
                value={tc.headingFontSize}
                onChange={(e) => setFontSize("headingFontSize", parseInt(e.target.value))}
                className="flex-1 accent-brand-primary"
              />
            </div>
          </div>

          {/* Name (required) */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              {t("name")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={tc.name}
              onChange={(e) => setString("name", e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-brand-gray">{tc.nameFontSize}px</span>
              <input
                type="range"
                min={14}
                max={40}
                value={tc.nameFontSize}
                onChange={(e) => setFontSize("nameFontSize", parseInt(e.target.value))}
                className="flex-1 accent-brand-primary"
              />
            </div>
          </div>

          {/* Dates */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              {t("dates")}
            </label>
            <input
              type="text"
              value={tc.dates}
              onChange={(e) => setString("dates", e.target.value)}
              placeholder={t("datesPlaceholder")}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-brand-gray">{tc.datesFontSize}px</span>
              <input
                type="range"
                min={8}
                max={24}
                value={tc.datesFontSize}
                onChange={(e) => setFontSize("datesFontSize", parseInt(e.target.value))}
                className="flex-1 accent-brand-primary"
              />
            </div>
          </div>

          {/* Divider symbol picker */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-2">
              {t("divider")}
            </label>
            <div className="flex flex-wrap gap-2">
              {DIVIDER_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  onClick={() => setString("dividerSymbol", sym)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors min-w-[48px] ${
                    tc.dividerSymbol === sym
                      ? "bg-brand-primary text-white"
                      : "bg-brand-light-gray text-brand-dark hover:bg-brand-border"
                  }`}
                >
                  {sym || t("noDivider")}
                </button>
              ))}
            </div>
          </div>

          {/* Quote */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-1">
              {t("quote")}
            </label>
            <textarea
              value={tc.quote}
              onChange={(e) => setString("quote", e.target.value)}
              rows={4}
              placeholder={t("quotePlaceholder")}
              className="w-full px-4 py-3 rounded-lg border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-brand-gray">{tc.quoteFontSize}px</span>
              <input
                type="range"
                min={8}
                max={24}
                value={tc.quoteFontSize}
                onChange={(e) => setFontSize("quoteFontSize", parseInt(e.target.value))}
                className="flex-1 accent-brand-primary"
              />
            </div>
          </div>

          {/* Shared: Font family */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-2">
              {t("font")}
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {WIZARD_FONTS.map((font) => (
                <button
                  key={font}
                  onClick={() => setString("fontFamily", font)}
                  className={`px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                    tc.fontFamily === font
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

          {/* Shared: Font color */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-2">
              {t("color")}
            </label>
            <div className="flex gap-2">
              {FONT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setString("fontColor", c.value)}
                  title={c.name}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    tc.fontColor === c.value
                      ? "border-brand-primary scale-110 shadow"
                      : "border-brand-border hover:border-brand-gray"
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          {/* Shared: Alignment */}
          <div>
            <label className="block text-sm font-medium text-brand-dark mb-2">
              {t("alignment")}
            </label>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => dispatch({ type: "SET_TEXT_ALIGN", align })}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    tc.textAlign === align
                      ? "bg-brand-primary text-white"
                      : "bg-brand-light-gray text-brand-gray hover:text-brand-dark"
                  }`}
                >
                  {align === "left" ? "\u2190" : align === "center" ? "\u2194" : "\u2192"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="flex items-start justify-center">
          <div
            className="w-full max-w-sm rounded-xl border border-brand-border bg-white shadow-lg p-8 flex flex-col items-center justify-center gap-2"
            style={{
              aspectRatio: (() => {
                const dims = getCardDimensions(state);
                return dims ? `${dims.widthMm}/${dims.heightMm}` : "3/4";
              })(),
              fontFamily: tc.fontFamily,
              color: tc.fontColor,
              textAlign: tc.textAlign,
            }}
          >
            {tc.heading && (
              <p className="w-full leading-relaxed" style={{ fontSize: `${tc.headingFontSize}px` }}>
                {tc.heading}
              </p>
            )}
            {tc.name ? (
              <p className="w-full font-semibold leading-tight" style={{ fontSize: `${tc.nameFontSize}px` }}>
                {tc.name}
              </p>
            ) : (
              <p className="w-full text-brand-gray italic" style={{ fontSize: `${tc.nameFontSize}px` }}>
                {t("namePlaceholder")}
              </p>
            )}
            {tc.dates && (
              <p className="w-full leading-relaxed" style={{ fontSize: `${tc.datesFontSize}px` }}>
                {tc.dates}
              </p>
            )}
            {tc.dividerSymbol && (
              <p className="w-full leading-relaxed text-brand-gray" style={{ fontSize: `${tc.datesFontSize}px` }}>
                {tc.dividerSymbol}
              </p>
            )}
            {tc.quote && (
              <p className="w-full whitespace-pre-wrap leading-relaxed italic" style={{ fontSize: `${tc.quoteFontSize}px` }}>
                {tc.quote}
              </p>
            )}
            {!tc.heading && !tc.name && !tc.dates && !tc.quote && (
              <p className="text-brand-gray italic text-sm">
                {t("previewEmpty")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
