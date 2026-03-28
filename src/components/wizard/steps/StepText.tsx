"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  WIZARD_FONTS,
  FONT_COLORS,
  DIVIDER_SYMBOLS,
  DEFAULT_TEXT_CONTENT,
} from "@/lib/editor/wizard-state";
import { TEXT_TEMPLATES } from "@/lib/editor/text-templates";
import { getTemplateConfig } from "@/lib/editor/template-configs";
import type { WizardState, WizardAction, TextContent } from "@/lib/editor/wizard-state";

interface StepTextProps {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

// String fields in TextContent that can be edited
type StringField = Extract<
  keyof TextContent,
  | "heading" | "name" | "dates" | "dividerSymbol" | "quote"
  | "fontFamily" | "fontColor"
  | "relationshipLabels" | "birthDate" | "deathDate"
  | "locationBirth" | "locationDeath" | "quoteAuthor" | "closingVerse"
>;

// Mapping from requiredFields names to their labels, placeholders, and input type
const FIELD_META: Record<string, {
  label: string;
  placeholder: string;
  type: "text" | "textarea";
  required?: boolean;
  sizeField?: "headingFontSize" | "nameFontSize" | "datesFontSize" | "quoteFontSize" | "locationFontSize" | "closingVerseFontSize" | "quoteAuthorFontSize";
  sizeRange?: [number, number];
}> = {
  heading:            { label: "Heading",           placeholder: "In liebevoller Erinnerung", type: "text", sizeField: "headingFontSize", sizeRange: [6, 24] },
  relationshipLabels: { label: "Relationship",      placeholder: "Unsere liebe Mutter, Oma und Uroma", type: "text" },
  name:               { label: "Name",              placeholder: "Maria Musterfrau", type: "text", required: true, sizeField: "nameFontSize", sizeRange: [10, 40] },
  birthDate:          { label: "Birth Date",        placeholder: "* 24. Juli 1952", type: "text" },
  deathDate:          { label: "Death Date",        placeholder: "† 28. September 2020", type: "text" },
  locationBirth:      { label: "Birth Place",       placeholder: "in Starnberg", type: "text" },
  locationDeath:      { label: "Death Place",       placeholder: "in Augsburg", type: "text" },
  dates:              { label: "Dates",             placeholder: "* 24. Juli 1952 — † 28. September 2020", type: "text", sizeField: "datesFontSize", sizeRange: [8, 24] },
  dividerSymbol:      { label: "Divider",           placeholder: "", type: "text" },
  quote:              { label: "Quote",             placeholder: "Das schönste Denkmal, das ein Mensch\nbekommen kann, steht in den Herzen\nder Mitmenschen.", type: "textarea", sizeField: "quoteFontSize", sizeRange: [6, 24] },
  quoteAuthor:        { label: "Quote Author",      placeholder: "(Albert Schweitzer)", type: "text" },
  closingVerse:       { label: "Closing Verse",     placeholder: "Wir vermissen dich.", type: "text" },
};

export default function StepText({ state, dispatch }: StepTextProps) {
  const t = useTranslations("wizard.text");
  const [showConfirm, setShowConfirm] = useState<Partial<TextContent> | null>(null);

  const tc = state.textContent;
  const templates = state.cardType ? TEXT_TEMPLATES[state.cardType] : [];

  // Determine which fields to show
  const isV2 = state.templateId?.startsWith("TI") ?? false;
  const templateConfig = state.templateId ? getTemplateConfig(state.templateId) : null;

  const visibleFields = useMemo(() => {
    if (!isV2 || !templateConfig) {
      // v1 templates: show legacy fields
      return ["heading", "name", "dates", "dividerSymbol", "quote"];
    }
    return templateConfig.requiredFields;
  }, [isV2, templateConfig]);

  function applyTextTemplate(partial: Partial<TextContent>) {
    if (tc.name.trim().length > 0 || tc.heading.trim().length > 0) {
      setShowConfirm(partial);
    } else {
      doApply(partial);
    }
  }

  function doApply(partial: Partial<TextContent>) {
    const merged = { ...DEFAULT_TEXT_CONTENT, ...partial };
    for (const key of ["heading", "name", "dates", "dividerSymbol", "quote", "fontFamily", "fontColor"] as const) {
      if (merged[key] !== undefined) {
        dispatch({ type: "SET_TEXT_STRING", field: key, value: merged[key] });
      }
    }
    setShowConfirm(null);
  }

  function setString(field: StringField, value: string) {
    dispatch({ type: "SET_TEXT_STRING", field, value });
  }

  function setFontSize(field: "headingFontSize" | "nameFontSize" | "datesFontSize" | "quoteFontSize" | "locationFontSize" | "closingVerseFontSize" | "quoteAuthorFontSize", value: number) {
    dispatch({ type: "SET_TEXT_NUMBER", field, value });
  }

  function renderField(fieldName: string) {
    // Special case: divider symbol picker
    if (fieldName === "dividerSymbol") {
      return (
        <div key="dividerSymbol">
          <label className="block text-sm font-medium text-brand-dark mb-2">
            {FIELD_META.dividerSymbol.label}
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
                {sym || "None"}
              </button>
            ))}
          </div>
        </div>
      );
    }

    const meta = FIELD_META[fieldName];
    if (!meta) return null;

    const value = tc[fieldName as keyof TextContent] as string;

    return (
      <div key={fieldName}>
        <label className="block text-sm font-medium text-brand-dark mb-1">
          {meta.label}
          {meta.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {meta.type === "textarea" ? (
          <textarea
            value={value ?? ""}
            onChange={(e) => setString(fieldName as StringField, e.target.value)}
            rows={4}
            placeholder={meta.placeholder}
            className="w-full px-4 py-3 rounded-lg border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
          />
        ) : (
          <input
            type="text"
            value={value ?? ""}
            onChange={(e) => setString(fieldName as StringField, e.target.value)}
            placeholder={meta.placeholder}
            className="w-full px-4 py-2.5 rounded-lg border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
          />
        )}
        {meta.sizeField && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-brand-gray">
              {tc[meta.sizeField as keyof TextContent] as number}pt
            </span>
            <input
              type="range"
              min={meta.sizeRange?.[0] ?? 8}
              max={meta.sizeRange?.[1] ?? 24}
              value={tc[meta.sizeField as keyof TextContent] as number}
              onChange={(e) => setFontSize(meta.sizeField!, parseInt(e.target.value))}
              className="flex-1 accent-brand-primary"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-light text-brand-dark text-center mb-3">
        {t("title")}
      </h2>
      <p className="text-brand-gray text-center mb-10">
        {t("subtitle")}
      </p>

      <div>
        <div className="space-y-6">
          {/* Text template selector (v1 only) */}
          {!isV2 && templates.length > 0 && (
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

          {/* Dynamic fields */}
          {visibleFields.map(renderField)}

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
      </div>
    </div>
  );
}
